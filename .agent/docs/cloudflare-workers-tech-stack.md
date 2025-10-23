# Cloudflare Workers: Compatible Tech Stack Guide

**Date**: 2025-10-23
**Question**: What technology stack can I actually use on Cloudflare Workers?
**Context**: Workers run on V8 isolates, not Node.js - significant limitations exist

---

## TL;DR: What Works

✅ **JavaScript/TypeScript** (ES modules)
✅ **WebAssembly** (WASM) - Critical for ML models
✅ **Transformers.js** (Hugging Face) - ML inference
✅ **ONNX Runtime Web** - ML models
✅ **Most npm packages** (if browser-compatible)
✅ **Workers AI** (Cloudflare's built-in AI models)
✅ **Durable Objects** (stateful compute)
✅ **KV storage** (key-value)
✅ **R2 storage** (S3-compatible object storage)
✅ **D1 database** (SQLite at edge)

❌ **Node.js APIs** (fs, path, crypto native modules)
❌ **Packages with native bindings** (node-postgres, sharp, canvas)
❌ **Long-running processes** (>30s execution limit)
❌ **Large dependencies** (>1MB bundled code limit)

---

## Runtime Environment

### What Cloudflare Workers IS

```
Cloudflare Workers = V8 JavaScript Engine (Chrome's engine)
                   + WebAssembly support
                   + Limited Web APIs
                   + Custom Cloudflare APIs
```

**NOT Node.js**: This is critical to understand.

### What This Means

✅ **Works**:
```javascript
// Web APIs
fetch('https://api.example.com')
Response, Request, Headers
URL, URLSearchParams
TextEncoder, TextDecoder
crypto.subtle (Web Crypto API)
atob, btoa
console.log

// JavaScript built-ins
Promise, async/await
JSON.parse, JSON.stringify
Array, Object, Map, Set
RegExp, Date, Math

// ES Modules
import { pipeline } from '@xenova/transformers'
export default { fetch(request) { ... } }
```

❌ **Doesn't Work**:
```javascript
// Node.js APIs - ALL BREAK
const fs = require('fs') // ❌ No filesystem
const path = require('path') // ❌ No path module
const crypto = require('crypto') // ❌ Use crypto.subtle instead
const http = require('http') // ❌ Use fetch() instead
const buffer = require('buffer') // ⚠️ Partial support only

// Native modules
require('pg') // ❌ Native bindings won't work
require('sharp') // ❌ Image processing needs WASM
require('canvas') // ❌ Native C++ bindings
```

---

## Supported Languages & Frameworks

### 1. JavaScript / TypeScript ✅

**Primary language for Workers**

```typescript
// workers/sentiment/src/index.ts
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { text } = await request.json();
    const result = await analyzeSentiment(text);
    return new Response(JSON.stringify(result));
  },
};

async function analyzeSentiment(text: string): Promise<SentimentResult> {
  // Your logic here
  return { sentiment: 'positive', score: 0.9 };
}
```

**TypeScript support**: Full (compiles to JavaScript)

### 2. WebAssembly (WASM) ✅

**Critical for ML models**

```javascript
// Load WASM module
const wasmModule = await WebAssembly.instantiate(wasmBytes);

// Use WASM functions
const result = wasmModule.exports.runInference(inputData);
```

**Use cases**:
- ML model inference (ONNX Runtime)
- Image processing (wasm-imagemagick)
- Cryptography (libsodium.js)
- Data compression (zlib, brotli)

### 3. Python ❌ (BUT...)

**Direct Python**: Not supported

**Workaround**: Python → WASM via Pyodide

```javascript
// workers/python-ml/src/index.ts
import { loadPyodide } from 'pyodide';

export default {
  async fetch(request: Request): Promise<Response> {
    const pyodide = await loadPyodide();

    // Run Python code
    const result = await pyodide.runPythonAsync(`
      import numpy as np
      data = np.array([1, 2, 3, 4, 5])
      data.mean()
    `);

    return new Response(result.toString());
  },
};
```

**Limitation**: Pyodide is 20MB+ (too large for Workers free tier)

**Recommendation**: Don't use Python, use JavaScript with ML libraries instead

### 4. Rust ✅ (via WebAssembly)

**Compile Rust to WASM**

```rust
// src/lib.rs
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn analyze_sentiment(text: &str) -> f32 {
    // Your Rust sentiment analysis logic
    0.85
}
```

**Compile**:
```bash
wasm-pack build --target web
```

**Use in Worker**:
```javascript
import init, { analyze_sentiment } from './sentiment.wasm';

export default {
  async fetch(request: Request): Promise<Response> {
    await init();
    const { text } = await request.json();
    const score = analyze_sentiment(text);
    return new Response(JSON.stringify({ score }));
  },
};
```

**Use case**: Performance-critical computations (10-100x faster than JS)

---

## ML/AI Libraries (CRITICAL FOR US)

### 1. Transformers.js ✅ (HIGHLY RECOMMENDED)

**Hugging Face transformers in JavaScript**

```bash
npm install @xenova/transformers
```

```typescript
// workers/ml/src/index.ts
import { pipeline } from '@xenova/transformers';

let sentimentPipeline: any = null;

export default {
  async fetch(request: Request): Promise<Response> {
    const { text } = await request.json();

    // Lazy load (cached across requests)
    if (!sentimentPipeline) {
      sentimentPipeline = await pipeline(
        'sentiment-analysis',
        'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
        { device: 'wasm' } // Use WebAssembly backend
      );
    }

    const result = await sentimentPipeline(text);

    return new Response(JSON.stringify({
      label: result[0].label,
      score: result[0].score,
    }));
  },
};
```

**Models available**:
- Sentiment: DistilBERT (25MB)
- Classification: BERT, RoBERTa
- NER: bert-base-NER (40MB)
- Translation: opus-mt-* (40-60MB)
- Summarization: distilbart-cnn (50MB)
- Q&A: distilbert-squad (30MB)
- Embeddings: all-MiniLM-L6-v2 (20MB)

**Performance**: 50-200ms inference time

**Best for**: NLP tasks (sentiment, classification, NER, translation)

### 2. ONNX Runtime Web ✅

**Run ONNX models in WebAssembly**

```bash
npm install onnxruntime-web
```

```typescript
import * as ort from 'onnxruntime-web';

export default {
  async fetch(request: Request): Promise<Response> {
    // Load ONNX model
    const session = await ort.InferenceSession.create('/models/model.onnx', {
      executionProviders: ['wasm'],
    });

    // Prepare input tensor
    const input = new ort.Tensor('float32', inputData, [1, 3, 224, 224]);

    // Run inference
    const output = await session.run({ input });

    return new Response(JSON.stringify(output.output.data));
  },
};
```

**Best for**: Custom ML models (image classification, object detection)

### 3. Workers AI ✅ (Cloudflare Native)

**Cloudflare's built-in AI models**

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { text } = await request.json();

    // Use Cloudflare's built-in models
    const result = await env.AI.run('@cf/huggingface/distilbert-sst-2-int8', {
      text,
    });

    return new Response(JSON.stringify(result));
  },
};
```

**Available models**:
- Text generation: Llama 2, CodeLlama
- Text classification: DistilBERT
- Translation: M2M100, NLLB
- Image classification: ResNet-50
- Object detection: DETR
- Speech recognition: Whisper

**Pricing**: $0.01 per 1,000 requests (paid tier)

**Advantage**: No model download, instant startup

**Disadvantage**: Limited model selection, costs money

### 4. TensorFlow.js ⚠️ (Partial Support)

**Works but limited**

```bash
npm install @tensorflow/tfjs
```

```typescript
import * as tf from '@tensorflow/tfjs';

export default {
  async fetch(request: Request): Promise<Response> {
    // Load model
    const model = await tf.loadLayersModel('/models/model.json');

    // Inference
    const tensor = tf.tensor([[1, 2, 3, 4]]);
    const prediction = model.predict(tensor);

    return new Response(JSON.stringify(await prediction.data()));
  },
};
```

**Limitations**:
- Large bundle size (100KB+ just for tfjs-core)
- Slower than ONNX Runtime
- WebGL backend not available (only CPU)

**Recommendation**: Use ONNX Runtime or Transformers.js instead

---

## Database & Storage Options

### 1. Cloudflare KV ✅ (Key-Value Store)

**Best for**: Caching, session storage, small data

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Read from KV
    const cachedResult = await env.CACHE.get('sentiment:' + textHash);

    if (cachedResult) {
      return new Response(cachedResult);
    }

    // Compute and cache
    const result = await computeSentiment(text);
    await env.CACHE.put('sentiment:' + textHash, JSON.stringify(result), {
      expirationTtl: 86400, // 24 hours
    });

    return new Response(JSON.stringify(result));
  },
};
```

**Pricing**:
- Free: 100K reads/day, 1K writes/day
- Paid: $0.50 per 1M reads, $5 per 1M writes

**Limits**:
- Key: 512 bytes max
- Value: 25MB max
- Read latency: <50ms globally

**Use cases**:
- Cache ML inference results
- Store user sessions
- Feature flags

### 2. Cloudflare R2 ✅ (Object Storage)

**S3-compatible object storage**

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Store ML model
    await env.MODELS.put('sentiment-v2.onnx', modelBuffer, {
      httpMetadata: {
        contentType: 'application/octet-stream',
      },
    });

    // Retrieve model
    const model = await env.MODELS.get('sentiment-v2.onnx');
    const modelBytes = await model.arrayBuffer();

    return new Response('Model loaded');
  },
};
```

**Pricing**:
- Storage: $0.015/GB/month
- Operations: Free (no egress fees!)

**Use cases**:
- Store ML models
- Cache large assets
- User uploads

### 3. Cloudflare D1 ✅ (SQLite at Edge)

**SQL database at the edge**

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Query D1 database
    const { results } = await env.DB.prepare(
      'SELECT * FROM sentiment_cache WHERE text_hash = ?'
    ).bind(textHash).all();

    if (results.length > 0) {
      return new Response(JSON.stringify(results[0]));
    }

    // Insert new result
    await env.DB.prepare(
      'INSERT INTO sentiment_cache (text_hash, sentiment, score) VALUES (?, ?, ?)'
    ).bind(textHash, sentiment, score).run();

    return new Response(JSON.stringify({ sentiment, score }));
  },
};
```

**Pricing**:
- Free: 5M rows read/day, 100K rows written/day
- Paid: $0.001 per 1K rows read

**Limits**:
- Database size: 500MB (free), 10GB (paid)
- Query time: 30s max

**Use cases**:
- Cache with complex queries
- User data storage
- Analytics

### 4. External Databases (via Fetch)

**Connect to Aurora, Supabase, PlanetScale**

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Call Aurora Data API via HTTP
    const response = await fetch('https://api.yourdb.com/query', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.DB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: 'SELECT * FROM bookings WHERE tenant_id = $1',
        parameters: [tenantId],
      }),
    });

    const data = await response.json();
    return new Response(JSON.stringify(data));
  },
};
```

**Latency**: 100-300ms (external call)

**Use case**: Query Aurora Data API from Workers

---

## NPM Packages: What Works

### ✅ Browser-Compatible Packages

```bash
# These work fine
npm install date-fns
npm install lodash-es
npm install uuid
npm install zod
npm install jose  # JWT signing/verification
npm install nanoid
npm install js-base64
```

**Rule of thumb**: If it works in the browser, it works in Workers

### ❌ Node.js-Specific Packages

```bash
# These DON'T work
npm install pg          # ❌ Native PostgreSQL driver
npm install mysql2      # ❌ Native MySQL driver
npm install sharp       # ❌ Native image processing
npm install canvas      # ❌ Native canvas
npm install bcrypt      # ❌ Native crypto (use bcryptjs instead)
npm install nodemailer  # ❌ Node.js email (use fetch to email API)
```

### ⚠️ Packages with Alternatives

| Don't Use | Use Instead | Reason |
|-----------|-------------|--------|
| `bcrypt` | `bcryptjs` | Pure JS implementation |
| `node-fetch` | Built-in `fetch` | Workers has native fetch |
| `axios` | Built-in `fetch` | Smaller, native |
| `crypto` | `crypto.subtle` | Web Crypto API |
| `fs` | Cloudflare KV/R2 | No filesystem |
| `path` | Manual string ops | No path module |
| `stream` | Web Streams API | Use ReadableStream |

---

## Size Limits & Optimization

### Bundle Size Limits

| Tier | Script Size | Memory | CPU Time |
|------|-------------|--------|----------|
| **Free** | 1MB (compressed) | 128MB | 50ms |
| **Paid** | 10MB (compressed) | 128MB | 30s |

**Critical**: Keep dependencies small!

### Bundle Optimization

**1. Tree Shaking**

```typescript
// ❌ BAD: Imports entire library
import _ from 'lodash';

// ✅ GOOD: Import only what you need
import { debounce } from 'lodash-es';
```

**2. Dynamic Imports**

```typescript
// ❌ BAD: Load all models upfront
import { model1, model2, model3 } from './models';

// ✅ GOOD: Load on demand
export default {
  async fetch(request: Request): Promise<Response> {
    const { modelName } = await request.json();

    if (modelName === 'sentiment') {
      const { sentimentModel } = await import('./models/sentiment');
      return sentimentModel(text);
    }
  },
};
```

**3. Minification**

```bash
# wrangler automatically minifies
wrangler publish
```

---

## Recommended Tech Stack for Hospitality AI SDK

### Core Stack

```typescript
// workers/ml/package.json
{
  "dependencies": {
    "@xenova/transformers": "^2.x",     // ML inference
    "onnxruntime-web": "^1.x",          // Custom ONNX models
    "zod": "^3.x",                      // Input validation
    "jose": "^5.x",                     // JWT handling
    "date-fns": "^3.x",                 // Date utilities
    "nanoid": "^5.x"                    // ID generation
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.x",
    "typescript": "^5.x",
    "wrangler": "^3.x"
  }
}
```

### Architecture

```
┌──────────────────────────────────────────────┐
│         Cloudflare Worker (ML Inference)      │
├──────────────────────────────────────────────┤
│                                              │
│  JavaScript/TypeScript                       │
│  - Input validation (Zod)                    │
│  - Caching logic                             │
│                                              │
│  Transformers.js (NLP)                       │
│  - Sentiment analysis                        │
│  - Text classification                       │
│  - NER                                       │
│  - Translation                               │
│                                              │
│  ONNX Runtime (Custom Models)                │
│  - Room classification                       │
│  - Custom hospitality models                 │
│                                              │
│  Cloudflare KV (Cache)                       │
│  - Inference result caching                  │
│  - Model version metadata                    │
│                                              │
│  Cloudflare R2 (Models)                      │
│  - Store ONNX models                         │
│  - Versioned model storage                   │
│                                              │
└──────────────────────────────────────────────┘
```

### Example Worker

```typescript
// workers/sentiment/src/index.ts
import { pipeline } from '@xenova/transformers';
import { z } from 'zod';

// Input validation
const RequestSchema = z.object({
  text: z.string().min(1).max(5000),
  language: z.enum(['en', 'es', 'fr']).optional(),
});

// Lazy-loaded model (cached across requests)
let sentimentPipeline: any = null;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      // Parse and validate input
      const body = await request.json();
      const { text, language } = RequestSchema.parse(body);

      // Check cache first
      const cacheKey = `sentiment:${text.slice(0, 100)}`;
      const cached = await env.CACHE.get(cacheKey);
      if (cached) {
        return new Response(cached, {
          headers: { 'X-Cache': 'HIT' },
        });
      }

      // Load model (lazy)
      if (!sentimentPipeline) {
        sentimentPipeline = await pipeline(
          'sentiment-analysis',
          'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
          { device: 'wasm' }
        );
      }

      // Run inference
      const startTime = Date.now();
      const result = await sentimentPipeline(text);
      const latency = Date.now() - startTime;

      const response = {
        sentiment: result[0].label.toLowerCase(),
        score: result[0].score,
        latency,
        source: 'cloudflare-edge',
        cached: false,
      };

      // Cache result (24 hours)
      await env.CACHE.put(cacheKey, JSON.stringify(response), {
        expirationTtl: 86400,
      });

      return new Response(JSON.stringify(response), {
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'MISS',
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: error.message,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};

// Type definitions
interface Env {
  CACHE: KVNamespace;
  MODELS: R2Bucket;
}
```

---

## Deployment

### Using Wrangler CLI

```bash
# Install
npm install -g wrangler

# Login
wrangler login

# Initialize project
wrangler init sentiment-worker

# Develop locally
wrangler dev

# Deploy
wrangler publish
```

### Configuration

```toml
# wrangler.toml
name = "hospitality-ai-sentiment"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# Bindings
kv_namespaces = [
  { binding = "CACHE", id = "your-kv-id" }
]

r2_buckets = [
  { binding = "MODELS", bucket_name = "ml-models" }
]

# Limits
[limits]
cpu_ms = 50  # Free tier: 50ms
```

---

## Conclusion

### ✅ Recommended for Hospitality AI SDK

**Core Stack**:
- **Language**: TypeScript
- **ML Library**: Transformers.js (@xenova/transformers)
- **Custom Models**: ONNX Runtime Web
- **Validation**: Zod
- **Caching**: Cloudflare KV
- **Model Storage**: Cloudflare R2

**Why This Works**:
1. All browser-compatible (no Node.js dependencies)
2. Bundle size < 1MB (fits free tier)
3. 50-200ms inference time
4. $0.50 per 1M requests
5. Global edge deployment
6. Zero cold starts

### ❌ Don't Try to Use

- Python directly (use Python→WASM if absolutely needed)
- Node.js-specific packages (fs, path, crypto native)
- Native bindings (pg, sharp, canvas)
- TensorFlow.js (use ONNX Runtime instead)
- Large dependencies (>1MB)

### 🎯 For Hospitality AI SDK

**Week 1 Implementation**:
1. Create Worker with Transformers.js
2. Implement sentiment analysis endpoint
3. Add KV caching
4. Deploy to edge
5. Test globally

**Result**: <200ms sentiment analysis globally at $0.0000005 per request

---

*Last Updated: 2025-10-23*
*Version: 1.0*

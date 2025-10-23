# ML Library Integration Analysis: REST API & Docker Strategy

**Date**: 2025-10-23
**Purpose**: Identify high-value ML libraries for containerized integration
**Strategy**: Follow Timefold pattern - wrap best-in-class libraries as microservices

---

## Executive Summary

**Key Insight**: While JavaScript/TypeScript is great for application logic, many ML tasks are better served by specialized Python/R/Java libraries with years of optimization. By containerizing these as REST APIs, we get:

1. **Best-in-class performance** (use the right tool for each job)
2. **Language independence** (TypeScript app calls Python/Java services)
3. **Easy scaling** (scale specific services independently)
4. **Cost optimization** (only run when needed)
5. **Competitive advantage** (leverage cutting-edge research)

**Recommendation**: Integrate 6 high-priority libraries as containerized microservices.

---

## Current State Assessment

### ✅ What We Have (JavaScript/TypeScript)

| Module | Implementation | Performance | Limitation |
|--------|----------------|-------------|------------|
| Dynamic Pricing | TS algorithms | Fast (10ms) | ✅ Good enough |
| Sentiment Analysis | Keyword-based | Fast (5ms) | ⚠️ Could improve with NLP |
| Room Allocation | Constraint solver | Medium (50ms) | ⚠️ Timefold better for complex |
| Demand Forecasting | Time series (ARIMA-like) | Fast (20ms) | ⚠️ Could improve with ML |
| Long-Term Forecasting | Decomposition | Fast (30ms) | ⚠️ Prophet/LSTM better |
| Quality Assurance | Rule-based | Fast (15ms) | ✅ Good enough |
| Guest Journey | Analytics | Fast (10ms) | ✅ Good enough |
| Competitive Intel | Analytics | Fast (10ms) | ✅ Good enough |
| Sustainability | Calculation | Fast (8ms) | ✅ Good enough |
| Real-Time Streaming | Event processing | Fast (5ms) | ✅ Good enough |
| Computer Vision | Algorithmic (placeholder) | N/A | 🔴 Needs real CV |
| Voice/Speech | Text analysis | Fast (12ms) | 🔴 Needs real speech |

**Gap Summary**:
- 🔴 **Critical Gaps**: Computer vision, speech/voice analysis
- ⚠️ **Enhancement Opportunities**: NLP, forecasting, optimization
- ✅ **Adequate**: Pricing, allocation (basic), analytics, streaming

---

## High-Priority Library Integrations

### 1. 🔴 Computer Vision (Critical)

#### Current State
- Algorithmic simulation only
- No real image processing
- Placeholder for TensorFlow.js

#### Best Libraries

**Option A: YOLO (You Only Look Once) - Object Detection**
- **Language**: Python (PyTorch/Darknet)
- **Use Case**: Real-time object detection in facility images
- **Performance**: 45 FPS on GPU, 5 FPS on CPU
- **Docker Image**: `ultralytics/yolov8` (official)
- **Size**: ~2GB
- **Cost**: $0.01-0.05 per image (GPU instance)

**Business Value**:
- Detect amenities in photos (pool, gym, parking)
- Identify safety hazards (wet floors, obstacles)
- Count occupancy in public spaces
- Monitor cleanliness standards
- Asset condition assessment

**Integration Pattern**:
```typescript
// TypeScript client
const result = await visionService.detect({
  imageUrl: 's3://bucket/room-123.jpg',
  models: ['amenities', 'cleanliness', 'safety'],
  confidence: 0.7
});

// Response
{
  amenities: [
    { type: 'bed', confidence: 0.95, bbox: [10, 20, 100, 150] },
    { type: 'tv', confidence: 0.89, bbox: [200, 50, 280, 120] }
  ],
  cleanliness: {
    score: 85,
    issues: [
      { type: 'stain', location: [150, 200], severity: 'minor' }
    ]
  },
  safety: {
    hazards: [],
    score: 100
  }
}
```

**Recommendation**: **HIGH PRIORITY** - Containerize YOLO with FastAPI wrapper

---

**Option B: Segment Anything Model (SAM) - Meta**
- **Language**: Python (PyTorch)
- **Use Case**: Precise image segmentation
- **Performance**: 0.5s per image on GPU
- **Docker**: Custom (Meta model)
- **Size**: ~3GB

**Business Value**:
- Room layout analysis
- Furniture detection and placement
- Space utilization measurement
- Damage assessment (precise boundaries)

**Recommendation**: **MEDIUM PRIORITY** - Consider after YOLO

---

### 2. 🔴 Speech/Voice Analysis (Critical)

#### Current State
- Text-based analysis only (assumes transcription exists)
- No actual speech-to-text
- No audio feature extraction

#### Best Libraries

**Option A: Whisper (OpenAI) - Speech-to-Text**
- **Language**: Python (PyTorch)
- **Use Case**: Transcribe phone calls, voice messages
- **Performance**: 1x realtime (faster-whisper variant: 4x realtime)
- **Docker**: `onerahmet/openai-whisper-asr-webservice`
- **Size**: 1.5GB (base model)
- **Cost**: $0.001-0.01 per minute (self-hosted)

**Business Value**:
- Transcribe guest phone calls (booking inquiries)
- Analyze voice messages
- Extract booking details from calls
- Sentiment from tone/voice characteristics
- Multi-language support (99 languages)

**Integration Pattern**:
```typescript
// TypeScript client
const result = await speechService.transcribe({
  audioUrl: 's3://calls/booking-123.mp3',
  language: 'auto', // Auto-detect
  includeTimestamps: true,
  includeSentiment: true
});

// Response
{
  transcript: "Hi, I'd like to book a room for next weekend...",
  language: 'en',
  confidence: 0.94,
  segments: [
    { start: 0.0, end: 2.5, text: "Hi, I'd like to book a room" },
    { start: 2.5, end: 5.0, text: "for next weekend" }
  ],
  sentiment: {
    overall: 'positive',
    tone: 'friendly',
    urgency: 'medium'
  },
  entities: {
    intent: 'booking',
    dateRange: { start: '2025-10-30', end: '2025-11-01' },
    partySize: null
  }
}
```

**Recommendation**: **HIGH PRIORITY** - Containerize Whisper with FastAPI

---

**Option B: pyannote.audio - Speaker Diarization**
- **Language**: Python (PyTorch)
- **Use Case**: Identify who's speaking (guest vs. staff)
- **Performance**: 1x realtime
- **Docker**: Custom
- **Size**: 500MB

**Business Value**:
- Separate guest from staff in recordings
- Multi-speaker call analysis
- Agent performance evaluation
- Call quality metrics

**Recommendation**: **MEDIUM PRIORITY** - Add after Whisper

---

### 3. ⚠️ Advanced Forecasting (Enhancement)

#### Current State
- Basic time series decomposition (JavaScript)
- Moving averages, seasonality detection
- Good for simple forecasts

#### Best Libraries

**Option A: Prophet (Meta)**
- **Language**: Python/R
- **Use Case**: Robust time series forecasting with holidays/events
- **Performance**: <1s for typical hospitality data
- **Docker**: `docker.io/roboxes/prophet`
- **Size**: 800MB
- **Cost**: Negligible (CPU-only)

**Business Value**:
- Handle missing data gracefully
- Automatic holiday/event detection
- Uncertainty intervals
- Trend changepoint detection
- Better accuracy for irregular patterns

**Integration Pattern**:
```typescript
// TypeScript client
const result = await forecastService.prophet({
  historical: [
    { date: '2025-01-01', value: 150 },
    { date: '2025-01-02', value: 165 },
    // ... daily booking data
  ],
  periods: 90, // 90 days ahead
  includeEvents: [
    { name: 'Christmas', date: '2025-12-25', window: 7 },
    { name: 'Local Festival', date: '2025-07-15', window: 3 }
  ],
  confidence: 0.95
});

// Response
{
  forecast: [
    { date: '2025-10-24', prediction: 180, lower: 160, upper: 200 },
    { date: '2025-10-25', prediction: 185, lower: 163, upper: 207 },
    // ... 90 days
  ],
  trend: 'increasing',
  seasonality: {
    weekly: { strength: 0.3, pattern: [0.9, 0.95, 1.0, 1.05, 1.2, 1.3, 1.1] },
    yearly: { strength: 0.6, peaks: ['summer', 'holidays'] }
  },
  events: [
    { name: 'Christmas', impact: +45, confidence: 0.9 }
  ]
}
```

**Recommendation**: **MEDIUM PRIORITY** - Significant accuracy improvement

---

**Option B: NeuralProphet**
- **Language**: Python (PyTorch)
- **Use Case**: Neural network-based forecasting
- **Performance**: Slower than Prophet but more accurate
- **Docker**: Custom
- **Size**: 1.2GB

**Business Value**:
- Better with complex patterns
- Deep learning benefits
- Auto-regressive modeling

**Recommendation**: **LOW PRIORITY** - Prophet sufficient for most cases

---

### 4. ⚠️ Natural Language Processing (Enhancement)

#### Current State
- Keyword-based sentiment (fast but limited)
- Simple text analysis

#### Best Libraries

**Option A: Hugging Face Transformers (BERT, RoBERTa)**
- **Language**: Python (PyTorch/TensorFlow)
- **Use Case**: Advanced NLP (sentiment, classification, NER)
- **Performance**: 10-100ms per review (depending on model size)
- **Docker**: `huggingface/transformers-pytorch-gpu`
- **Size**: 2-5GB (depending on model)
- **Cost**: $0.0001-0.001 per review

**Business Value**:
- Much better sentiment accuracy (85% → 95%)
- Emotion detection (angry, happy, frustrated)
- Aspect-based sentiment (room: positive, service: negative)
- Multi-language support
- Named entity recognition (extract dates, amounts, names)

**Integration Pattern**:
```typescript
// TypeScript client
const result = await nlpService.analyze({
  text: "The room was beautiful but the check-in took forever!",
  tasks: ['sentiment', 'emotion', 'aspects', 'entities'],
  language: 'en'
});

// Response
{
  sentiment: {
    overall: 'mixed',
    score: 0.3, // -1 to +1
    confidence: 0.91
  },
  emotions: [
    { type: 'satisfaction', score: 0.7, aspect: 'room' },
    { type: 'frustration', score: 0.8, aspect: 'check-in' }
  ],
  aspects: [
    { aspect: 'room', sentiment: 'positive', score: 0.85 },
    { aspect: 'check-in', sentiment: 'negative', score: -0.72 }
  ],
  entities: [
    { type: 'duration', value: 'forever', normalized: 'long_wait' }
  ]
}
```

**Recommendation**: **HIGH PRIORITY** - Significant quality improvement

---

**Option B: spaCy**
- **Language**: Python
- **Use Case**: Fast NLP (tokenization, NER, POS tagging)
- **Performance**: Very fast (< 10ms per review)
- **Docker**: `spacy/spacy-docker`
- **Size**: 1GB

**Business Value**:
- Faster than Transformers
- Good for entity extraction
- Production-ready

**Recommendation**: **MEDIUM PRIORITY** - Use for speed-critical tasks

---

### 5. ⚠️ Advanced Optimization (Enhancement)

#### Current State
- Basic constraint satisfaction (JavaScript)
- Good for simple allocation
- Timefold integration planned

#### Best Libraries

**Option A: Google OR-Tools**
- **Language**: Python/C++/Java
- **Use Case**: Complex optimization (routing, scheduling, allocation)
- **Performance**: Milliseconds to minutes (problem-dependent)
- **Docker**: Custom
- **Size**: 300MB
- **Cost**: Free (Apache 2.0)

**Business Value**:
- Vehicle routing (housekeeping routes)
- Staff scheduling with constraints
- Multi-property allocation
- Resource optimization
- Complex constraint solving

**Integration Pattern**:
```typescript
// TypeScript client
const result = await optimizationService.schedule({
  tasks: [
    { id: 'room-101', duration: 30, priority: 'high' },
    { id: 'room-102', duration: 45, priority: 'medium' },
    // ... 50 rooms
  ],
  workers: [
    { id: 'housekeeper-1', shift: '08:00-16:00', skills: ['standard'] },
    { id: 'housekeeper-2', shift: '09:00-17:00', skills: ['standard', 'deep-clean'] }
  ],
  constraints: {
    maxTasksPerWorker: 12,
    breakDuration: 30,
    travelTime: 5 // minutes between rooms
  }
});

// Response
{
  schedule: [
    {
      worker: 'housekeeper-1',
      assignments: [
        { task: 'room-101', start: '08:00', end: '08:30' },
        { task: 'break', start: '12:00', end: '12:30' },
        // ...
      ],
      totalTime: 480, // minutes
      utilization: 0.88
    }
  ],
  metrics: {
    totalCost: 240, // labor cost
    completionTime: '16:00',
    efficiency: 0.92
  }
}
```

**Recommendation**: **MEDIUM PRIORITY** - Use with Timefold for different problem types

---

### 6. 🟢 Anomaly Detection (New Capability)

#### Current State
- Basic threshold-based detection
- Z-score in streaming module

#### Best Libraries

**Option A: PyOD (Python Outlier Detection)**
- **Language**: Python (scikit-learn)
- **Use Case**: Multi-algorithm anomaly detection
- **Performance**: Fast (<100ms for typical datasets)
- **Docker**: Custom
- **Size**: 500MB
- **Cost**: Negligible

**Business Value**:
- Detect unusual booking patterns (fraud)
- Identify price anomalies
- Find operational outliers
- Revenue anomaly detection
- Guest behavior anomalies

**Integration Pattern**:
```typescript
// TypeScript client
const result = await anomalyService.detect({
  data: [
    { date: '2025-10-01', bookings: 45, revenue: 6500 },
    { date: '2025-10-02', bookings: 48, revenue: 7200 },
    { date: '2025-10-03', bookings: 120, revenue: 2500 }, // Anomaly!
    // ...
  ],
  features: ['bookings', 'revenue', 'avg_daily_rate'],
  algorithm: 'isolation_forest',
  sensitivity: 0.05 // 5% outliers expected
});

// Response
{
  anomalies: [
    {
      date: '2025-10-03',
      score: 0.95, // anomaly score
      reasons: [
        'bookings: 2.5x above average',
        'revenue: 60% below expected for booking count'
      ],
      severity: 'high',
      recommendation: 'Investigate potential data entry error or fraud'
    }
  ],
  normalRanges: {
    bookings: { min: 40, max: 55, mean: 47 },
    revenue: { min: 6000, max: 8000, mean: 7100 }
  }
}
```

**Recommendation**: **LOW PRIORITY** - Nice to have, current Z-score adequate

---

## Integration Architecture

### Microservices Pattern (Recommended)

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Application                       │
│                  (TypeScript/Node.js)                        │
└────────┬────────────────────────────────────────────────────┘
         │
         │ REST API calls
         │
┌────────▼────────────────────────────────────────────────────┐
│                    API Gateway (tRPC)                        │
│                  - Rate limiting                             │
│                  - Authentication                            │
│                  - Request routing                           │
└────────┬────────────────────────────────────────────────────┘
         │
         ├────────────┬──────────────┬──────────────┬──────────┤
         │            │              │              │          │
    ┌────▼───┐  ┌────▼───┐    ┌─────▼────┐   ┌────▼───┐ ┌───▼────┐
    │ Vision │  │ Speech │    │ NLP      │   │Prophet │ │OR-Tools│
    │(YOLO)  │  │(Whisper│    │(BERT)    │   │        │ │        │
    │Docker  │  │Docker  │    │Docker    │   │Docker  │ │Docker  │
    │FastAPI │  │FastAPI │    │FastAPI   │   │FastAPI │ │FastAPI │
    └────────┘  └────────┘    └──────────┘   └────────┘ └────────┘
         │            │              │              │          │
         └────────────┴──────────────┴──────────────┴──────────┘
                                     │
                            ┌────────▼────────┐
                            │ S3 / CloudFront │
                            │ (Image/Audio)   │
                            └─────────────────┘
```

### Docker Compose Configuration

```yaml
# docker-compose.ml.yml
version: '3.8'

services:
  vision-service:
    image: hospitality-ai/vision-yolo:latest
    build:
      context: ./ml-services/vision
      dockerfile: Dockerfile
    ports:
      - "8001:8000"
    environment:
      - MODEL_PATH=/models/yolov8n.pt
      - CONFIDENCE_THRESHOLD=0.7
      - BATCH_SIZE=4
    volumes:
      - ./models/vision:/models
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  speech-service:
    image: hospitality-ai/speech-whisper:latest
    build:
      context: ./ml-services/speech
      dockerfile: Dockerfile
    ports:
      - "8002:8000"
    environment:
      - MODEL_SIZE=base
      - LANGUAGE=auto
      - TASK=transcribe
    volumes:
      - ./models/speech:/models

  nlp-service:
    image: hospitality-ai/nlp-bert:latest
    build:
      context: ./ml-services/nlp
      dockerfile: Dockerfile
    ports:
      - "8003:8000"
    environment:
      - MODEL_NAME=distilbert-base-uncased-finetuned-sst-2-english
      - MAX_LENGTH=512
    volumes:
      - ./models/nlp:/models

  forecast-service:
    image: hospitality-ai/forecast-prophet:latest
    build:
      context: ./ml-services/forecast
      dockerfile: Dockerfile
    ports:
      - "8004:8000"
    environment:
      - GROWTH=linear
      - SEASONALITY_MODE=multiplicative

networks:
  ml-network:
    driver: bridge
```

---

## Cost Analysis

### Infrastructure Costs (Monthly)

| Service | Instance Type | Hours/Month | Cost/Month | Usage Pattern |
|---------|--------------|-------------|------------|---------------|
| **Vision (YOLO)** | g4dn.xlarge (GPU) | 50 hrs | $260 | On-demand (image analysis) |
| **Speech (Whisper)** | c6i.2xlarge (CPU) | 100 hrs | $200 | On-demand (call processing) |
| **NLP (BERT)** | c6i.xlarge (CPU) | 200 hrs | $160 | Semi-continuous (review analysis) |
| **Prophet** | t3.medium (CPU) | 50 hrs | $15 | On-demand (forecasting) |
| **OR-Tools** | c6i.large (CPU) | 100 hrs | $40 | Scheduled (daily optimization) |
| **Container Registry** | ECR | - | $10 | Storage |
| **Load Balancer** | ALB | 730 hrs | $16 | Always-on |
| **Total (Dev)** | - | - | **$701/month** | Light usage |
| **Total (Prod - 100 customers)** | - | - | **$2,100/month** | Moderate usage |

### Cost Per Operation

| Service | Cost per Request | Notes |
|---------|-----------------|-------|
| Vision | $0.01-0.05 | Depends on image size, GPU time |
| Speech | $0.001-0.01 | Per minute of audio |
| NLP | $0.0001-0.001 | Per review/text analysis |
| Prophet | $0.001 | Per forecast run |
| OR-Tools | $0.01 | Per optimization run |

### Cost vs. Value

**Vision Service**:
- Cost: $0.03/image average
- Value: $5-10 saved per manual inspection
- ROI: 167-333x

**Speech Service**:
- Cost: $0.005/minute
- Value: $2-3 saved per call (no manual transcription)
- ROI: 400-600x

**NLP Service**:
- Cost: $0.0005/review
- Value: $0.10-0.50 (better sentiment = better response)
- ROI: 200-1000x

**Conclusion**: All services have strong positive ROI.

---

## Implementation Priority Matrix

| Service | Business Value | Technical Complexity | ROI | Priority | Timeline |
|---------|----------------|---------------------|-----|----------|----------|
| **Vision (YOLO)** | 🔴 Critical | Medium | 300x | 🔥 **P0** | Month 4 |
| **Speech (Whisper)** | 🔴 Critical | Medium | 500x | 🔥 **P0** | Month 4 |
| **NLP (BERT)** | 🟡 High | Low | 500x | **P1** | Month 5 |
| **Prophet** | 🟡 High | Low | 50x | **P1** | Month 5 |
| **OR-Tools** | 🟢 Medium | High | 100x | **P2** | Month 6 |
| **PyOD (Anomaly)** | 🟢 Low | Low | 20x | **P3** | Month 8 |

**Recommendation**: Start with Vision + Speech in Month 4 (after MVP launch).

---

## Integration Timeline

### Month 4 (After MVP)
**Focus**: Computer Vision + Speech

**Week 1-2: Vision Service**
- [ ] Containerize YOLOv8 with FastAPI wrapper
- [ ] Create TypeScript SDK client
- [ ] Test with sample images
- [ ] Deploy to ECS/Fargate
- [ ] Add to pricing module (amenity detection)

**Week 3-4: Speech Service**
- [ ] Containerize Whisper with FastAPI wrapper
- [ ] Create TypeScript SDK client
- [ ] Test with sample audio
- [ ] Deploy to ECS/Fargate
- [ ] Add to voice analysis module

**Deliverable**: 2 production microservices

### Month 5
**Focus**: NLP + Forecasting

**Week 1-2: NLP Service**
- [ ] Container with DistilBERT (smaller, faster)
- [ ] Fine-tune on hospitality reviews
- [ ] TypeScript client
- [ ] Deploy
- [ ] Replace keyword-based sentiment

**Week 3-4: Prophet Service**
- [ ] Container with Prophet
- [ ] TypeScript client
- [ ] A/B test vs. current forecasting
- [ ] Deploy
- [ ] Switch to Prophet for long-term forecasts

**Deliverable**: Enhanced sentiment + forecasting

### Month 6
**Focus**: Optimization

**Week 1-4: OR-Tools Service**
- [ ] Container with OR-Tools
- [ ] Implement common hospitality problems
  - Staff scheduling
  - Housekeeping routing
  - Multi-property allocation
- [ ] TypeScript client
- [ ] Deploy
- [ ] Create optimization dashboard

**Deliverable**: Advanced optimization capabilities

---

## Technical Implementation Guide

### Example: Vision Service (YOLOv8)

#### Dockerfile
```dockerfile
# ml-services/vision/Dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Download YOLOv8 model
RUN python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"

# Expose port
EXPOSE 8000

# Run FastAPI
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### FastAPI Application
```python
# ml-services/vision/main.py
from fastapi import FastAPI, File, UploadFile
from ultralytics import YOLO
import numpy as np
from PIL import Image
import io

app = FastAPI(title="Vision Service")
model = YOLO('yolov8n.pt')

@app.post("/detect")
async def detect_objects(
    file: UploadFile = File(...),
    confidence: float = 0.7
):
    # Read image
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))

    # Run detection
    results = model(image, conf=confidence)

    # Parse results
    detections = []
    for r in results:
        for box in r.boxes:
            detections.append({
                "class": model.names[int(box.cls)],
                "confidence": float(box.conf),
                "bbox": box.xyxy[0].tolist()
            })

    return {
        "detections": detections,
        "count": len(detections)
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}
```

#### TypeScript SDK Client
```typescript
// lib/ml-services/vision-client.ts
export class VisionServiceClient {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.VISION_SERVICE_URL!) {
    this.baseUrl = baseUrl;
  }

  async detectObjects(
    imageBuffer: Buffer,
    confidence: number = 0.7
  ): Promise<VisionDetectionResult> {
    const formData = new FormData();
    formData.append('file', new Blob([imageBuffer]));

    const response = await fetch(`${this.baseUrl}/detect?confidence=${confidence}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Vision service error: ${response.statusText}`);
    }

    return response.json();
  }

  async analyzeRoomImage(imageUrl: string): Promise<RoomAnalysis> {
    // Download image
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Detect objects
    const detections = await this.detectObjects(imageBuffer);

    // Classify results for hospitality
    const amenities = detections.detections
      .filter(d => AMENITY_CLASSES.includes(d.class))
      .map(d => ({
        type: d.class,
        confidence: d.confidence,
      }));

    const cleanliness = this.assessCleanliness(detections);
    const safety = this.assessSafety(detections);

    return {
      amenities,
      cleanliness,
      safety,
      rawDetections: detections,
    };
  }

  private assessCleanliness(detections: VisionDetectionResult): CleanlinessScore {
    // Logic to determine cleanliness from detected objects
    const dirtyIndicators = detections.detections.filter(d =>
      ['stain', 'dirt', 'trash'].includes(d.class)
    );

    const score = Math.max(0, 100 - dirtyIndicators.length * 10);

    return {
      score,
      issues: dirtyIndicators.map(d => ({
        type: d.class,
        severity: d.confidence > 0.9 ? 'high' : 'medium',
      })),
    };
  }

  private assessSafety(detections: VisionDetectionResult): SafetyScore {
    // Logic to determine safety from detected objects
    const hazards = detections.detections.filter(d =>
      ['wet_floor', 'obstacle', 'fire_hazard'].includes(d.class)
    );

    return {
      score: hazards.length === 0 ? 100 : Math.max(0, 100 - hazards.length * 25),
      hazards: hazards.map(d => ({
        type: d.class,
        severity: 'high',
        location: d.bbox,
      })),
    };
  }
}

// Usage in application
const visionClient = new VisionServiceClient();

const analysis = await visionClient.analyzeRoomImage(
  'https://cdn.hotel.com/rooms/101.jpg'
);

console.log(`Room cleanliness: ${analysis.cleanliness.score}/100`);
console.log(`Safety score: ${analysis.safety.score}/100`);
console.log(`Amenities detected: ${analysis.amenities.map(a => a.type).join(', ')}`);
```

---

## Deployment Strategy

### AWS ECS/Fargate (Recommended)

**Advantages**:
- Serverless containers (no EC2 management)
- Auto-scaling based on demand
- Pay per use
- Integrated with ALB

**Configuration**:
```typescript
// infrastructure/lib/ml-services-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';

export class MLServicesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new ec2.Vpc(this, 'MLServicesVPC', {
      maxAzs: 2,
    });

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'MLServicesCluster', {
      vpc,
      containerInsights: true,
    });

    // Vision Service
    const visionTaskDef = new ecs.FargateTaskDefinition(this, 'VisionTask', {
      memoryLimitMiB: 4096,
      cpu: 2048,
    });

    visionTaskDef.addContainer('vision', {
      image: ecs.ContainerImage.fromRegistry('hospitality-ai/vision:latest'),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'vision' }),
      portMappings: [{ containerPort: 8000 }],
      environment: {
        MODEL_PATH: '/models/yolov8n.pt',
        CONFIDENCE_THRESHOLD: '0.7',
      },
    });

    const visionService = new ecs.FargateService(this, 'VisionService', {
      cluster,
      taskDefinition: visionTaskDef,
      desiredCount: 1,
      minHealthyPercent: 50,
      maxHealthyPercent: 200,
    });

    // Auto-scaling
    const visionScaling = visionService.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 10,
    });

    visionScaling.scaleOnCpuUtilization('VisionCpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // ALB
    const lb = new elbv2.ApplicationLoadBalancer(this, 'MLLB', {
      vpc,
      internetFacing: true,
    });

    const listener = lb.addListener('MLListener', {
      port: 80,
    });

    listener.addTargets('VisionTarget', {
      port: 8000,
      targets: [visionService],
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
      },
    });

    // Output
    new cdk.CfnOutput(this, 'VisionServiceURL', {
      value: `http://${lb.loadBalancerDnsName}/vision`,
    });
  }
}
```

---

## Monitoring & Observability

### CloudWatch Metrics

```typescript
// Emit custom metrics from ML services
await cloudwatch.putMetricData({
  Namespace: 'HospitalityAI/MLServices',
  MetricData: [
    {
      MetricName: 'VisionInferenceTime',
      Value: inferenceTime,
      Unit: 'Milliseconds',
      Dimensions: [
        { Name: 'Service', Value: 'vision' },
        { Name: 'Model', Value: 'yolov8n' },
      ],
    },
    {
      MetricName: 'VisionDetectionCount',
      Value: detections.length,
      Unit: 'Count',
    },
  ],
});
```

### Alerts
- Inference time > 5s
- Error rate > 5%
- CPU utilization > 80%
- Memory usage > 90%

---

## Cost Optimization Strategies

### 1. Model Caching
```python
# Cache models in memory (don't reload per request)
model = YOLO('yolov8n.pt')  # Load once at startup
```

### 2. Batch Processing
```python
# Process multiple images in one batch
@app.post("/detect/batch")
async def detect_batch(files: List[UploadFile]):
    images = [Image.open(io.BytesIO(await f.read())) for f in files]
    results = model(images)  # Batch inference (faster)
    return [parse_result(r) for r in results]
```

### 3. Model Quantization
```python
# Use smaller, faster models
model = YOLO('yolov8n-int8.pt')  # Quantized to INT8 (2x faster, 4x smaller)
```

### 4. Spot Instances
```typescript
// Use Fargate Spot for 70% cost savings (non-critical workloads)
capacityProviderStrategies: [
  {
    capacityProvider: 'FARGATE_SPOT',
    weight: 2,
  },
  {
    capacityProvider: 'FARGATE',
    weight: 1,
  },
],
```

### 5. Auto-Scaling to Zero
```typescript
// Scale down to 0 during off-peak hours
visionScaling.scaleOnSchedule('ScaleDown', {
  schedule: autoscaling.Schedule.cron({ hour: '22', minute: '0' }),
  minCapacity: 0,
  maxCapacity: 0,
});

visionScaling.scaleOnSchedule('ScaleUp', {
  schedule: autoscaling.Schedule.cron({ hour: '6', minute: '0' }),
  minCapacity: 1,
  maxCapacity: 10,
});
```

---

## Business Impact Summary

### Revenue Impact

**Computer Vision**:
- Automate 80% of photo quality checks
- Reduce manual inspection time by 15 hours/week per property
- Value: $30-50/property/month
- Attach rate: 60% of customers
- Revenue impact: +$18-30/customer

**Speech Analysis**:
- Transcribe 100% of phone bookings
- Extract booking details automatically
- Reduce call handling time by 20%
- Value: $20-40/property/month
- Attach rate: 40% of customers
- Revenue impact: +$8-16/customer

**Advanced NLP**:
- Increase sentiment accuracy 85% → 95%
- Better review responses
- Detect issues 2x faster
- Value: $10-20/property/month
- Attach rate: 80% of customers
- Revenue impact: +$8-16/customer

**Prophet Forecasting**:
- Improve forecast accuracy 80% → 90%
- Better pricing decisions
- Reduce stockouts/overstock
- Value: $15-30/property/month
- Attach rate: 70% of customers
- Revenue impact: +$10.50-21/customer

**Total Revenue Impact**: +$44.50-83/customer/month

**Year 1 Impact** (3,500 customers × $60/month average):
- Additional ARR: $2.52M
- Total ARR: $3.4M + $2.52M = **$5.92M** (+74% vs. base case)

---

## Conclusion & Recommendations

### ✅ Immediate Action (Month 4)

**Phase 1: Foundation**
1. Set up ML services infrastructure (ECS cluster, ALB)
2. Create base FastAPI template for services
3. Implement Vision service (YOLO)
4. Implement Speech service (Whisper)

**Investment**: $15K (development) + $700/month (infrastructure)
**Timeline**: 4 weeks
**Impact**: +$35/customer/month (+35% revenue)

### ✅ Medium-Term (Month 5-6)

**Phase 2: Enhancement**
1. Implement NLP service (BERT)
2. Implement Prophet forecasting
3. A/B test vs. current implementations
4. Roll out to customers

**Investment**: $10K (development) + $300/month (infrastructure)
**Timeline**: 4 weeks
**Impact**: +$20/customer/month (+20% revenue)

### 🔄 Long-Term (Month 7+)

**Phase 3: Advanced**
1. OR-Tools optimization service
2. Anomaly detection service
3. Custom ML models (fine-tuned on hospitality data)

**Investment**: $20K (development) + $500/month (infrastructure)
**Timeline**: 8 weeks
**Impact**: +$15/customer/month (+15% revenue)

---

**Bottom Line**: Integrating best-in-class ML libraries as microservices can increase revenue by 70%+ while maintaining cost efficiency. The ROI is extremely strong (300-500x), and the competitive differentiation is significant.

**Next Step**: Create detailed implementation plan for Vision + Speech services (Month 4).

---

*Last Updated: 2025-10-23*
*Version: 1.0*

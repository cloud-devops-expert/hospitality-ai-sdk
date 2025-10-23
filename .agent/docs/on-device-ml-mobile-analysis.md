# On-Device ML for Mobile: Expo/React Native Analysis

**Date**: 2025-10-23
**Purpose**: Evaluate local ML alternatives for Android/iOS mobile apps (Expo/React Native)
**Strategy**: Run ML models directly on user devices to reduce costs and enable offline use

---

## Executive Summary

**Key Insight**: Running ML models on-device (phone/tablet) offers significant advantages for the Hospitality AI SDK mobile app:

1. **Cost Savings**: Zero API costs vs. $0.01-0.05 per inference
2. **Privacy**: Data never leaves device (critical for hospitality)
3. **Offline Capability**: Works without internet (remote properties)
4. **Low Latency**: <100ms vs. 500-2000ms for API calls
5. **Scalability**: Compute scales with users (no server costs)

**Recommendation**: Hybrid approach - on-device for real-time tasks, cloud for heavy lifting.

---

## Current Mobile Stack Assessment

### Expo/React Native Constraints

| Constraint | Impact | Workaround |
|------------|--------|------------|
| **No native modules in Expo Go** | Can't use TensorFlow Lite directly | Use Expo dev client or bare workflow |
| **Limited computational power** | Large models won't run | Use quantized/compressed models |
| **Memory limits** | Models must be <100MB | Model pruning and distillation |
| **Battery concerns** | Heavy inference drains battery | Batch processing, efficient models |
| **Storage limits** | Can't bundle huge models | Download on demand |

**Solution**: Use Expo dev client (custom runtime) or bare React Native workflow for ML capabilities.

---

## On-Device ML Frameworks for React Native

### 1. 🔥 TensorFlow Lite (Recommended)

#### Overview
- **Language**: C++ (with React Native bindings)
- **Platform**: Android, iOS
- **Model Format**: .tflite
- **Library**: `react-native-tensorflow-lite` or `@tensorflow/tfjs-react-native`

#### Capabilities
- Image classification
- Object detection (MobileNet, EfficientDet)
- Pose estimation
- Text classification
- Speech recognition (limited)

#### Performance
- **Image Classification**: 50-200ms (depending on model)
- **Object Detection**: 100-500ms
- **Model Size**: 1-50MB (quantized)

#### React Native Integration

**Option A: react-native-tensorflow-lite**
```bash
npm install react-native-tensorflow-lite
npx expo prebuild  # Generate native code
```

```typescript
// Usage in React Native
import { TensorflowLite } from 'react-native-tensorflow-lite';

// Load model
const model = await TensorflowLite.loadModel({
  model: require('./models/mobilenet_v2.tflite'),
  labels: require('./models/labels.txt'),
});

// Run inference
const predictions = await model.classify({
  uri: imageUri,
  threshold: 0.7,
});

// Result
// [
//   { label: 'bed', confidence: 0.95 },
//   { label: 'tv', confidence: 0.89 }
// ]
```

**Option B: TensorFlow.js with React Native Backend**
```bash
npm install @tensorflow/tfjs @tensorflow/tfjs-react-native
npm install @react-native-async-storage/async-storage
npm install expo-gl
```

```typescript
import * as tf from '@tensorflow/tfjs';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';

// Load model
const model = await tf.loadLayersModel(
  bundleResourceIO(modelJson, modelWeights)
);

// Preprocess image
const imageTensor = tf.browser.fromPixels(imageElement)
  .resizeNearestNeighbor([224, 224])
  .toFloat()
  .expandDims();

// Run inference
const predictions = await model.predict(imageTensor);
const top3 = await getTop3Classes(predictions);

// Result
// [
//   { className: 'clean_room', probability: 0.92 },
//   { className: 'bed_made', probability: 0.88 },
//   { className: 'organized', probability: 0.75 }
// ]
```

#### Business Use Cases for Hospitality

**1. Room Inspection (On-Device)**
- Guest takes photo of room
- App detects amenities, cleanliness
- Instant feedback (<500ms)
- Works offline
- **Value**: No API costs, instant results

**2. Damage Detection**
- Housekeeping staff photos damaged items
- On-device classification
- Upload only if damage detected
- **Value**: Reduce photo uploads by 90%

**3. Occupancy Detection**
- Camera pointed at lobby/pool area
- Real-time people counting
- Privacy-preserved (no images uploaded)
- **Value**: Real-time analytics, zero cloud cost

#### Model Recommendations

| Task | Model | Size | Speed | Accuracy | Use Case |
|------|-------|------|-------|----------|----------|
| **Image Classification** | MobileNetV3 | 3.4MB | 50ms | 75% | Room type detection |
| **Object Detection** | EfficientDet-Lite0 | 4.4MB | 150ms | 80% | Amenity detection |
| **Image Segmentation** | DeepLabV3-MobileNet | 2.7MB | 200ms | 70% | Space analysis |
| **Pose Estimation** | MoveNet | 3MB | 100ms | 85% | Guest flow analysis |

**All models**: Quantized to INT8 for mobile efficiency

---

### 2. 🔥 ML Kit (Google)

#### Overview
- **Platform**: Android (primary), iOS (limited)
- **Library**: `@react-native-ml-kit/text-recognition`, `@react-native-ml-kit/face-detection`, etc.
- **Cost**: Free (on-device), paid (cloud features)

#### Capabilities
- Text recognition (OCR)
- Barcode scanning
- Face detection
- Image labeling
- Object detection
- Pose detection
- Language identification
- Translation (59 languages)

#### React Native Integration

```bash
npm install @react-native-ml-kit/text-recognition
npm install @react-native-ml-kit/barcode-scanning
npm install @react-native-ml-kit/image-labeling
```

```typescript
import TextRecognition from '@react-native-ml-kit/text-recognition';
import BarcodeScanning from '@react-native-ml-kit/barcode-scanning';

// OCR - Extract text from images
const result = await TextRecognition.recognize(imageUri);
console.log(result.text);
// "Reservation Confirmation\nCheck-in: 2025-10-25\nRoom: 101"

// Barcode scanning - Guest QR codes
const barcodes = await BarcodeScanning.scan(imageUri);
console.log(barcodes[0].displayValue);
// "BOOKING-123456"

// Image labeling - Auto-tag photos
const labels = await ImageLabeling.label(imageUri);
// [
//   { text: 'Hotel', confidence: 0.94 },
//   { text: 'Bedroom', confidence: 0.89 },
//   { text: 'Interior design', confidence: 0.85 }
// ]
```

#### Business Use Cases for Hospitality

**1. Document Scanning**
- Scan guest IDs at check-in
- Extract passport details
- Auto-fill booking forms
- **Value**: 60% faster check-in, no typing errors

**2. QR Code Check-In**
- Scan booking confirmation QR
- Instant room key generation
- Contactless check-in
- **Value**: <30 second check-in time

**3. Auto-Tagging Photos**
- Staff uploads property photos
- Auto-tag: pool, gym, restaurant, room
- Organize media library
- **Value**: Save 5 hours/week on manual tagging

**4. Menu Translation**
- Guest points camera at menu
- Real-time translation (59 languages)
- Works offline
- **Value**: Better guest experience, no multilingual menus needed

#### Model Performance

| Feature | Speed | Accuracy | Offline | Notes |
|---------|-------|----------|---------|-------|
| **Text Recognition** | 300ms | 95% | ✅ Yes | Latin, Chinese, Japanese, Korean |
| **Barcode Scanning** | 100ms | 99% | ✅ Yes | All major formats |
| **Face Detection** | 150ms | 90% | ✅ Yes | Attributes detection |
| **Image Labeling** | 200ms | 85% | ✅ Yes | 400+ labels |
| **Object Detection** | 250ms | 80% | ✅ Yes | 5 categories |
| **Translation** | 500ms | 90% | ✅ Yes* | *After language pack download |

---

### 3. 🟡 MediaPipe (Google)

#### Overview
- **Platform**: Android, iOS, Web
- **Library**: `react-native-mediapipe` (community)
- **Specialization**: Real-time video processing

#### Capabilities
- Hand tracking (21 landmarks)
- Pose detection (33 landmarks)
- Face mesh (468 landmarks)
- Selfie segmentation
- Object detection
- Hair segmentation

#### React Native Integration

```bash
npm install @mediapipe/tasks-vision
# Note: Limited React Native support, may need custom native module
```

```typescript
import { PoseDetector } from '@mediapipe/tasks-vision';

// Pose detection for guest flow analysis
const poseDetector = await PoseDetector.createFromOptions({
  baseOptions: {
    modelAssetPath: 'pose_landmarker.task',
  },
  runningMode: 'VIDEO',
});

const result = poseDetector.detectForVideo(videoFrame, timestamp);
// Returns 33 body landmarks
// Use case: Analyze lobby traffic patterns, queue lengths
```

#### Business Use Cases for Hospitality

**1. Touchless Controls**
- Hand gestures to control kiosk
- Wave to check-in
- Point to select room
- **Value**: Hygienic, futuristic guest experience

**2. Queue Management**
- Pose detection counts people in line
- Real-time wait time estimates
- Staff alerts when queue >5 people
- **Value**: Better service, no manual monitoring

**3. Fitness Center Monitoring**
- Pose estimation for form correction
- Auto-count reps
- Gamification
- **Value**: Differentiated amenity

#### Performance
- **Hand Tracking**: 60 FPS (real-time)
- **Pose Detection**: 30 FPS
- **Model Size**: 5-15MB
- **Accuracy**: 90%+

**Limitation**: Limited React Native support, may need custom native bridge.

---

### 4. 🟢 ONNX Runtime (Cross-Platform)

#### Overview
- **Platform**: Android, iOS, Windows, Linux
- **Library**: `onnxruntime-react-native`
- **Model Format**: .onnx (convert from PyTorch, TensorFlow)

#### Capabilities
- Run any ONNX model
- Optimized inference
- Hardware acceleration (GPU, NPU)
- Wide model support

#### React Native Integration

```bash
npm install onnxruntime-react-native
```

```typescript
import { InferenceSession, Tensor } from 'onnxruntime-react-native';

// Load custom model (converted from PyTorch/TensorFlow)
const session = await InferenceSession.create(
  require('./models/room_classifier.onnx')
);

// Prepare input
const inputTensor = new Tensor('float32', imageData, [1, 3, 224, 224]);

// Run inference
const output = await session.run({ input: inputTensor });
const predictions = output.output.data;

// Parse results
const topClass = predictions.indexOf(Math.max(...predictions));
console.log(CLASSES[topClass]); // "deluxe_suite"
```

#### Business Use Cases for Hospitality

**1. Custom Models**
- Train on your property's specific rooms
- Detect brand-specific amenities
- Custom damage detection
- **Value**: Tailored to your properties, not generic

**2. Proprietary Models**
- Run your secret sauce algorithms
- No cloud leakage
- Competitive advantage
- **Value**: IP protection

#### Advantages
- ✅ Use any model (convert from PyTorch, TensorFlow)
- ✅ Hardware acceleration (NPU on newer phones)
- ✅ Good React Native support
- ✅ Cross-platform consistency

#### Performance
- Similar to TensorFlow Lite
- Depends on model complexity
- Can use GPU/NPU if available

---

### 5. 🟡 Core ML (iOS Only)

#### Overview
- **Platform**: iOS only
- **Library**: `react-native-coreml`
- **Apple's ML Framework**: Optimized for iPhone/iPad

#### Capabilities
- Image classification
- Object detection
- Natural language processing
- Sound analysis
- Speech recognition
- On-device training (iOS 15+)

#### React Native Integration

```bash
npm install react-native-coreml
```

```typescript
import CoreML from 'react-native-coreml';

// Load model
const model = await CoreML.loadModel('RoomClassifier.mlmodel');

// Run inference
const result = await model.predict({
  image: imageUri,
});

console.log(result.classification);
// { label: 'presidential_suite', confidence: 0.93 }
```

#### Business Use Cases

**1. iOS-First Experience**
- Highest quality on iPhone/iPad
- Best performance
- Deepest OS integration
- **Value**: Premium experience for iOS users (60% of US hospitality market)

**2. On-Device Training**
- Model learns from user's preferences
- Personalized room recommendations
- No data upload required
- **Value**: Privacy-first personalization

#### Performance
- **Fastest on iOS**: 2-3x faster than TensorFlow Lite on iPhone
- **Hardware Acceleration**: Uses Neural Engine on A12+
- **Model Size**: 1-50MB

**Limitation**: iOS only, not cross-platform.

---

## Hybrid Strategy: On-Device + Cloud

### Decision Matrix

| Task | On-Device | Cloud API | Reasoning |
|------|-----------|-----------|-----------|
| **Real-time photo classification** | ✅ TensorFlow Lite | ❌ | <100ms needed, privacy |
| **Simple object detection** | ✅ ML Kit | ❌ | Fast enough, offline |
| **Complex scene understanding** | ❌ | ✅ YOLO API | Requires large model |
| **OCR (check-in forms)** | ✅ ML Kit | ❌ | Fast, privacy-sensitive |
| **Speech transcription** | ⚠️ On-device (basic) | ✅ Whisper API | Quality matters more |
| **Sentiment analysis** | ✅ TensorFlow Lite | ❌ | Small model, fast |
| **Advanced NLP** | ❌ | ✅ BERT API | Model too large (>100MB) |
| **Demand forecasting** | ❌ | ✅ Cloud | Needs server-side data |
| **Multi-property analytics** | ❌ | ✅ Cloud | Aggregation required |

### Hybrid Implementation Pattern

```typescript
// lib/ml/hybrid-inference.ts
export class HybridInferenceService {
  private deviceModel: TensorFlowLiteModel | null = null;
  private apiClient: VisionAPIClient;

  async analyzeImage(imageUri: string, options: AnalysisOptions) {
    // Check if we can use on-device model
    const canUseDevice = await this.canUseDeviceModel(options);

    if (canUseDevice && this.deviceModel) {
      // Fast path: on-device
      const startTime = Date.now();
      const result = await this.deviceModel.classify(imageUri);
      console.log(`On-device inference: ${Date.now() - startTime}ms`);

      return {
        ...result,
        source: 'device',
        latency: Date.now() - startTime,
        cost: 0,
      };
    } else {
      // Fallback: cloud API
      const startTime = Date.now();
      const result = await this.apiClient.analyze(imageUri, options);
      console.log(`Cloud inference: ${Date.now() - startTime}ms`);

      return {
        ...result,
        source: 'cloud',
        latency: Date.now() - startTime,
        cost: 0.03, // $0.03 per image
      };
    }
  }

  private async canUseDeviceModel(options: AnalysisOptions): Promise<boolean> {
    // Decision logic
    const hasDeviceModel = this.deviceModel !== null;
    const isOnline = await NetInfo.fetch().then(state => state.isConnected);
    const isBatteryLow = await Battery.getBatteryLevelAsync() < 0.2;
    const needsHighAccuracy = options.accuracy === 'high';

    // Use device if:
    // - Model loaded AND
    // - (Offline OR battery low OR user prefers privacy) AND
    // - Don't need highest accuracy
    return (
      hasDeviceModel &&
      (!isOnline || isBatteryLow || options.privacy) &&
      !needsHighAccuracy
    );
  }
}
```

---

## Mobile App Architecture

### Recommended Stack

```
┌─────────────────────────────────────────────────────┐
│           Expo / React Native App                   │
├─────────────────────────────────────────────────────┤
│  UI Components (React Native)                       │
│  - Camera integration (expo-camera)                 │
│  - Image picker (expo-image-picker)                 │
│  - File system (expo-file-system)                   │
├─────────────────────────────────────────────────────┤
│  Hybrid ML Service Layer                            │
│  - Device vs. Cloud decision logic                  │
│  - Offline queue for cloud tasks                    │
│  - Result caching                                   │
├──────────────────┬──────────────────────────────────┤
│  On-Device ML    │  Cloud API Client                │
│  ├─ TF Lite      │  ├─ Vision API                   │
│  ├─ ML Kit       │  ├─ Speech API                   │
│  └─ ONNX Runtime │  ├─ NLP API                      │
│                  │  └─ Forecast API                 │
└──────────────────┴──────────────────────────────────┘
         │                        │
         ▼                        ▼
   Local Models              Cloud Services
   (bundled/downloaded)      (ECS/Fargate)
```

---

## Implementation Examples

### Example 1: Room Inspection App (On-Device)

```typescript
// app/(tabs)/inspect.tsx
import { useState } from 'react';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { TensorflowLite } from 'react-native-tensorflow-lite';

export default function InspectionScreen() {
  const [model, setModel] = useState<any>(null);
  const [result, setResult] = useState<any>(null);

  // Load model on mount
  useEffect(() => {
    (async () => {
      const tfModel = await TensorflowLite.loadModel({
        model: require('../assets/models/room_inspection.tflite'),
        labels: require('../assets/models/labels.txt'),
      });
      setModel(tfModel);
    })();
  }, []);

  const inspectRoom = async () => {
    // Take photo
    const photo = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (photo.cancelled) return;

    // Run on-device inference
    const predictions = await model.classify({
      uri: photo.uri,
      threshold: 0.6,
    });

    // Parse results
    const cleanliness = calculateCleanlinessScore(predictions);
    const amenities = extractAmenities(predictions);
    const issues = detectIssues(predictions);

    setResult({
      cleanliness,
      amenities,
      issues,
      imageUri: photo.uri,
    });
  };

  return (
    <View>
      <Button title="Inspect Room" onPress={inspectRoom} />

      {result && (
        <InspectionResults
          cleanliness={result.cleanliness}
          amenities={result.amenities}
          issues={result.issues}
          imageUri={result.imageUri}
        />
      )}
    </View>
  );
}

function calculateCleanlinessScore(predictions: any[]): number {
  const negativeClasses = ['stain', 'dirt', 'mess', 'clutter'];
  const negativeCount = predictions.filter(p =>
    negativeClasses.includes(p.label)
  ).length;

  return Math.max(0, 100 - negativeCount * 15);
}
```

### Example 2: Guest Check-In with OCR (ML Kit)

```typescript
// app/(tabs)/checkin.tsx
import TextRecognition from '@react-native-ml-kit/text-recognition';
import BarcodeScanning from '@react-native-ml-kit/barcode-scanning';

export default function CheckInScreen() {
  const scanReservation = async () => {
    // Scan QR code from email
    const barcode = await BarcodeScanning.scan(cameraUri);
    const bookingId = barcode.displayValue; // "BOOKING-123456"

    // Fetch booking details
    const booking = await api.bookings.get(bookingId);

    // Scan ID for verification
    const idPhoto = await ImagePicker.launchCameraAsync();
    const ocrResult = await TextRecognition.recognize(idPhoto.uri);

    // Extract name and DOB
    const guestName = extractName(ocrResult.text);
    const dateOfBirth = extractDOB(ocrResult.text);

    // Verify match
    if (guestName === booking.guestName) {
      // Generate room key
      await generateDigitalKey(booking.roomNumber);

      // Success!
      navigation.navigate('RoomKey', {
        roomNumber: booking.roomNumber,
        checkInTime: new Date(),
      });
    }
  };

  return (
    <View>
      <Text>Scan your confirmation QR code</Text>
      <Button title="Scan QR Code" onPress={scanReservation} />
    </View>
  );
}

// Helper functions
function extractName(text: string): string {
  // OCR text parsing logic
  const namePattern = /Name:\s*([A-Z][a-z]+\s[A-Z][a-z]+)/;
  const match = text.match(namePattern);
  return match ? match[1] : '';
}

function extractDOB(text: string): string {
  // Date parsing logic
  const dobPattern = /DOB:\s*(\d{2}\/\d{2}\/\d{4})/;
  const match = text.match(dobPattern);
  return match ? match[1] : '';
}
```

### Example 3: Offline Mode with Queue

```typescript
// lib/ml/offline-queue.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export class OfflineMLQueue {
  private queue: MLTask[] = [];

  async addTask(task: MLTask) {
    const isOnline = await NetInfo.fetch().then(s => s.isConnected);

    if (isOnline) {
      // Process immediately
      return await this.processTask(task);
    } else {
      // Try on-device first
      if (task.canProcessOnDevice) {
        return await this.processOnDevice(task);
      }

      // Queue for later
      this.queue.push(task);
      await this.saveQueue();

      return {
        status: 'queued',
        message: 'Will process when online',
      };
    }
  }

  async processQueue() {
    const isOnline = await NetInfo.fetch().then(s => s.isConnected);
    if (!isOnline) return;

    for (const task of this.queue) {
      try {
        await this.processTask(task);
        this.queue = this.queue.filter(t => t.id !== task.id);
      } catch (error) {
        console.error(`Failed to process task ${task.id}:`, error);
      }
    }

    await this.saveQueue();
  }

  private async processOnDevice(task: MLTask) {
    switch (task.type) {
      case 'image_classification':
        return await this.deviceModel.classify(task.imageUri);
      case 'ocr':
        return await TextRecognition.recognize(task.imageUri);
      case 'barcode':
        return await BarcodeScanning.scan(task.imageUri);
      default:
        throw new Error(`Cannot process ${task.type} on device`);
    }
  }

  private async processTask(task: MLTask) {
    // Send to cloud API
    return await this.apiClient.process(task);
  }

  private async saveQueue() {
    await AsyncStorage.setItem('ml_queue', JSON.stringify(this.queue));
  }
}

// Listen for network changes
NetInfo.addEventListener(state => {
  if (state.isConnected) {
    offlineQueue.processQueue();
  }
});
```

---

## Cost Comparison: On-Device vs. Cloud

### Scenario: 1,000 Properties, 10 Inspections/Day

**Cloud Only**:
- Inspections: 1,000 × 10 × 30 = 300,000/month
- Cost per image: $0.03
- **Total: $9,000/month**

**On-Device (80%) + Cloud (20%)**:
- On-device: 240,000 inspections × $0 = $0
- Cloud: 60,000 inspections × $0.03 = $1,800
- **Total: $1,800/month** (80% savings)

**On-Device Only**:
- **Total: $0/month** (but limited accuracy for complex tasks)

### Break-Even Analysis

**One-time costs**:
- Model training/conversion: $5,000
- Testing and optimization: $3,000
- React Native integration: $2,000
- **Total: $10,000**

**Break-even**: 10,000 / (9,000 - 1,800) = 1.4 months

**ROI Year 1**: (7,200 × 12 - 10,000) / 10,000 = 764%

---

## Model Distribution Strategy

### Option 1: Bundle with App (Small Models)

```typescript
// App includes model in assets
const model = await TensorflowLite.loadModel({
  model: require('../assets/models/room_classifier.tflite'), // 3MB
  labels: require('../assets/models/labels.txt'),
});
```

**Pros**:
- Works offline immediately
- No download time
- Guaranteed availability

**Cons**:
- Increases app size
- Updates require app update

**Recommendation**: Use for critical models <5MB

### Option 2: Download on Demand

```typescript
// Download model from CDN
import * as FileSystem from 'expo-file-system';

const modelUri = `${FileSystem.documentDirectory}room_classifier.tflite`;

// Check if already downloaded
const modelInfo = await FileSystem.getInfoAsync(modelUri);

if (!modelInfo.exists) {
  // Download from CDN
  await FileSystem.downloadAsync(
    'https://cdn.hospital-ai.com/models/room_classifier_v2.tflite',
    modelUri
  );
}

// Load downloaded model
const model = await TensorflowLite.loadModel({
  model: modelUri,
  labels: `${FileSystem.documentDirectory}labels.txt`,
});
```

**Pros**:
- Smaller app size
- Easy updates (no app release)
- Download only if user needs feature

**Cons**:
- Requires initial download
- Needs internet for first use

**Recommendation**: Use for optional models >5MB

### Option 3: Adaptive Loading

```typescript
// Load different models based on device
const deviceInfo = await Device.getDeviceTypeAsync();
const modelName = deviceInfo === Device.DeviceType.PHONE
  ? 'room_classifier_lite.tflite'  // 2MB
  : 'room_classifier_full.tflite'; // 8MB

const model = await TensorflowLite.loadModel({
  model: modelName,
});
```

**Recommendation**: Use for cross-device optimization

---

## Performance Optimization

### 1. Model Quantization

Convert FP32 models to INT8 (4x smaller, 2-4x faster):

```python
# Convert TensorFlow model to TFLite with quantization
import tensorflow as tf

converter = tf.lite.TFLiteConverter.from_saved_model('model/')
converter.optimizations = [tf.lite.Optimize.DEFAULT]
converter.target_spec.supported_types = [tf.int8]

tflite_model = converter.convert()

with open('room_classifier_quantized.tflite', 'wb') as f:
    f.write(tflite_model)
```

**Result**: 20MB → 5MB, 200ms → 80ms

### 2. Input Resolution Reduction

```typescript
// Resize image before inference
const resized = await ImageManipulator.manipulateAsync(
  imageUri,
  [{ resize: { width: 224, height: 224 } }], // Instead of 512x512
  { compress: 0.8, format: SaveFormat.JPEG }
);

const predictions = await model.classify(resized.uri);
```

**Result**: 500ms → 150ms (3x faster)

### 3. Batch Processing

```typescript
// Process multiple images at once (if model supports batching)
const images = [image1, image2, image3];
const results = await model.classifyBatch(images);
```

**Result**: 3 × 200ms = 600ms → 400ms (1.5x faster)

### 4. Hardware Acceleration

```typescript
// Use GPU delegate (Android) or Metal (iOS)
const model = await TensorflowLite.loadModel({
  model: modelPath,
  numThreads: 4,
  useGpu: true, // Enable GPU acceleration
});
```

**Result**: 200ms → 50ms (4x faster on GPU-capable devices)

---

## Recommendations by Use Case

### 1. Room Inspection
**Recommendation**: On-Device (TensorFlow Lite)
- **Model**: MobileNetV3 (3MB, quantized)
- **Accuracy**: 85%
- **Speed**: <100ms
- **Cost**: $0
- **Offline**: ✅ Yes

### 2. Guest Check-In
**Recommendation**: On-Device (ML Kit)
- **OCR**: ML Kit Text Recognition
- **Barcode**: ML Kit Barcode Scanning
- **Speed**: <300ms combined
- **Cost**: $0
- **Offline**: ✅ Yes

### 3. Photo Tagging
**Recommendation**: Hybrid (On-Device → Cloud)
- **Basic Tags**: ML Kit Image Labeling (on-device)
- **Advanced**: Cloud Vision API (if needed)
- **Speed**: 200ms (on-device), 800ms (cloud)
- **Cost**: $0 (80%), $0.03 (20%)

### 4. Complex Analysis
**Recommendation**: Cloud API
- **Task**: Multi-object detection, scene understanding
- **Reason**: Model too large (>100MB) for mobile
- **Speed**: 1-2 seconds
- **Cost**: $0.03-0.05 per image

### 5. Real-Time Video
**Recommendation**: On-Device (MediaPipe)
- **Task**: Pose tracking, hand gestures
- **Speed**: 30-60 FPS
- **Cost**: $0
- **Offline**: ✅ Yes

---

## Implementation Roadmap

### Phase 1: Basic On-Device (Month 3)
**During Beta Testing**

- [ ] Set up Expo dev client (custom runtime)
- [ ] Integrate TensorFlow Lite for room classification
- [ ] Integrate ML Kit for OCR and barcode scanning
- [ ] Test with beta users on various devices
- [ ] Measure performance and accuracy

**Deliverable**: Basic on-device ML working

### Phase 2: Hybrid Strategy (Month 4-5)
**After MVP Launch**

- [ ] Implement hybrid decision logic
- [ ] Create offline task queue
- [ ] Add model download system
- [ ] Optimize model sizes
- [ ] A/B test on-device vs. cloud accuracy

**Deliverable**: Smart routing between device and cloud

### Phase 3: Advanced Features (Month 6+)
**Scale & Optimize**

- [ ] Add more specialized models
- [ ] Implement on-device training (iOS)
- [ ] Add federated learning (optional)
- [ ] Optimize battery usage
- [ ] Advanced caching strategies

**Deliverable**: Production-grade on-device ML

---

## Conclusion

### ✅ Recommended Approach

**On-Device for**:
- Room classification (TensorFlow Lite)
- OCR / barcode scanning (ML Kit)
- Basic object detection (ML Kit)
- Real-time video analysis (MediaPipe)

**Cloud for**:
- Complex scene understanding (YOLO API)
- Advanced NLP (BERT API)
- Speech transcription (Whisper API)
- Multi-property analytics

### 💰 Cost Impact

**Current (Cloud Only)**: $9,000/month for 300K images
**Hybrid (80% device)**: $1,800/month (80% savings)
**Break-even**: 1.4 months
**Year 1 ROI**: 764%

### 🎯 Business Value

- **Cost Savings**: 80% reduction in API costs
- **Privacy**: Data never leaves device
- **Offline**: Works in remote properties
- **Speed**: 5-10x faster inference
- **Scalability**: Compute scales with users

### 📋 Next Steps

1. **Month 3** (Beta): Integrate TensorFlow Lite + ML Kit
2. **Month 4** (Launch): Implement hybrid strategy
3. **Month 6** (Scale): Advanced optimization

This strategy gives us the best of both worlds: fast, private, offline-capable on-device ML for common tasks, with cloud fallback for complex analysis.

---

*Last Updated: 2025-10-23*
*Version: 1.0*

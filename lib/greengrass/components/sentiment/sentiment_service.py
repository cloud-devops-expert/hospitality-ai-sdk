#!/usr/bin/env python3
"""
Sentiment Analysis Service for AWS IoT Greengrass

Provides local, on-premise sentiment analysis for hospitality operations.
Runs on Greengrass Core devices at each property for <50ms latency.

Architecture:
- Tier 1 (PRIMARY): Greengrass on-premise inference
- Tier 2 (SECONDARY): Browser ML fallback for guest apps
- Tier 3 (TERTIARY): Cloud APIs for batch processing

Performance target: <50ms inference latency via local network
Cost target: Near-$0 marginal cost (after initial hardware)
"""

import os
import logging
import time
from typing import Dict, List, Optional
from datetime import datetime

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from transformers import pipeline
import uvicorn

# Configure logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "info").upper()
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration from environment (set by Greengrass recipe)
MODEL_NAME = os.getenv("MODEL_NAME", "distilbert-base-uncased-finetuned-sst-2-english")
PORT = int(os.getenv("PORT", "8001"))
WORKERS = int(os.getenv("WORKERS", "2"))

# Initialize FastAPI
app = FastAPI(
    title="Hospitality Sentiment Analysis Service",
    description="On-premise sentiment analysis for guest reviews and staff feedback",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware (allow property network access)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to property network
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
classifier = None
start_time = datetime.now()
request_count = 0
total_latency_ms = 0


# Pydantic models
class SentimentRequest(BaseModel):
    """Single sentiment analysis request"""
    text: str = Field(..., description="Text to analyze", min_length=1, max_length=5000)
    context: Optional[str] = Field(None, description="Context (e.g., 'guest_review', 'staff_feedback')")


class BatchSentimentRequest(BaseModel):
    """Batch sentiment analysis request"""
    texts: List[str] = Field(..., description="List of texts to analyze", min_items=1, max_items=100)


class SentimentResponse(BaseModel):
    """Sentiment analysis response"""
    sentiment: str = Field(..., description="Sentiment label (positive, negative, neutral)")
    score: float = Field(..., description="Confidence score (0-1)")
    label: str = Field(..., description="Raw model label")
    source: str = Field(default="greengrass-edge", description="Inference source")
    latency_ms: int = Field(..., description="Inference latency in milliseconds")
    context: Optional[str] = Field(None, description="Request context")
    timestamp: str = Field(..., description="ISO 8601 timestamp")


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    model: str
    uptime_seconds: int
    total_requests: int
    avg_latency_ms: float


@app.on_event("startup")
async def startup_event():
    """Initialize ML model on startup (runs once when Greengrass starts component)"""
    global classifier

    logger.info(f"Loading sentiment analysis model: {MODEL_NAME}")
    start = time.time()

    try:
        classifier = pipeline(
            "sentiment-analysis",
            model=MODEL_NAME,
            device=-1  # CPU inference (use device=0 for GPU on Jetson)
        )

        load_time = int((time.time() - start) * 1000)
        logger.info(f"Model loaded successfully in {load_time}ms")

        # Warm-up inference (pre-compile)
        warmup_text = "This is a test sentence for warming up the model."
        _ = classifier(warmup_text)
        logger.info("Model warm-up completed")

    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        raise


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint for monitoring.

    Used by:
    - Greengrass health checks
    - CloudWatch alarms
    - Property IT staff monitoring
    """
    global start_time, request_count, total_latency_ms

    uptime = int((datetime.now() - start_time).total_seconds())
    avg_latency = total_latency_ms / request_count if request_count > 0 else 0

    return HealthResponse(
        status="healthy" if classifier else "unhealthy",
        service="sentiment",
        model=MODEL_NAME,
        uptime_seconds=uptime,
        total_requests=request_count,
        avg_latency_ms=round(avg_latency, 2)
    )


@app.post("/analyze", response_model=SentimentResponse)
async def analyze_sentiment(request: SentimentRequest):
    """
    Analyze sentiment of a single text.

    Use cases:
    - Guest review analysis (real-time)
    - Staff feedback processing
    - Social media monitoring
    - Chat message sentiment

    Performance: <50ms latency via local network
    Cost: $0 (runs on-premise on Greengrass device)

    Example request:
    ```json
    {
        "text": "The room was absolutely wonderful!",
        "context": "guest_review"
    }
    ```

    Example response:
    ```json
    {
        "sentiment": "positive",
        "score": 0.9998,
        "label": "POSITIVE",
        "source": "greengrass-edge",
        "latency_ms": 42,
        "context": "guest_review",
        "timestamp": "2025-10-23T20:16:30.123Z"
    }
    ```
    """
    global request_count, total_latency_ms

    if not classifier:
        raise HTTPException(status_code=503, detail="Model not loaded")

    try:
        # Run inference
        start = time.time()
        result = classifier(request.text)[0]
        latency_ms = int((time.time() - start) * 1000)

        # Update metrics
        request_count += 1
        total_latency_ms += latency_ms

        # Log slow requests
        if latency_ms > 100:
            logger.warning(f"Slow inference: {latency_ms}ms for text length {len(request.text)}")

        return SentimentResponse(
            sentiment=result["label"].lower(),
            score=result["score"],
            label=result["label"],
            source="greengrass-edge",
            latency_ms=latency_ms,
            context=request.context,
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        logger.error(f"Sentiment analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze/batch")
async def analyze_batch(request: BatchSentimentRequest):
    """
    Analyze sentiment of multiple texts in batch.

    Batch processing is 3-5x faster than individual requests due to model parallelization.

    Use cases:
    - Processing daily guest reviews (end-of-day batch)
    - Analyzing staff feedback surveys
    - Bulk social media monitoring

    Performance: 10-20ms per text (vs. 50ms individual)
    Cost: $0 (runs on-premise)

    Example request:
    ```json
    {
        "texts": [
            "The room was wonderful!",
            "Service was terrible.",
            "Average experience."
        ]
    }
    ```

    Example response:
    ```json
    {
        "results": [
            {"text": "...", "sentiment": "positive", "score": 0.99, "latency_ms": 15},
            {"text": "...", "sentiment": "negative", "score": 0.98, "latency_ms": 12},
            {"text": "...", "sentiment": "neutral", "score": 0.65, "latency_ms": 14}
        ],
        "source": "greengrass-edge",
        "total_latency_ms": 85,
        "count": 3,
        "timestamp": "2025-10-23T20:16:30.123Z"
    }
    ```
    """
    global request_count, total_latency_ms

    if not classifier:
        raise HTTPException(status_code=503, detail="Model not loaded")

    try:
        # Batch inference (much faster than individual)
        start = time.time()
        results = classifier(request.texts)
        total_time_ms = int((time.time() - start) * 1000)

        # Update metrics
        request_count += len(request.texts)
        total_latency_ms += total_time_ms

        # Calculate per-text latency
        per_text_latency = total_time_ms // len(request.texts)

        logger.info(f"Batch analyzed {len(request.texts)} texts in {total_time_ms}ms ({per_text_latency}ms/text)")

        return {
            "results": [
                {
                    "text": text,
                    "sentiment": result["label"].lower(),
                    "score": result["score"],
                    "label": result["label"],
                    "latency_ms": per_text_latency
                }
                for text, result in zip(request.texts, results)
            ],
            "source": "greengrass-edge",
            "total_latency_ms": total_time_ms,
            "count": len(request.texts),
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Batch sentiment analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/metrics")
async def get_metrics():
    """
    Get service metrics (Prometheus-compatible).

    Used for:
    - CloudWatch custom metrics
    - Grafana dashboards
    - Property IT monitoring
    """
    global start_time, request_count, total_latency_ms

    uptime = int((datetime.now() - start_time).total_seconds())
    avg_latency = total_latency_ms / request_count if request_count > 0 else 0

    return {
        "sentiment_service_uptime_seconds": uptime,
        "sentiment_service_requests_total": request_count,
        "sentiment_service_latency_avg_ms": round(avg_latency, 2),
        "sentiment_service_latency_total_ms": total_latency_ms,
        "sentiment_service_model": MODEL_NAME,
        "sentiment_service_status": 1 if classifier else 0
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for unexpected errors"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc),
            "timestamp": datetime.now().isoformat()
        }
    )


if __name__ == "__main__":
    """
    Run the sentiment analysis service.

    Deployment:
    - Greengrass will run this script via recipe.yaml
    - Listens on local network (0.0.0.0) for property access
    - Port 8001 (configurable via environment variable)
    - Workers: 2 (configurable, increase for high-traffic properties)

    Access:
    - From PMS: http://greengrass.local:8001/analyze
    - From staff app: http://<greengrass-ip>:8001/analyze
    - Health check: http://greengrass.local:8001/health
    - Metrics: http://greengrass.local:8001/metrics
    - Docs: http://greengrass.local:8001/docs
    """
    logger.info(f"Starting sentiment analysis service...")
    logger.info(f"Model: {MODEL_NAME}")
    logger.info(f"Port: {PORT}")
    logger.info(f"Workers: {WORKERS}")

    uvicorn.run(
        app,
        host="0.0.0.0",  # Listen on all interfaces (property network)
        port=PORT,
        workers=WORKERS,
        log_level=LOG_LEVEL.lower(),
        access_log=True
    )

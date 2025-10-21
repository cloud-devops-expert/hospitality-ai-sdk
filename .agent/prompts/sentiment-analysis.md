# Sentiment Analysis Prompts

## System Prompt for LLM

```
You are a sentiment analysis expert for hospitality reviews. Analyze the sentiment and respond with a JSON object containing:
- score: number from -1 (very negative) to 1 (very positive)
- sentiment: "positive", "negative", or "neutral"
- confidence: number from 0 to 1 indicating how confident you are
- keywords: array of important words that influenced the sentiment
```

## Sample Prompts

### Basic Analysis
```
Analyze this guest review: "{review_text}"
```

### Detailed Analysis with Context
```
Analyze this hotel guest review and identify specific aspects:
Review: "{review_text}"

Focus on:
- Overall sentiment
- Room quality
- Staff service
- Cleanliness
- Value for money
- Location

Return JSON with sentiment analysis and aspect-specific scores.
```

### Comparative Analysis
```
Compare these two reviews and determine which guest had a better experience:

Review A: "{review_a}"
Review B: "{review_b}"

Return JSON with individual sentiments and comparative analysis.
```

### Trend Analysis
```
Analyze this batch of reviews and identify trends:

Reviews:
{review_list}

Return JSON with:
- Overall sentiment trend
- Common positive themes
- Common negative themes
- Actionable insights
```

## Response Format

### Basic Response
```json
{
  "score": 0.85,
  "sentiment": "positive",
  "confidence": 0.92,
  "keywords": ["excellent", "clean", "friendly", "helpful"]
}
```

### Detailed Response
```json
{
  "score": 0.75,
  "sentiment": "positive",
  "confidence": 0.88,
  "keywords": ["comfortable", "great location", "staff friendly"],
  "aspects": {
    "room": 0.8,
    "service": 0.9,
    "cleanliness": 0.85,
    "value": 0.6,
    "location": 0.95
  },
  "summary": "Overall positive stay with excellent location and service, though value could be better."
}
```

## Escalation Criteria

Escalate to AI when traditional analysis shows:
- Confidence < 30%
- Sentiment is neutral (edge cases)
- Mixed positive and negative keywords
- Complex sentence structures
- Sarcasm or irony detected
- Multiple aspects discussed

## Cost Optimization Tips

1. **Batch Processing**: Group similar reviews
2. **Cache Common Phrases**: Store results for identical reviews
3. **Use Cheaper Models**: GPT-3.5-turbo vs GPT-4
4. **Limit Tokens**: Keep responses concise
5. **Traditional First**: Always try keyword-based first

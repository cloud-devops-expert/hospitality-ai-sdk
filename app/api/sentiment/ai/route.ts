import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Check if API key is configured
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          score: 0,
          sentiment: 'neutral',
          confidence: 0,
          keywords: [],
          method: 'ai',
          error: 'AI analysis not available - API key not configured',
        },
        { status: 200 }
      );
    }

    // Call OpenAI API for sentiment analysis
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a sentiment analysis expert for hospitality reviews. Analyze the sentiment and respond with a JSON object containing: score (number from -1 to 1), sentiment (positive/negative/neutral), confidence (0 to 1), and keywords (array of important words).',
          },
          {
            role: 'user',
            content: `Analyze this guest review: "${text}"`,
          },
        ],
        temperature: 0.3,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    // Parse AI response
    let result;
    try {
      result = JSON.parse(content);
    } catch {
      // Fallback parsing if JSON is not valid
      result = {
        score: 0,
        sentiment: 'neutral',
        confidence: 0.5,
        keywords: [],
      };
    }

    return NextResponse.json({
      ...result,
      method: 'ai',
    });
  } catch (error) {
    console.error('AI sentiment analysis error:', error);
    return NextResponse.json(
      {
        score: 0,
        sentiment: 'neutral',
        confidence: 0,
        keywords: [],
        method: 'ai',
        error: 'AI analysis failed',
      },
      { status: 200 }
    );
  }
}

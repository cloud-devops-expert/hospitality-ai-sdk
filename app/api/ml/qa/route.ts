/**
 * Question Answering API Route
 *
 * Server-side ML inference using Transformers.js (DistilBERT-SQuAD)
 * Handles question answering from provided context
 */

import { NextResponse } from 'next/server';
import { hotelPolicies } from '@/lib/ml/nlp/question-answering-constants';
import { getCachedPipeline, MODELS } from '@/lib/ml/model-cache';

// Import question answering function (will run on server)
async function answerQuestionServer(
  question: string,
  context?: string,
  useHotelPolicies: boolean = false
): Promise<{
  question: string;
  context: string;
  answer: string;
  score: number;
  startIndex: number;
  endIndex: number;
  executionTimeMs: number;
  confidence: 'high' | 'medium' | 'low';
}> {
  const startTime = performance.now();

  try {
    // Get cached QA model (loads once, reuses forever)
    const qaModel = await getCachedPipeline(
      MODELS.QUESTION_ANSWERING.task,
      MODELS.QUESTION_ANSWERING.model
    );

    const finalContext = context || '';

    // If using hotel policies, search for best matching context
    if (useHotelPolicies) {
      // Try each policy and get the best answer
      let bestResult: { score: number; answer: string; start: number; end: number; context?: string } | null = null;
      let bestScore = 0;

      for (const policy of hotelPolicies) {
        const result = await qaModel(question, policy.content);
        if (result.score > bestScore) {
          bestScore = result.score;
          bestResult = { ...result, context: policy.content };
        }
      }

      if (bestResult) {
        const executionTimeMs = Math.round(performance.now() - startTime);
        let confidence: 'high' | 'medium' | 'low';
        if (bestResult.score > 0.7) confidence = 'high';
        else if (bestResult.score > 0.4) confidence = 'medium';
        else confidence = 'low';

        return {
          question,
          context: bestResult.context,
          answer: bestResult.answer,
          score: bestResult.score,
          startIndex: bestResult.start,
          endIndex: bestResult.end,
          executionTimeMs,
          confidence,
        };
      }
    }

    // Run question answering with custom context
    const result = await qaModel(question, finalContext);
    const executionTimeMs = Math.round(performance.now() - startTime);

    let confidence: 'high' | 'medium' | 'low';
    if (result.score > 0.7) confidence = 'high';
    else if (result.score > 0.4) confidence = 'medium';
    else confidence = 'low';

    return {
      question,
      context: finalContext,
      answer: result.answer,
      score: result.score,
      startIndex: result.start,
      endIndex: result.end,
      executionTimeMs,
      confidence,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Question answering error:', error);
    throw new Error(`Question answering failed: ${errorMessage}`);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question, context, useHotelPolicies } = body;

    if (!question) {
      return NextResponse.json(
        { error: 'Invalid request. Requires question.' },
        { status: 400 }
      );
    }

    if (!useHotelPolicies && !context) {
      return NextResponse.json(
        { error: 'Invalid request. Requires context when not using hotel policies.' },
        { status: 400 }
      );
    }

    // Run question answering on server
    const result = await answerQuestionServer(question, context, useHotelPolicies);

    return NextResponse.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Question answering failed';
    console.error('[ML API] Question answering error:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

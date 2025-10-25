/**
 * Translation API Route
 *
 * Server-side ML inference using Transformers.js (NLLB-200)
 * Handles translation between 200 languages
 */

import { NextResponse } from 'next/server';

// Import translation function (will run on server)
async function translateTextServer(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<{
  sourceText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  executionTimeMs: number;
  characterCount: number;
}> {
  const startTime = performance.now();

  try {
    // Dynamically import Transformers.js on server
    const { pipeline } = await import('@xenova/transformers');

    // Load translation model (NLLB-200 distilled)
    const translator = await pipeline('translation', 'Xenova/nllb-200-distilled-600M');

    // Run translation
    const result = await translator(text, {
      src_lang: sourceLang,
      tgt_lang: targetLang,
      max_length: 512,
    });

    const executionTimeMs = Math.round(performance.now() - startTime);

    return {
      sourceText: text,
      translatedText: result[0].translation_text,
      sourceLanguage: sourceLang,
      targetLanguage: targetLang,
      executionTimeMs,
      characterCount: text.length,
    };
  } catch (error: any) {
    console.error('Translation error:', error);
    throw new Error(`Translation failed: ${error.message}`);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, sourceLang, targetLang } = body;

    if (!text || !sourceLang || !targetLang) {
      return NextResponse.json(
        { error: 'Invalid request. Requires text, sourceLang, and targetLang.' },
        { status: 400 }
      );
    }

    // Run translation on server
    const result = await translateTextServer(text, sourceLang, targetLang);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[ML API] Translation error:', error);
    return NextResponse.json(
      { error: error.message || 'Translation failed' },
      { status: 500 }
    );
  }
}

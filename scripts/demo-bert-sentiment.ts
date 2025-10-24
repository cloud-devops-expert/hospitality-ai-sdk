/**
 * BERT Sentiment Analysis Demo
 *
 * Demonstrates battle-tested sentiment analysis without generative AI
 */

import { BERTSentimentAnalyzer } from '../lib/ml/sentiment/bert-sentiment-analyzer';

async function main() {
  console.log('🤖 BERT Sentiment Analysis Demo\n');
  console.log('Using: nlptown/bert-base-multilingual-uncased-sentiment');
  console.log('Languages: English, Dutch, German, French, Spanish, Italian\n');

  const analyzer = new BERTSentimentAnalyzer();

  // Sample hotel reviews (multilingual)
  const reviews = [
    'The hotel was absolutely amazing! Best stay ever, highly recommend!',
    'Room was dirty and staff was rude. Very disappointed.',
    'Decent hotel, nothing special. Average experience.',
    'Excelente servicio y ubicación perfecta. ¡Volveré pronto!', // Spanish
    'Das Zimmer war sauber aber sehr klein.', // German
    'Horrible experience, will never come back.',
    'Great location, friendly staff, but room was a bit noisy.',
    'Perfect! Everything was wonderful from check-in to check-out.',
  ];

  console.log('📊 Analyzing reviews...\n');

  const result = await analyzer.analyzeReviews(reviews);

  // Display individual results
  console.log('Individual Review Analysis:');
  console.log('─'.repeat(80));

  result.reviews.forEach((r, i) => {
    const emoji =
      r.result.stars === 5
        ? '😍'
        : r.result.stars === 4
          ? '😊'
          : r.result.stars === 3
            ? '😐'
            : r.result.stars === 2
              ? '😕'
              : '😡';

    console.log(`\n${i + 1}. ${emoji} ${r.result.stars} stars (${r.result.sentiment})`);
    console.log(`   "${r.text.substring(0, 60)}${r.text.length > 60 ? '...' : ''}"`);
    console.log(`   Confidence: ${Math.round(r.result.score * 100)}%`);
    console.log(`   Inference time: ${Math.round(r.executionTimeMs)}ms`);
  });

  // Display summary
  console.log('\n' + '='.repeat(80));
  console.log('📈 Summary Statistics:\n');
  console.log(`Total reviews analyzed: ${result.summary.totalReviews}`);
  console.log(`Average rating: ${result.summary.averageStars} stars`);
  console.log(`Positive reviews: ${result.summary.positivePercentage}%`);
  console.log(`Negative reviews: ${result.summary.negativePercentage}%`);

  console.log('\nSentiment Distribution:');
  Object.entries(result.summary.sentimentDistribution).forEach(([sentiment, count]) => {
    const bar = '█'.repeat(Math.round((count / result.summary.totalReviews) * 20));
    console.log(`  ${sentiment.padEnd(15)}: ${bar} (${count})`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('✅ Key Benefits:');
  console.log('   • Multilingual support (6 languages)');
  console.log('   • 85-90% accuracy');
  console.log('   • CPU-only (no GPU needed)');
  console.log('   • ~50ms per review');
  console.log('   • $0 cost (runs locally)');
  console.log('   • Works offline');
  console.log('\n');
}

main().catch(console.error);

/**
 * LLM Review Response Demo
 *
 * Demonstrates where Generative AI SHOULD be used!
 */

import {
  OpenAIResponseGenerator,
  ReviewResponseAutomation,
  ReviewData,
} from '../lib/ml/review-response/llm-response-generator';

async function main() {
  console.log('✨ LLM Review Response Automation Demo\n');
  console.log('This is where Generative AI excels!\n');
  console.log('Using: GPT-4o-mini (simulated)');
  console.log('Cost: $0.0006 per response (~$50-$200/month)\n');

  const generator = new OpenAIResponseGenerator();
  const automation = new ReviewResponseAutomation(generator);

  // Sample reviews from different platforms
  const reviews: ReviewData[] = [
    {
      reviewId: 'REV-001',
      guestName: 'Sarah Johnson',
      rating: 5,
      reviewText:
        'Amazing stay! The staff went above and beyond to make our anniversary special. The room was spotless and the view was breathtaking. Will definitely be back!',
      platform: 'tripadvisor',
    },
    {
      reviewId: 'REV-002',
      guestName: 'Mike Chen',
      rating: 4,
      reviewText:
        'Great location and friendly staff. Room was clean but a bit small for the price. Overall good experience.',
      platform: 'google',
    },
    {
      reviewId: 'REV-003',
      guestName: 'Emily Davis',
      rating: 3,
      reviewText:
        'Average experience. Check-in took too long and the WiFi was spotty. Breakfast was decent.',
      platform: 'booking.com',
    },
    {
      reviewId: 'REV-004',
      guestName: 'Robert Martinez',
      rating: 1,
      reviewText:
        'Terrible experience. Room was dirty, AC didn\'t work, and front desk was rude. Demanded a refund. Never coming back.',
      platform: 'tripadvisor',
    },
  ];

  console.log('🔄 Processing Reviews...\n');
  console.log('='.repeat(80));

  const options = {
    hotelName: 'The Grand Hotel',
    managerName: 'Michael Anderson, General Manager',
    maxLength: 150,
  };

  for (const review of reviews) {
    const emoji =
      review.rating === 5
        ? '😍'
        : review.rating === 4
          ? '😊'
          : review.rating === 3
            ? '😐'
            : '😡';

    console.log(`\n${emoji} Review ${review.reviewId} - ${review.rating} stars (${review.platform})`);
    console.log(`Guest: ${review.guestName}`);
    console.log(`Review: "${review.reviewText.substring(0, 80)}..."\n`);

    const response = await automation.generateResponse(review, options);

    console.log('🤖 Generated Response:');
    console.log('-'.repeat(80));
    console.log(response.responseText);
    console.log('-'.repeat(80));

    console.log(`\n📊 Metadata:`);
    console.log(`   Suggested Action: ${response.suggestedAction?.toUpperCase()}`);
    console.log(`   Confidence: ${(response.confidence * 100).toFixed(1)}%`);
    console.log(`   Model: ${response.metadata.model}`);
    console.log(`   Tokens Used: ${response.metadata.tokensUsed}`);
    console.log(`   Cost: $${response.metadata.costEstimate.toFixed(6)}`);
    console.log(`   Generation Time: ${Math.round(response.metadata.executionTimeMs)}ms`);

    console.log('\n' + '='.repeat(80));

    // Small delay for readability
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Calculate ROI
  console.log('\n📈 ROI Analysis:\n');

  const monthlyReviews = 100; // Example: 100 reviews/month
  const roi = automation.calculateROI(monthlyReviews);

  console.log(`Assumptions:`);
  console.log(`   • Monthly reviews: ${monthlyReviews}`);
  console.log(`   • Automated responses: 80% (${monthlyReviews * 0.8})`);
  console.log(`   • Manual response time: 10 minutes each`);
  console.log(`   • Labor rate: $20/hour\n`);

  console.log(`Results:`);
  console.log(`   💰 Monthly AI cost: $${roi.monthlyCost.toFixed(2)}`);
  console.log(`   ⏰ Time saved: ${roi.timeSaved.toFixed(0)} minutes/month`);
  console.log(`   💵 Labor savings: $${roi.laborSavings.toFixed(2)}/month`);
  console.log(`   ✅ Net savings: $${roi.netSavings.toFixed(2)}/month`);
  console.log(`   📊 Annual savings: $${(roi.netSavings * 12).toFixed(2)}/year\n`);

  console.log('='.repeat(80));
  console.log('✅ Why Use LLMs Here:');
  console.log('   • Requires creative text generation (not classification)');
  console.log('   • Needs personalization and empathy');
  console.log('   • Context understanding is critical');
  console.log('   • Quality matters more than speed');
  console.log('   • 95%+ human-like quality');
  console.log('\n❌ Why NOT Use Traditional ML:');
  console.log('   • Template-based responses feel robotic');
  console.log('   • Rule-based systems can\'t handle nuance');
  console.log('   • BERT/sentiment models can\'t generate text');
  console.log('   • No creativity or personalization');
  console.log('\n💡 Implementation Tips:');
  console.log('   • Auto-approve 5-star responses (95% confidence)');
  console.log('   • Human review for 4-star (85% confidence)');
  console.log('   • Human escalation for 1-2 star (75% confidence)');
  console.log('   • Use GPT-4o-mini for cost-effectiveness');
  console.log('   • Set up rate limiting (5 requests/second)');
  console.log('\n🎯 Expected Results:');
  console.log('   • 90% reduction in response time (24h → 2h)');
  console.log('   • 80% automation rate for positive reviews');
  console.log('   • $500-$1,500/year net savings per 100 reviews/month');
  console.log('   • Better consistency in brand voice');
  console.log('\n');
}

main().catch(console.error);

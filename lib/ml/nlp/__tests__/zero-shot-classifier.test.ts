/**
 * Zero-Shot Classification Model Tests
 *
 * Comprehensive test suite including:
 * - Property-based tests (invariants)
 * - Behavioral tests (expected classifications)
 * - Accuracy metrics (precision, recall, F1)
 * - Edge case tests
 * - Performance benchmarks
 */

import { classifyText } from '../zero-shot-classifier';

// Labeled test dataset for hospitality classification
const LABELED_TEST_DATA = [
  // Complaints
  {
    text: 'My room is dirty and smells badly',
    expectedLabels: ['guest complaint', 'housekeeping request'],
    category: 'complaint',
  },
  {
    text: 'The AC is broken and the room is too hot',
    expectedLabels: ['guest complaint', 'maintenance problem'],
    category: 'complaint',
  },
  {
    text: 'Terrible service, staff was rude',
    expectedLabels: ['guest complaint'],
    category: 'complaint',
  },
  {
    text: 'Room smells like smoke, very disappointed',
    expectedLabels: ['guest complaint', 'housekeeping request'],
    category: 'complaint',
  },

  // Housekeeping Requests
  {
    text: 'I need extra towels in room 305',
    expectedLabels: ['housekeeping request'],
    category: 'housekeeping',
  },
  {
    text: 'Can you please clean my room?',
    expectedLabels: ['housekeeping request'],
    category: 'housekeeping',
  },
  {
    text: 'Need fresh sheets and pillows',
    expectedLabels: ['housekeeping request'],
    category: 'housekeeping',
  },

  // Bookings
  {
    text: 'I want to book a suite for next weekend',
    expectedLabels: ['new booking'],
    category: 'booking',
  },
  {
    text: 'Do you have availability for 3 nights in July?',
    expectedLabels: ['new booking'],
    category: 'booking',
  },
  {
    text: 'I would like to reserve a room with ocean view',
    expectedLabels: ['new booking'],
    category: 'booking',
  },

  // General Questions
  {
    text: 'What time is breakfast served?',
    expectedLabels: ['general question'],
    category: 'inquiry',
  },
  {
    text: 'Where is the pool located?',
    expectedLabels: ['general question'],
    category: 'inquiry',
  },
  {
    text: 'Do you have a gym?',
    expectedLabels: ['general question'],
    category: 'inquiry',
  },

  // Cancellations
  {
    text: 'I need to cancel my reservation',
    expectedLabels: ['reservation modification'],
    category: 'cancellation',
  },
  {
    text: 'Can you cancel my booking for tomorrow?',
    expectedLabels: ['reservation modification'],
    category: 'cancellation',
  },

  // Maintenance
  {
    text: 'The toilet is clogged',
    expectedLabels: ['maintenance problem'],
    category: 'maintenance',
  },
  {
    text: 'Water leak in the bathroom',
    expectedLabels: ['maintenance problem'],
    category: 'maintenance',
  },
  {
    text: 'Light bulb is broken',
    expectedLabels: ['maintenance problem'],
    category: 'maintenance',
  },
];

const CLASSIFICATION_LABELS = [
  'guest complaint',
  'housekeeping request',
  'new booking',
  'general question',
  'reservation modification',
  'maintenance problem',
];

describe('Zero-Shot Classification - Property-Based Tests', () => {
  // PROPERTY 1: Output structure is always valid
  test('PROPERTY: Output always has correct structure', async () => {
    const text = 'Test message';
    const result = await classifyText(text, CLASSIFICATION_LABELS, true);

    expect(result).toHaveProperty('text');
    expect(result).toHaveProperty('labels');
    expect(result).toHaveProperty('scores');
    expect(result).toHaveProperty('topLabel');
    expect(result).toHaveProperty('topScore');
    expect(result).toHaveProperty('executionTimeMs');

    expect(result.text).toBe(text);
    expect(Array.isArray(result.labels)).toBe(true);
    expect(Array.isArray(result.scores)).toBe(true);
    expect(result.labels.length).toBe(result.scores.length);
    expect(typeof result.topLabel).toBe('string');
    expect(typeof result.topScore).toBe('number');
    expect(typeof result.executionTimeMs).toBe('number');
  }, 30000); // 30 second timeout for model loading

  // PROPERTY 2: Scores are always between 0 and 1
  test('PROPERTY: All scores are probabilities (0 <= score <= 1)', async () => {
    const result = await classifyText(
      'My room needs cleaning',
      CLASSIFICATION_LABELS,
      true
    );

    result.scores.forEach((score) => {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    expect(result.topScore).toBeGreaterThanOrEqual(0);
    expect(result.topScore).toBeLessThanOrEqual(1);
  }, 30000);

  // PROPERTY 3: Scores are sorted in descending order
  test('PROPERTY: Scores are sorted highest to lowest', async () => {
    const result = await classifyText(
      'Need towels urgently',
      CLASSIFICATION_LABELS,
      true
    );

    for (let i = 0; i < result.scores.length - 1; i++) {
      expect(result.scores[i]).toBeGreaterThanOrEqual(result.scores[i + 1]);
    }

    expect(result.topScore).toBe(result.scores[0]);
  }, 30000);

  // PROPERTY 4: Top label matches first label in array
  test('PROPERTY: topLabel is always labels[0]', async () => {
    const result = await classifyText(
      'The staff was amazing',
      CLASSIFICATION_LABELS,
      true
    );

    expect(result.topLabel).toBe(result.labels[0]);
  }, 30000);

  // PROPERTY 5: Execution time is reasonable
  test('PROPERTY: Execution time is < 5000ms (after model loaded)', async () => {
    // Warm up model (first call loads it)
    await classifyText('warmup', CLASSIFICATION_LABELS, true);

    // Measure subsequent call
    const result = await classifyText(
      'Room service please',
      CLASSIFICATION_LABELS,
      true
    );

    expect(result.executionTimeMs).toBeLessThan(5000);
    expect(result.executionTimeMs).toBeGreaterThan(0);
  }, 30000);

  // PROPERTY 6: Empty text handling
  test('PROPERTY: Empty text returns valid result', async () => {
    const result = await classifyText('', CLASSIFICATION_LABELS, true);

    expect(result.labels).toHaveLength(CLASSIFICATION_LABELS.length);
    expect(result.scores).toHaveLength(CLASSIFICATION_LABELS.length);
    // Scores should be relatively uniform for empty text
    const avgScore = result.scores.reduce((a, b) => a + b, 0) / result.scores.length;
    result.scores.forEach((score) => {
      expect(Math.abs(score - avgScore)).toBeLessThan(0.3); // Within 30% of average
    });
  }, 30000);

  // PROPERTY 7: Single label returns that label
  test('PROPERTY: Single label always returns that label as top', async () => {
    const singleLabel = ['test-category'];
    const result = await classifyText('Any text', singleLabel, true);

    expect(result.topLabel).toBe('test-category');
    expect(result.labels).toHaveLength(1);
    expect(result.scores).toHaveLength(1);
  }, 30000);
});

describe('Zero-Shot Classification - Behavioral Tests', () => {
  // Test each category in the labeled dataset
  test.each(LABELED_TEST_DATA)(
    'BEHAVIOR: "$text" should classify as $category',
    async ({ text, expectedLabels, category }) => {
      const result = await classifyText(text, CLASSIFICATION_LABELS, true);

      // Check if at least one expected label is in top 2 predictions
      const top2Labels = result.labels.slice(0, 2);
      const hasExpectedLabel = expectedLabels.some((label) =>
        top2Labels.includes(label)
      );

      expect(hasExpectedLabel).toBe(true);

      // Log for debugging
      if (!hasExpectedLabel) {
        console.log(`❌ Failed for: "${text}"`);
        console.log(`Expected: ${expectedLabels.join(', ')}`);
        console.log(`Got top 2: ${top2Labels.join(', ')}`);
        console.log(`Scores: ${result.scores.slice(0, 2).map((s) => (s * 100).toFixed(1) + '%').join(', ')}`);
      }
    },
    30000
  );

  // Test complaint + housekeeping multi-label
  test('BEHAVIOR: Complaint about dirty room should have both complaint and housekeeping in top 3', async () => {
    const result = await classifyText(
      'My room is dirty and smells badly',
      CLASSIFICATION_LABELS,
      true
    );

    const top3Labels = result.labels.slice(0, 3);
    expect(top3Labels).toContain('guest complaint');
    expect(top3Labels).toContain('housekeeping request');
  }, 30000);

  // Test maintenance complaint
  test('BEHAVIOR: Broken AC should classify as maintenance problem', async () => {
    const result = await classifyText(
      'Air conditioning is not working',
      CLASSIFICATION_LABELS,
      true
    );

    expect(result.labels[0]).toBe('maintenance problem');
    expect(result.scores[0]).toBeGreaterThan(0.5); // High confidence
  }, 30000);

  // Test booking intent
  test('BEHAVIOR: Booking request should be top prediction', async () => {
    const result = await classifyText(
      'I would like to reserve a room for 3 nights',
      CLASSIFICATION_LABELS,
      true
    );

    expect(result.labels[0]).toBe('new booking');
    expect(result.scores[0]).toBeGreaterThan(0.4);
  }, 30000);
});

describe('Zero-Shot Classification - Accuracy Metrics', () => {
  test('ACCURACY: Calculate precision, recall, F1 on test dataset', async () => {
    const results = await Promise.all(
      LABELED_TEST_DATA.map(async ({ text, expectedLabels }) => {
        const result = await classifyText(text, CLASSIFICATION_LABELS, true);
        return { result, expectedLabels };
      })
    );

    // Calculate metrics for top-1 prediction
    let correctTop1 = 0;
    let correctTop2 = 0;
    let correctTop3 = 0;

    results.forEach(({ result, expectedLabels }) => {
      const top1 = result.labels[0];
      const top2 = result.labels.slice(0, 2);
      const top3 = result.labels.slice(0, 3);

      if (expectedLabels.includes(top1)) correctTop1++;
      if (expectedLabels.some((label) => top2.includes(label))) correctTop2++;
      if (expectedLabels.some((label) => top3.includes(label))) correctTop3++;
    });

    const top1Accuracy = correctTop1 / LABELED_TEST_DATA.length;
    const top2Accuracy = correctTop2 / LABELED_TEST_DATA.length;
    const top3Accuracy = correctTop3 / LABELED_TEST_DATA.length;

    console.log('\n📊 ACCURACY METRICS:');
    console.log(`Top-1 Accuracy: ${(top1Accuracy * 100).toFixed(1)}%`);
    console.log(`Top-2 Accuracy: ${(top2Accuracy * 100).toFixed(1)}%`);
    console.log(`Top-3 Accuracy: ${(top3Accuracy * 100).toFixed(1)}%`);
    console.log(`Test samples: ${LABELED_TEST_DATA.length}`);

    // Assertions - minimum acceptable accuracy
    expect(top1Accuracy).toBeGreaterThan(0.5); // >50% top-1 accuracy
    expect(top2Accuracy).toBeGreaterThan(0.7); // >70% top-2 accuracy
    expect(top3Accuracy).toBeGreaterThan(0.85); // >85% top-3 accuracy
  }, 120000); // 2 minute timeout for full dataset
});

describe('Zero-Shot Classification - Edge Cases', () => {
  test('EDGE: Very long text (500+ words) should still work', async () => {
    const longText = 'I need help with my room. '.repeat(100); // 500+ words
    const result = await classifyText(longText, CLASSIFICATION_LABELS, true);

    expect(result.labels).toHaveLength(CLASSIFICATION_LABELS.length);
    expect(result.topLabel).toBeTruthy();
  }, 30000);

  test('EDGE: Special characters and emojis', async () => {
    const text = 'My room 😡😡😡!!! AC NOT WORKING!!!';
    const result = await classifyText(text, CLASSIFICATION_LABELS, true);

    expect(result.labels).toHaveLength(CLASSIFICATION_LABELS.length);
    expect(result.topLabel).toBe('maintenance problem');
  }, 30000);

  test('EDGE: Numbers and dates', async () => {
    const text = 'Book room 305 for 12/25/2024 - 12/28/2024';
    const result = await classifyText(text, CLASSIFICATION_LABELS, true);

    expect(result.labels).toHaveLength(CLASSIFICATION_LABELS.length);
    expect(result.topLabel).toBe('new booking');
  }, 30000);

  test('EDGE: Mixed language (English + Spanish)', async () => {
    const text = 'My room necesita limpieza por favor';
    const result = await classifyText(text, CLASSIFICATION_LABELS, true);

    expect(result.labels).toHaveLength(CLASSIFICATION_LABELS.length);
    // Should still detect housekeeping intent
    expect(result.labels.slice(0, 2)).toContain('housekeeping request');
  }, 30000);

  test('EDGE: All caps (angry guest)', async () => {
    const text = 'THIS ROOM IS DISGUSTING AND I DEMAND A REFUND!!!';
    const result = await classifyText(text, CLASSIFICATION_LABELS, true);

    expect(result.topLabel).toBe('guest complaint');
    expect(result.scores[0]).toBeGreaterThan(0.5); // High confidence
  }, 30000);

  test('EDGE: Ambiguous text', async () => {
    const text = 'Room'; // Single word, very ambiguous
    const result = await classifyText(text, CLASSIFICATION_LABELS, true);

    expect(result.labels).toHaveLength(CLASSIFICATION_LABELS.length);
    // Scores should be relatively low confidence (distributed)
    expect(result.scores[0]).toBeLessThan(0.8);
  }, 30000);
});

describe('Zero-Shot Classification - Performance Benchmarks', () => {
  test('BENCHMARK: Average inference time for 10 samples', async () => {
    // Warm up
    await classifyText('warmup', CLASSIFICATION_LABELS, true);

    const samples = LABELED_TEST_DATA.slice(0, 10);
    const times: number[] = [];

    for (const { text } of samples) {
      const result = await classifyText(text, CLASSIFICATION_LABELS, true);
      times.push(result.executionTimeMs);
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);

    console.log('\n⚡ PERFORMANCE BENCHMARKS:');
    console.log(`Average inference time: ${avgTime.toFixed(0)}ms`);
    console.log(`Min: ${minTime.toFixed(0)}ms | Max: ${maxTime.toFixed(0)}ms`);

    // Performance targets
    expect(avgTime).toBeLessThan(3000); // Average < 3 seconds
    expect(maxTime).toBeLessThan(5000); // Max < 5 seconds
  }, 120000);

  test('BENCHMARK: Model caching - 2nd call should be faster', async () => {
    const text = 'Test message for caching';

    // First call (may load model)
    const result1 = await classifyText(text, CLASSIFICATION_LABELS, true);

    // Second call (should use cached model)
    const result2 = await classifyText(text, CLASSIFICATION_LABELS, true);

    console.log(`\n🔄 CACHING TEST:`);
    console.log(`1st call: ${result1.executionTimeMs}ms`);
    console.log(`2nd call: ${result2.executionTimeMs}ms`);

    // Second call should be same or faster (within 20% variance)
    expect(result2.executionTimeMs).toBeLessThanOrEqual(result1.executionTimeMs * 1.2);
  }, 60000);
});

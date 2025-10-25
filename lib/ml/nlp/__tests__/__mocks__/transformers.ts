/**
 * Mock for @xenova/transformers
 *
 * This mock simulates the BART model's behavior for testing without
 * loading the actual 1GB+ model, which would be too slow for CI/CD.
 */

// Mock env object for configuration
export const env = {
  allowLocalModels: false,
  allowRemoteModels: true,
  backends: {
    onnx: {
      wasm: {
        numThreads: 1,
      },
    },
  },
};

export const pipeline = jest.fn().mockImplementation((task: string, model: string) => {
  return Promise.resolve(async (text: string, labels: string[], options?: any) => {
    // Add small deterministic delay to simulate inference time
    await new Promise((resolve) => setTimeout(resolve, 2)); // 2ms consistent

    // Simulate the model's classification behavior
    const multiLabel = options?.multi_label || false;

    // Simple mock logic: assign scores based on keywords in text
    const scores = labels.map((label) => {
      const labelLower = label.toLowerCase();
      const textLower = text.toLowerCase();

      let score = 0.1; // Base score

      // Keyword matching simulation for complaints (prioritize strong negative words)
      if (labelLower.includes('complaint') && (
        textLower.includes('disgusting') ||
        textLower.includes('refund') ||
        textLower.includes('demand') ||
        textLower.includes('dirty') ||
        textLower.includes('bad') ||
        textLower.includes('terrible') ||
        textLower.includes('rude') ||
        textLower.includes('disappointed')
      )) {
        score = 0.75 + Math.random() * 0.2; // 75-95%
      }

      if (labelLower.includes('housekeeping') && (
        textLower.includes('towel') ||
        textLower.includes('clean') ||
        textLower.includes('limpieza') || // Spanish: cleaning
        textLower.includes('dirty') || // Dirty rooms need housekeeping
        textLower.includes('sheet')
      )) {
        // Lower priority if strong complaint words present
        if (textLower.includes('disgusting') || textLower.includes('refund')) {
          score = 0.40 + Math.random() * 0.15; // 40-55%
        } else {
          score = 0.75 + Math.random() * 0.15; // 75-90% (high score for clear housekeeping issues)
        }
      }

      if (labelLower.includes('booking') && (
        textLower.includes('book') ||
        textLower.includes('reserve') ||
        textLower.includes('availability')
      )) {
        score = 0.80 + Math.random() * 0.15; // 80-95%
      }

      if (labelLower.includes('question') && (
        textLower.includes('what') ||
        textLower.includes('when') ||
        textLower.includes('where') ||
        textLower.includes('how') ||
        textLower.includes('do you') ||
        textLower.includes('have')
      )) {
        score = 0.65 + Math.random() * 0.25; // 65-90%
      }

      if ((labelLower.includes('modification') || labelLower.includes('cancel')) && (
        textLower.includes('cancel') ||
        textLower.includes('modify') ||
        textLower.includes('change') ||
        textLower.includes('reservation')
      )) {
        score = 0.75 + Math.random() * 0.2; // 75-95%
      }

      if (labelLower.includes('maintenance') && (
        textLower.includes('broken') ||
        textLower.includes('not working') ||
        textLower.includes('leak') ||
        textLower.includes('fix') ||
        textLower.includes('clog')
      )) {
        score = 0.75 + Math.random() * 0.2; // 75-95%
      }

      // Add random noise to make it more realistic
      score += (Math.random() - 0.5) * 0.1; // ±5%
      score = Math.max(0, Math.min(1, score)); // Clamp to [0, 1]

      return score;
    });

    // Sort by score (descending)
    const sortedIndices = scores
      .map((score, index) => ({ score, index }))
      .sort((a, b) => b.score - a.score);

    const sortedLabels = sortedIndices.map((item) => labels[item.index]);
    const sortedScores = sortedIndices.map((item) => scores[item.index]);

    return {
      labels: sortedLabels,
      scores: sortedScores,
    };
  });
});

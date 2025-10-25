/**
 * Voice/Speech Analysis Module
 *
 * Algorithmic simulation of speech analysis for hospitality use cases.
 * No actual speech recognition libraries - uses text-based heuristics
 * to simulate voice complaint detection, booking analysis, and sentiment.
 *
 * Zero-cost local processing approach.
 */

// ============================================================================
// Types
// ============================================================================

export interface SpeechInput {
  callId: string;
  timestamp: Date;
  transcription: string;
  duration: number; // seconds
  audioQuality?: number; // 0-100
  backgroundNoise?: number; // 0-100
  speakerCount?: number;
}

export interface SentimentAnalysis {
  overall: 'positive' | 'neutral' | 'negative';
  confidence: number; // 0-100
  emotionalTone: string[];
  intensity: number; // 0-100
  keywords: string[];
}

export interface ComplaintClassification {
  isComplaint: boolean;
  confidence: number;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedIssues: string[];
  requiresEscalation: boolean;
  suggestedResolution?: string;
}

export interface BookingIntent {
  isBookingInquiry: boolean;
  confidence: number;
  intentType: 'new-booking' | 'modification' | 'cancellation' | 'inquiry' | 'none';
  detectedDates?: string[];
  detectedRoomTypes?: string[];
  guestCount?: number;
  urgency: 'low' | 'medium' | 'high';
  readyToBook: boolean;
}

export interface SpeakerProfile {
  type: 'guest' | 'staff' | 'unknown';
  confidence: number;
  language: string;
  speaking_rate: 'slow' | 'normal' | 'fast';
  formality: number; // 0-100
  emotionalState: string;
}

export interface KeyPhrase {
  phrase: string;
  importance: number; // 0-100
  category: string;
  frequency: number;
}

export interface CallQualityMetrics {
  audioQuality: number; // 0-100
  clarity: number; // 0-100
  backgroundNoise: number; // 0-100
  speakerSeparation: number; // 0-100
  overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
  technicalIssues: string[];
}

export interface CallAnalysis {
  callId: string;
  timestamp: Date;
  duration: number;
  sentiment: SentimentAnalysis;
  complaint?: ComplaintClassification;
  bookingIntent?: BookingIntent;
  speakers: SpeakerProfile[];
  keyPhrases: KeyPhrase[];
  callQuality: CallQualityMetrics;
  actionItems: string[];
  summary: string;
}

export interface SpeechAnalytics {
  totalCalls: number;
  averageDuration: number;
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  complaintRate: number;
  bookingConversionRate: number;
  averageCallQuality: number;
  topIssues: Array<{ issue: string; count: number }>;
  trendAnalysis: {
    improving: boolean;
    changeRate: number; // percentage
    prediction: string;
  };
}

// ============================================================================
// Core Analysis Functions
// ============================================================================

/**
 * Analyzes sentiment from speech transcription
 */
export function analyzeSentiment(transcription: string): SentimentAnalysis {
  const text = transcription.toLowerCase();

  // Positive keywords
  const positiveWords = [
    'excellent', 'great', 'wonderful', 'amazing', 'perfect', 'love', 'fantastic',
    'beautiful', 'impressed', 'happy', 'delighted', 'pleased', 'thank', 'thanks',
    'appreciate', 'satisfied', 'comfortable', 'clean', 'friendly', 'helpful',
  ];

  // Negative keywords
  const negativeWords = [
    'terrible', 'awful', 'horrible', 'disgusting', 'dirty', 'rude', 'unacceptable',
    'disappointed', 'angry', 'frustrat', 'annoying', 'bad', 'worst', 'never',
    'complaint', 'refund', 'poor', 'uncomfortable', 'broken', 'issue', 'problem',
    'wait', 'delay', 'noise', 'smell', 'cold', 'hot',
  ];

  // Emotional tone keywords
  const emotionalTones = {
    frustrated: ['frustrat', 'annoying', 'ridiculous', 'unbelievable'],
    angry: ['angry', 'furious', 'outraged', 'unacceptable', 'disgusting'],
    disappointed: ['disappoint', 'expected', 'supposed', 'promised'],
    satisfied: ['satisfied', 'content', 'pleased', 'happy'],
    excited: ['excited', 'thrilled', 'amazing', 'fantastic', 'love'],
  };

  // Count sentiment words
  const positiveCount = positiveWords.filter(word => text.includes(word)).length;
  const negativeCount = negativeWords.filter(word => text.includes(word)).length;

  // Detect emotional tones
  const detectedTones: string[] = [];
  Object.entries(emotionalTones).forEach(([tone, keywords]) => {
    if (keywords.some(keyword => text.includes(keyword))) {
      detectedTones.push(tone);
    }
  });

  // Determine overall sentiment
  let overall: 'positive' | 'neutral' | 'negative';
  if (positiveCount > negativeCount + 1) {
    overall = 'positive';
  } else if (negativeCount > positiveCount + 1) {
    overall = 'negative';
  } else {
    overall = 'neutral';
  }

  // Calculate confidence
  const totalSentimentWords = positiveCount + negativeCount;
  const wordCount = text.split(/\s+/).length;
  const confidence = Math.min(100, Math.round(
    (totalSentimentWords / Math.max(wordCount / 10, 1)) * 100
  ));

  // Calculate intensity
  const intensity = Math.min(100, Math.round(
    (Math.abs(positiveCount - negativeCount) / Math.max(wordCount / 20, 1)) * 100
  ));

  // Extract sentiment keywords
  const keywords = [
    ...positiveWords.filter(word => text.includes(word)),
    ...negativeWords.filter(word => text.includes(word)),
  ].slice(0, 10);

  return {
    overall,
    confidence,
    emotionalTone: detectedTones,
    intensity,
    keywords,
  };
}

/**
 * Classifies if transcription contains a complaint
 */
export function classifyComplaint(
  transcription: string,
  sentiment?: SentimentAnalysis
): ComplaintClassification {
  const text = transcription.toLowerCase();

  // Complaint indicators
  const complaintKeywords = [
    'complaint', 'complain', 'issue', 'problem', 'unacceptable', 'disappointed',
    'refund', 'manager', 'speak to', 'terrible', 'awful', 'disgusting', 'dirty',
  ];

  // Category keywords
  const categories = {
    cleanliness: ['dirty', 'clean', 'smell', 'stain', 'mess', 'disgust'],
    service: ['rude', 'staff', 'service', 'wait', 'slow', 'ignor', 'unprofessional'],
    maintenance: ['broken', 'fix', 'repair', 'not working', 'malfunction', 'damage'],
    noise: ['noise', 'noisy', 'loud', 'disturb', 'quiet', 'sleep'],
    room: ['room', 'bed', 'bathroom', 'shower', 'temperature', 'cold', 'hot'],
    billing: ['charge', 'bill', 'price', 'cost', 'overcharge', 'refund'],
  };

  // Check for complaint keywords
  const complaintScore = complaintKeywords.filter(word => text.includes(word)).length;
  const isComplaint = complaintScore > 0 || (sentiment?.overall === 'negative' && sentiment.intensity ?? 0 > 60);

  // Determine category
  let category = 'general';
  let maxMatches = 0;
  Object.entries(categories).forEach(([cat, keywords]) => {
    const matches = keywords.filter(word => text.includes(word)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      category = cat;
    }
  });

  // Detect specific issues
  const detectedIssues: string[] = [];
  if (text.includes('dirty') || text.includes('clean')) {
    detectedIssues.push('Cleanliness concerns');
  }
  if (text.includes('rude') || text.includes('unprofessional')) {
    detectedIssues.push('Staff behavior');
  }
  if (text.includes('broken') || text.includes('not working')) {
    detectedIssues.push('Equipment malfunction');
  }
  if (text.includes('noise') || text.includes('loud')) {
    detectedIssues.push('Noise disturbance');
  }
  if (text.includes('wait') || text.includes('delay')) {
    detectedIssues.push('Wait time');
  }

  // Determine severity
  let severity: ComplaintClassification['severity'];
  const urgentWords = ['urgent', 'immediately', 'now', 'asap', 'emergency'];
  const criticalWords = ['dangerous', 'unsafe', 'health', 'medical', 'injured'];

  if (criticalWords.some(word => text.includes(word))) {
    severity = 'critical';
  } else if (urgentWords.some(word => text.includes(word)) || sentiment?.intensity > 80) {
    severity = 'high';
  } else if (complaintScore >= 2 || detectedIssues.length >= 2) {
    severity = 'medium';
  } else {
    severity = 'low';
  }

  const requiresEscalation = severity === 'critical' || severity === 'high';

  // Suggest resolution
  let suggestedResolution: string | undefined;
  if (isComplaint) {
    if (category === 'cleanliness') {
      suggestedResolution = 'Immediate housekeeping dispatch and room inspection';
    } else if (category === 'service') {
      suggestedResolution = 'Manager follow-up and staff training review';
    } else if (category === 'maintenance') {
      suggestedResolution = 'Maintenance team dispatch for immediate repair';
    } else if (category === 'noise') {
      suggestedResolution = 'Room relocation offer and noise policy enforcement';
    } else if (category === 'billing') {
      suggestedResolution = 'Billing review and potential adjustment';
    } else {
      suggestedResolution = 'Guest relations follow-up and resolution';
    }
  }

  const confidence = Math.min(100, Math.round(
    (complaintScore * 30 + (sentiment?.confidence || 50)) / 2
  ));

  return {
    isComplaint,
    confidence,
    category,
    severity,
    detectedIssues,
    requiresEscalation,
    suggestedResolution,
  };
}

/**
 * Detects booking intent from transcription
 */
export function detectBookingIntent(transcription: string): BookingIntent {
  const text = transcription.toLowerCase();

  // Booking keywords
  const bookingKeywords = [
    'book', 'reservation', 'reserve', 'room', 'stay', 'night', 'check in',
    'check out', 'available', 'availability', 'rate', 'price',
  ];

  // Intent type keywords
  const intentTypes = {
    'new-booking': ['like to book', 'want to book', 'make a reservation', 'new booking', 'book a room', 'book that'],
    'modification': ['change', 'modify', 'update', 'move reservation', 'extend', 'shorten', 'different date', 'change my reservation'],
    'cancellation': ['cancel', 'refund', 'not coming', 'changed my mind'],
    'inquiry': ['available', 'availability', 'price', 'rate', 'information', 'details'],
  };

  // Check for booking keywords
  const bookingScore = bookingKeywords.filter(word => text.includes(word)).length;
  const isBookingInquiry = bookingScore >= 1;

  // Determine intent type
  let intentType: BookingIntent['intentType'] = 'none';
  let maxMatches = 0;
  Object.entries(intentTypes).forEach(([type, keywords]) => {
    const matches = keywords.filter(word => text.includes(word)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      intentType = type as BookingIntent['intentType'];
    }
  });

  if (!isBookingInquiry) {
    intentType = 'none';
  }

  // Extract dates (simple pattern matching)
  const datePatterns = [
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/gi,
    /\b\d{1,2}\/\d{1,2}\/\d{2,4}/g,
    /\b(tomorrow|tonight|next week|next month)/gi,
  ];

  const detectedDates: string[] = [];
  datePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      detectedDates.push(...matches);
    }
  });

  // Extract room types
  const roomTypes = ['single', 'double', 'suite', 'deluxe', 'standard', 'king', 'queen', 'twin'];
  const detectedRoomTypes = roomTypes.filter(type => text.includes(type));

  // Extract guest count
  const guestPattern = /(\d+)\s+(people|person|guest|adults?|children?)/i;
  const guestMatch = text.match(guestPattern);
  let guestCount: number | undefined;
  if (guestMatch) {
    guestCount = parseInt(guestMatch[1], 10);
  }

  // Determine urgency
  const urgentWords = ['urgent', 'asap', 'soon', 'immediately', 'tonight', 'today', 'tomorrow'];
  const urgency = urgentWords.some(word => text.includes(word)) ? 'high' :
    detectedDates.length > 0 ? 'medium' : 'low';

  // Ready to book?
  const readyIndicators = ['book', 'reserve', 'confirm', 'yes', 'proceed', 'go ahead'];
  const readyToBook = intentType === 'new-booking' &&
    readyIndicators.some(word => text.includes(word)) &&
    (detectedDates.length > 0 || detectedRoomTypes.length > 0);

  const confidence = Math.min(100, Math.round(
    (bookingScore * 20 + (detectedDates.length * 30) + (detectedRoomTypes.length * 20))
  ));

  return {
    isBookingInquiry,
    confidence,
    intentType,
    detectedDates: detectedDates.length > 0 ? detectedDates : undefined,
    detectedRoomTypes: detectedRoomTypes.length > 0 ? detectedRoomTypes : undefined,
    guestCount,
    urgency,
    readyToBook,
  };
}

/**
 * Profiles the speaker from transcription patterns
 */
export function profileSpeaker(
  transcription: string,
  audioQuality?: number
): SpeakerProfile {
  const text = transcription.toLowerCase();
  const wordCount = text.split(/\s+/).length;

  // Detect if guest or staff
  const guestIndicators = ['i want', 'i need', 'my room', 'i\'m staying', 'guest'];
  const staffIndicators = ['how may i help', 'certainly', 'of course', 'i\'ll be happy', 'policy', 'management'];

  const guestScore = guestIndicators.filter(phrase => text.includes(phrase)).length;
  const staffScore = staffIndicators.filter(phrase => text.includes(phrase)).length;

  let type: SpeakerProfile['type'];
  let confidence: number;

  if (guestScore > staffScore) {
    type = 'guest';
    confidence = Math.min(100, 50 + guestScore * 20);
  } else if (staffScore > guestScore) {
    type = 'staff';
    confidence = Math.min(100, 50 + staffScore * 20);
  } else {
    type = 'unknown';
    confidence = 30;
  }

  // Detect language (simple heuristic)
  const languageIndicators = {
    english: ['the', 'is', 'and', 'to', 'a'],
    spanish: ['el', 'la', 'de', 'que', 'por'],
    french: ['le', 'la', 'de', 'et', 'un'],
  };

  let language = 'english';
  let maxIndicators = 0;
  Object.entries(languageIndicators).forEach(([lang, indicators]) => {
    const count = indicators.filter(word => text.includes(` ${word} `)).length;
    if (count > maxIndicators) {
      maxIndicators = count;
      language = lang;
    }
  });

  // Estimate speaking rate (words per minute, assuming 150 wpm normal)
  const speaking_rate: SpeakerProfile['speaking_rate'] =
    wordCount < 50 ? 'slow' :
    wordCount > 120 ? 'fast' : 'normal';

  // Formality level
  const formalWords = ['certainly', 'absolutely', 'please', 'kindly', 'appreciate', 'apologize'];
  const informalWords = ['yeah', 'yep', 'nope', 'gonna', 'wanna', 'gotta'];

  const formalCount = formalWords.filter(word => text.includes(word)).length;
  const informalCount = informalWords.filter(word => text.includes(word)).length;

  const formality = Math.round(
    ((formalCount - informalCount) / Math.max(wordCount / 50, 1) + 1) * 50
  );

  // Emotional state
  const emotionalStates = {
    calm: ['thank', 'appreciate', 'understand', 'okay'],
    stressed: ['need', 'urgent', 'quickly', 'now'],
    upset: ['unacceptable', 'terrible', 'disappointed', 'angry'],
    happy: ['great', 'wonderful', 'excellent', 'love'],
  };

  let emotionalState = 'neutral';
  let maxStateScore = 0;
  Object.entries(emotionalStates).forEach(([state, keywords]) => {
    const score = keywords.filter(word => text.includes(word)).length;
    if (score > maxStateScore) {
      maxStateScore = score;
      emotionalState = state;
    }
  });

  return {
    type,
    confidence,
    language,
    speaking_rate,
    formality: Math.max(0, Math.min(100, formality)),
    emotionalState,
  };
}

/**
 * Extracts key phrases from transcription
 */
export function extractKeyPhrases(transcription: string): KeyPhrase[] {
  const text = transcription.toLowerCase();

  // Common hospitality phrases
  const phrases = [
    // Booking related
    { phrase: 'make a reservation', category: 'booking', baseImportance: 90 },
    { phrase: 'check availability', category: 'booking', baseImportance: 85 },
    { phrase: 'room rate', category: 'booking', baseImportance: 80 },
    { phrase: 'check in', category: 'booking', baseImportance: 75 },
    { phrase: 'check out', category: 'booking', baseImportance: 75 },

    // Complaint related
    { phrase: 'not satisfied', category: 'complaint', baseImportance: 95 },
    { phrase: 'speak to manager', category: 'complaint', baseImportance: 90 },
    { phrase: 'file a complaint', category: 'complaint', baseImportance: 95 },
    { phrase: 'request refund', category: 'complaint', baseImportance: 85 },

    // Service related
    { phrase: 'room service', category: 'service', baseImportance: 70 },
    { phrase: 'housekeeping', category: 'service', baseImportance: 70 },
    { phrase: 'front desk', category: 'service', baseImportance: 65 },
    { phrase: 'concierge', category: 'service', baseImportance: 65 },

    // Amenity related
    { phrase: 'swimming pool', category: 'amenity', baseImportance: 60 },
    { phrase: 'fitness center', category: 'amenity', baseImportance: 60 },
    { phrase: 'breakfast', category: 'amenity', baseImportance: 65 },
    { phrase: 'wifi', category: 'amenity', baseImportance: 70 },

    // Problem related
    { phrase: 'not working', category: 'problem', baseImportance: 85 },
    { phrase: 'broken', category: 'problem', baseImportance: 80 },
    { phrase: 'too noisy', category: 'problem', baseImportance: 75 },
    { phrase: 'too cold', category: 'problem', baseImportance: 75 },
    { phrase: 'too hot', category: 'problem', baseImportance: 75 },
  ];

  const detected: KeyPhrase[] = [];

  phrases.forEach(({ phrase, category, baseImportance }) => {
    const regex = new RegExp(phrase, 'gi');
    const matches = text.match(regex);

    if (matches) {
      detected.push({
        phrase,
        importance: baseImportance,
        category,
        frequency: matches.length,
      });
    }
  });

  // Sort by importance and frequency
  return detected
    .sort((a, b) => (b.importance * b.frequency) - (a.importance * a.frequency))
    .slice(0, 10);
}

/**
 * Assesses call quality metrics
 */
export function assessCallQuality(input: SpeechInput): CallQualityMetrics {
  const audioQuality = input.audioQuality || 75;
  const backgroundNoise = input.backgroundNoise || 20;
  const speakerCount = input.speakerCount || 1;

  // Clarity based on audio quality and noise
  const clarity = Math.round((audioQuality * 0.7) + ((100 - backgroundNoise) * 0.3));

  // Speaker separation (easier with fewer speakers)
  const speakerSeparation = speakerCount <= 2 ?
    Math.round(audioQuality * 0.9) :
    Math.round(audioQuality * 0.6);

  // Overall quality
  const overallScore = Math.round((audioQuality + clarity + (100 - backgroundNoise) + speakerSeparation) / 4);

  let overallQuality: CallQualityMetrics['overallQuality'];
  if (overallScore >= 80) {
    overallQuality = 'excellent';
  } else if (overallScore >= 60) {
    overallQuality = 'good';
  } else if (overallScore >= 40) {
    overallQuality = 'fair';
  } else {
    overallQuality = 'poor';
  }

  // Detect technical issues
  const technicalIssues: string[] = [];
  if (audioQuality < 50) {
    technicalIssues.push('Low audio quality detected');
  }
  if (backgroundNoise > 60) {
    technicalIssues.push('High background noise');
  }
  if (speakerCount > 2 && speakerSeparation < 60) {
    technicalIssues.push('Difficulty separating multiple speakers');
  }
  if (input.duration < 30) {
    technicalIssues.push('Call duration very short');
  }

  return {
    audioQuality,
    clarity,
    backgroundNoise,
    speakerSeparation,
    overallQuality,
    technicalIssues,
  };
}

/**
 * Performs comprehensive call analysis
 */
export function analyzeCall(input: SpeechInput): CallAnalysis {
  const sentiment = analyzeSentiment(input.transcription);
  const complaint = classifyComplaint(input.transcription, sentiment);
  const bookingIntent = detectBookingIntent(input.transcription);
  const speaker = profileSpeaker(input.transcription, input.audioQuality);
  const keyPhrases = extractKeyPhrases(input.transcription);
  const callQuality = assessCallQuality(input);

  // Determine speakers (simplified - assumes 2 speakers: guest and staff)
  const speakers: SpeakerProfile[] = [speaker];
  if (input.speakerCount && input.speakerCount > 1) {
    // Add complementary speaker
    speakers.push({
      type: speaker.type === 'guest' ? 'staff' : 'guest',
      confidence: 60,
      language: speaker.language,
      speaking_rate: 'normal',
      formality: speaker.type === 'guest' ? 80 : 50,
      emotionalState: 'calm',
    });
  }

  // Generate action items
  const actionItems: string[] = [];
  if (complaint.isComplaint && complaint.requiresEscalation) {
    actionItems.push('URGENT: Escalate to management immediately');
  }
  if (complaint.isComplaint && complaint.suggestedResolution) {
    actionItems.push(complaint.suggestedResolution);
  }
  if (bookingIntent.isBookingInquiry && bookingIntent.readyToBook) {
    actionItems.push('Complete booking process with guest details');
  }
  if (bookingIntent.isBookingInquiry && !bookingIntent.readyToBook) {
    actionItems.push('Send booking information and follow up within 24 hours');
  }
  if (sentiment.overall === 'negative' && !complaint.isComplaint) {
    actionItems.push('Follow up with guest to address concerns');
  }
  if (callQuality.overallQuality === 'poor') {
    actionItems.push('Review and improve call quality setup');
  }

  // Generate summary
  const summary = generateCallSummary(
    sentiment,
    complaint,
    bookingIntent,
    speaker,
    input.duration
  );

  return {
    callId: input.callId,
    timestamp: input.timestamp,
    duration: input.duration,
    sentiment,
    complaint: complaint.isComplaint ? complaint : undefined,
    bookingIntent: bookingIntent.isBookingInquiry ? bookingIntent : undefined,
    speakers,
    keyPhrases,
    callQuality,
    actionItems,
    summary,
  };
}

/**
 * Analyzes trends across multiple calls
 */
export function analyzeSpeechTrends(calls: CallAnalysis[]): SpeechAnalytics {
  if (calls.length === 0) {
    throw new Error('At least one call is required');
  }

  const totalCalls = calls.length;
  const averageDuration = Math.round(
    calls.reduce((sum, call) => sum + call.duration, 0) / totalCalls
  );

  // Sentiment distribution
  const sentimentCounts = {
    positive: calls.filter(c => c.sentiment.overall === 'positive').length,
    neutral: calls.filter(c => c.sentiment.overall === 'neutral').length,
    negative: calls.filter(c => c.sentiment.overall === 'negative').length,
  };

  const sentimentDistribution = {
    positive: Math.round((sentimentCounts.positive / totalCalls) * 100),
    neutral: Math.round((sentimentCounts.neutral / totalCalls) * 100),
    negative: Math.round((sentimentCounts.negative / totalCalls) * 100),
  };

  // Complaint rate
  const complaintsCount = calls.filter(c => c.complaint).length;
  const complaintRate = Math.round((complaintsCount / totalCalls) * 100);

  // Booking conversion rate
  const bookingInquiries = calls.filter(c => c.bookingIntent).length;
  const bookingsReady = calls.filter(c => c.bookingIntent?.readyToBook).length;
  const bookingConversionRate = bookingInquiries > 0 ?
    Math.round((bookingsReady / bookingInquiries) * 100) : 0;

  // Average call quality
  const qualityScores = {
    excellent: 90,
    good: 75,
    fair: 55,
    poor: 30,
  };
  const averageCallQuality = Math.round(
    calls.reduce((sum, call) => sum + qualityScores[call.callQuality.overallQuality], 0) / totalCalls
  );

  // Top issues
  const issueMap = new Map<string, number>();
  calls.forEach(call => {
    if (call.complaint) {
      call.complaint.detectedIssues.forEach(issue => {
        issueMap.set(issue, (issueMap.get(issue) || 0) + 1);
      });
    }
  });

  const topIssues = Array.from(issueMap.entries())
    .map(([issue, count]) => ({ issue, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Trend analysis
  const firstHalf = calls.slice(0, Math.floor(calls.length / 2));
  const secondHalf = calls.slice(Math.floor(calls.length / 2));

  const firstPositiveRate = firstHalf.filter(c => c.sentiment.overall === 'positive').length / firstHalf.length;
  const secondPositiveRate = secondHalf.filter(c => c.sentiment.overall === 'positive').length / secondHalf.length;

  const improving = secondPositiveRate > firstPositiveRate;
  const changeRate = Math.round(((secondPositiveRate - firstPositiveRate) / firstPositiveRate) * 100);

  const prediction = improving ?
    'Positive sentiment trending upward - maintain current service standards' :
    'Sentiment declining - review service quality and address common issues';

  return {
    totalCalls,
    averageDuration,
    sentimentDistribution,
    complaintRate,
    bookingConversionRate,
    averageCallQuality,
    topIssues,
    trendAnalysis: {
      improving,
      changeRate,
      prediction,
    },
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateCallSummary(
  sentiment: SentimentAnalysis,
  complaint: ComplaintClassification,
  bookingIntent: BookingIntent,
  speaker: SpeakerProfile,
  duration: number
): string {
  const parts: string[] = [];

  // Duration
  parts.push(`${Math.floor(duration / 60)}m ${duration % 60}s call`);

  // Speaker
  parts.push(`from ${speaker.type}`);

  // Sentiment
  parts.push(`with ${sentiment.overall} sentiment`);

  // Main topic
  if (complaint.isComplaint) {
    parts.push(`regarding ${complaint.category} complaint (${complaint.severity} severity)`);
  } else if (bookingIntent.isBookingInquiry) {
    parts.push(`about ${bookingIntent.intentType}`);
  } else {
    parts.push('general inquiry');
  }

  return parts.join(' ');
}

/**
 * Tests for Voice/Speech Analysis Module
 */

import {
  analyzeSentiment,
  classifyComplaint,
  detectBookingIntent,
  profileSpeaker,
  extractKeyPhrases,
  assessCallQuality,
  analyzeCall,
  analyzeSpeechTrends,
  type SpeechInput,
  type CallAnalysis,
} from '../analyzer';

describe('Voice/Speech Analysis Module', () => {
  describe('analyzeSentiment', () => {
    it('should detect positive sentiment', () => {
      const transcription = `Thank you so much! The room is excellent and the staff is wonderful.
        I'm very happy with my stay and everything is perfect. Great service!`;

      const sentiment = analyzeSentiment(transcription);

      expect(sentiment.overall).toBe('positive');
      expect(sentiment.confidence).toBeGreaterThan(50);
      expect(sentiment.emotionalTone).toContain('satisfied');
      expect(sentiment.keywords.length).toBeGreaterThan(0);
    });

    it('should detect negative sentiment', () => {
      const transcription = `This is terrible! The room is dirty and disgusting.
        I'm very disappointed and frustrated. The service is awful and unacceptable.
        This is the worst experience I've ever had.`;

      const sentiment = analyzeSentiment(transcription);

      expect(sentiment.overall).toBe('negative');
      expect(sentiment.confidence).toBeGreaterThan(50);
      expect(sentiment.intensity).toBeGreaterThan(50);
      expect(['frustrated', 'angry', 'disappointed']).toEqual(
        expect.arrayContaining(sentiment.emotionalTone)
      );
    });

    it('should detect neutral sentiment', () => {
      const transcription = `I would like to check in please. My reservation is under Smith.
        The confirmation number is 12345.`;

      const sentiment = analyzeSentiment(transcription);

      expect(sentiment.overall).toBe('neutral');
    });

    it('should calculate intensity correctly', () => {
      const highIntensity = `This is absolutely terrible! Disgusting and awful!
        The worst experience ever! Unacceptable!`;

      const lowIntensity = `The room could be better. Not quite what I expected.`;

      const high = analyzeSentiment(highIntensity);
      const low = analyzeSentiment(lowIntensity);

      expect(high.intensity).toBeGreaterThan(low.intensity);
    });

    it('should detect emotional tones', () => {
      const frustrated = `This is so frustrating! This is ridiculous!`;
      const excited = `I'm so excited! This is amazing!`;

      const frustratedResult = analyzeSentiment(frustrated);
      const excitedResult = analyzeSentiment(excited);

      expect(frustratedResult.emotionalTone).toContain('frustrated');
      expect(excitedResult.emotionalTone).toContain('excited');
    });
  });

  describe('classifyComplaint', () => {
    it('should identify complaints', () => {
      const transcription = `I have a complaint about my room. It's dirty and the bathroom is disgusting.
        I'm very disappointed and want to speak to the manager.`;

      const classification = classifyComplaint(transcription);

      expect(classification.isComplaint).toBe(true);
      expect(classification.confidence).toBeGreaterThan(50);
      expect(classification.category).toBeTruthy();
      expect(classification.detectedIssues.length).toBeGreaterThan(0);
    });

    it('should categorize complaints correctly', () => {
      const cleanliness = `The room is dirty and has a bad smell. The bathroom needs cleaning.`;
      const service = `The staff was very rude and unprofessional. Poor service.`;
      const maintenance = `The air conditioning is broken and not working.`;
      const noise = `It's too noisy here. I can't sleep because of the noise.`;

      const clean = classifyComplaint(cleanliness);
      const serv = classifyComplaint(service);
      const maint = classifyComplaint(maintenance);
      const noi = classifyComplaint(noise);

      expect(clean.category).toBe('cleanliness');
      expect(serv.category).toBe('service');
      expect(maint.category).toBe('maintenance');
      expect(noi.category).toBe('noise');
    });

    it('should determine severity levels', () => {
      const critical = `This is dangerous! There's a health hazard in my room!`;
      const high = `This is urgent! I need this fixed immediately!`;
      const medium = `I have a complaint about the room. There are two issues.`;
      const low = `The room could be better.`;

      const critResult = classifyComplaint(critical);
      const highResult = classifyComplaint(high);
      const medResult = classifyComplaint(medium);
      const lowResult = classifyComplaint(low);

      expect(critResult.severity).toBe('critical');
      expect(highResult.severity).toBe('high');
      expect(['medium', 'low']).toContain(medResult.severity);
      expect(lowResult.severity).toBe('low');
    });

    it('should flag escalation for critical complaints', () => {
      const critical = `This is a health emergency! Someone is injured!`;
      const urgent = `I need to speak to the manager immediately!`;

      const critResult = classifyComplaint(critical);
      const urgResult = classifyComplaint(urgent);

      expect(critResult.requiresEscalation).toBe(true);
      expect(urgResult.requiresEscalation).toBe(true);
    });

    it('should provide resolution suggestions', () => {
      const transcription = `The room is dirty and needs cleaning immediately.`;

      const classification = classifyComplaint(transcription);

      expect(classification.suggestedResolution).toBeTruthy();
      expect(classification.suggestedResolution).toContain('housekeeping');
    });

    it('should not classify non-complaints', () => {
      const transcription = `I'd like to book a room for next week. What are the rates?`;

      const classification = classifyComplaint(transcription);

      expect(classification.isComplaint).toBe(false);
    });
  });

  describe('detectBookingIntent', () => {
    it('should detect booking inquiries', () => {
      const transcription = `I'd like to make a reservation for next Friday.
        Do you have any rooms available? What are your rates?`;

      const intent = detectBookingIntent(transcription);

      expect(intent.isBookingInquiry).toBe(true);
      expect(intent.confidence).toBeGreaterThan(50);
    });

    it('should classify intent types', () => {
      const newBooking = `I want to book a room for next week.`;
      const modification = `I need to change my reservation to a different date.`;
      const cancellation = `I need to cancel my booking.`;
      const inquiry = `What's your availability for next month?`;

      const newResult = detectBookingIntent(newBooking);
      const modResult = detectBookingIntent(modification);
      const cancelResult = detectBookingIntent(cancellation);
      const inquiryResult = detectBookingIntent(inquiry);

      expect(newResult.intentType).toBe('new-booking');
      expect(modResult.intentType).toBe('modification');
      expect(cancelResult.intentType).toBe('cancellation');
      expect(inquiryResult.intentType).toBe('inquiry');
    });

    it('should extract dates from transcription', () => {
      const transcription = `I want to book a room for December 25th and check out on December 27th.`;

      const intent = detectBookingIntent(transcription);

      expect(intent.detectedDates).toBeDefined();
      expect(intent.detectedDates!.length).toBeGreaterThan(0);
    });

    it('should extract room types', () => {
      const transcription = `I need a deluxe suite with a king bed for next weekend.`;

      const intent = detectBookingIntent(transcription);

      expect(intent.detectedRoomTypes).toBeDefined();
      expect(intent.detectedRoomTypes).toContain('deluxe');
      expect(intent.detectedRoomTypes).toContain('suite');
      expect(intent.detectedRoomTypes).toContain('king');
    });

    it('should extract guest count', () => {
      const transcription = `I need a room for 4 people next Friday.`;

      const intent = detectBookingIntent(transcription);

      expect(intent.guestCount).toBe(4);
    });

    it('should determine urgency', () => {
      const urgent = `I need a room tonight! It's urgent!`;
      const normal = `I'd like to book a room for next month.`;

      const urgentResult = detectBookingIntent(urgent);
      const normalResult = detectBookingIntent(normal);

      expect(urgentResult.urgency).toBe('high');
      expect(['low', 'medium']).toContain(normalResult.urgency);
    });

    it('should identify ready to book status', () => {
      const ready = `Yes, I'd like to book that deluxe room for December 15th. Please proceed.`;
      const notReady = `What are your rates for next month?`;

      const readyResult = detectBookingIntent(ready);
      const notReadyResult = detectBookingIntent(notReady);

      expect(readyResult.readyToBook).toBe(true);
      expect(notReadyResult.readyToBook).toBe(false);
    });
  });

  describe('profileSpeaker', () => {
    it('should identify guest speakers', () => {
      const transcription = `I want to check in. I'm staying in room 305. I need help with my luggage.`;

      const profile = profileSpeaker(transcription);

      expect(profile.type).toBe('guest');
      expect(profile.confidence).toBeGreaterThan(50);
    });

    it('should identify staff speakers', () => {
      const transcription = `How may I help you today? Certainly, I'll be happy to assist.
        Let me check our policy and management will approve that.`;

      const profile = profileSpeaker(transcription);

      expect(profile.type).toBe('staff');
      expect(profile.confidence).toBeGreaterThan(50);
    });

    it('should detect language', () => {
      const english = `The room is very nice and the staff is helpful.`;

      const profile = profileSpeaker(english);

      expect(profile.language).toBe('english');
    });

    it('should estimate speaking rate', () => {
      const fast = `word `.repeat(130).trim(); // Many words
      const slow = `word word word`; // Few words

      const fastProfile = profileSpeaker(fast);
      const slowProfile = profileSpeaker(slow);

      expect(fastProfile.speaking_rate).toBe('fast');
      expect(slowProfile.speaking_rate).toBe('slow');
    });

    it('should assess formality level', () => {
      const formal = `Certainly, I absolutely appreciate your kindness. Please allow me to apologize.`;
      const informal = `Yeah, gonna check that out. Wanna see if it's available.`;

      const formalProfile = profileSpeaker(formal);
      const informalProfile = profileSpeaker(informal);

      expect(formalProfile.formality).toBeGreaterThan(informalProfile.formality);
    });

    it('should detect emotional state', () => {
      const calm = `Thank you for your help. I understand and appreciate it.`;
      const stressed = `I need this urgently! Please hurry, I need it now!`;
      const upset = `This is unacceptable! I'm very disappointed and angry!`;
      const happy = `This is wonderful! I love it! Excellent service!`;

      const calmProfile = profileSpeaker(calm);
      const stressedProfile = profileSpeaker(stressed);
      const upsetProfile = profileSpeaker(upset);
      const happyProfile = profileSpeaker(happy);

      expect(calmProfile.emotionalState).toBe('calm');
      expect(stressedProfile.emotionalState).toBe('stressed');
      expect(upsetProfile.emotionalState).toBe('upset');
      expect(happyProfile.emotionalState).toBe('happy');
    });
  });

  describe('extractKeyPhrases', () => {
    it('should extract booking-related phrases', () => {
      const transcription = `I'd like to make a reservation and check availability for your room rates.`;

      const phrases = extractKeyPhrases(transcription);

      expect(phrases.some(p => p.category === 'booking')).toBe(true);
      expect(phrases.length).toBeGreaterThan(0);
    });

    it('should extract complaint-related phrases', () => {
      const transcription = `I'm not satisfied with this. I need to speak to the manager and file a complaint.`;

      const phrases = extractKeyPhrases(transcription);

      expect(phrases.some(p => p.category === 'complaint')).toBe(true);
    });

    it('should rank phrases by importance', () => {
      const transcription = `I want to file a complaint about room service.`;

      const phrases = extractKeyPhrases(transcription);

      if (phrases.length >= 2) {
        // First phrase should have higher or equal importance than last
        expect(phrases[0].importance).toBeGreaterThanOrEqual(phrases[phrases.length - 1].importance);
      }
    });

    it('should track phrase frequency', () => {
      const transcription = `Check in, check in, check in. I need to check in.`;

      const phrases = extractKeyPhrases(transcription);

      const checkInPhrase = phrases.find(p => p.phrase === 'check in');
      if (checkInPhrase) {
        expect(checkInPhrase.frequency).toBeGreaterThan(1);
      }
    });

    it('should extract service and amenity phrases', () => {
      const transcription = `Can I get room service? I'd like to use the swimming pool and wifi.`;

      const phrases = extractKeyPhrases(transcription);

      const categories = phrases.map(p => p.category);
      expect(categories).toEqual(expect.arrayContaining(['service']));
    });
  });

  describe('assessCallQuality', () => {
    it('should assess call quality metrics', () => {
      const input: SpeechInput = {
        callId: 'call-001',
        timestamp: new Date(),
        transcription: 'Sample call transcription',
        duration: 180,
        audioQuality: 85,
        backgroundNoise: 20,
        speakerCount: 2,
      };

      const quality = assessCallQuality(input);

      expect(quality.audioQuality).toBe(85);
      expect(quality.clarity).toBeGreaterThan(0);
      expect(quality.clarity).toBeLessThanOrEqual(100);
      expect(quality.overallQuality).toBeTruthy();
    });

    it('should detect excellent quality', () => {
      const input: SpeechInput = {
        callId: 'call-002',
        timestamp: new Date(),
        transcription: 'High quality call',
        duration: 300,
        audioQuality: 95,
        backgroundNoise: 5,
        speakerCount: 2,
      };

      const quality = assessCallQuality(input);

      expect(quality.overallQuality).toBe('excellent');
    });

    it('should detect poor quality', () => {
      const input: SpeechInput = {
        callId: 'call-003',
        timestamp: new Date(),
        transcription: 'Poor quality call',
        duration: 120,
        audioQuality: 30,
        backgroundNoise: 80,
        speakerCount: 3,
      };

      const quality = assessCallQuality(input);

      expect(['poor', 'fair']).toContain(quality.overallQuality);
      expect(quality.technicalIssues.length).toBeGreaterThan(0);
    });

    it('should identify technical issues', () => {
      const input: SpeechInput = {
        callId: 'call-004',
        timestamp: new Date(),
        transcription: 'Call with issues',
        duration: 20, // Very short
        audioQuality: 40, // Low quality
        backgroundNoise: 70, // High noise
        speakerCount: 4,
      };

      const quality = assessCallQuality(input);

      expect(quality.technicalIssues.length).toBeGreaterThan(0);
      expect(quality.technicalIssues.some(i => i.includes('audio quality'))).toBe(true);
    });

    it('should handle missing optional parameters', () => {
      const input: SpeechInput = {
        callId: 'call-005',
        timestamp: new Date(),
        transcription: 'Basic call',
        duration: 180,
      };

      const quality = assessCallQuality(input);

      expect(quality.audioQuality).toBe(75); // Default
      expect(quality.backgroundNoise).toBe(20); // Default
    });
  });

  describe('analyzeCall', () => {
    it('should perform comprehensive call analysis', () => {
      const input: SpeechInput = {
        callId: 'call-001',
        timestamp: new Date('2025-01-22T10:00:00'),
        transcription: `I want to make a reservation for next Friday.
          Do you have a deluxe suite available? I'll need it for 2 people.`,
        duration: 120,
        audioQuality: 80,
        backgroundNoise: 25,
        speakerCount: 2,
      };

      const analysis = analyzeCall(input);

      expect(analysis.callId).toBe('call-001');
      expect(analysis.sentiment).toBeDefined();
      expect(analysis.bookingIntent).toBeDefined();
      expect(analysis.bookingIntent?.isBookingInquiry).toBe(true);
      expect(analysis.speakers.length).toBeGreaterThan(0);
      expect(analysis.keyPhrases.length).toBeGreaterThan(0);
      expect(analysis.callQuality).toBeDefined();
      expect(analysis.summary).toBeTruthy();
    });

    it('should detect complaints in call analysis', () => {
      const input: SpeechInput = {
        callId: 'call-002',
        timestamp: new Date(),
        transcription: `This is terrible! The room is dirty and disgusting.
          I want to speak to the manager immediately!`,
        duration: 90,
        audioQuality: 75,
      };

      const analysis = analyzeCall(input);

      expect(analysis.complaint).toBeDefined();
      expect(analysis.complaint?.isComplaint).toBe(true);
      expect(analysis.sentiment.overall).toBe('negative');
    });

    it('should generate action items', () => {
      const input: SpeechInput = {
        callId: 'call-003',
        timestamp: new Date(),
        transcription: `I have an urgent complaint. The room is dirty and this is unacceptable!`,
        duration: 60,
      };

      const analysis = analyzeCall(input);

      expect(analysis.actionItems.length).toBeGreaterThan(0);
      expect(analysis.actionItems.some(item => item.includes('URGENT') || item.includes('Escalate'))).toBe(true);
    });

    it('should identify multiple speakers', () => {
      const input: SpeechInput = {
        callId: 'call-004',
        timestamp: new Date(),
        transcription: `Guest: I need to check in. Staff: Certainly, how may I help you?`,
        duration: 180,
        speakerCount: 2,
      };

      const analysis = analyzeCall(input);

      expect(analysis.speakers.length).toBe(2);
    });

    it('should generate call summary', () => {
      const input: SpeechInput = {
        callId: 'call-005',
        timestamp: new Date(),
        transcription: `I'd like to book a room for next week. What are your rates?`,
        duration: 150,
      };

      const analysis = analyzeCall(input);

      expect(analysis.summary).toBeTruthy();
      expect(analysis.summary).toContain('booking');
    });
  });

  describe('analyzeSpeechTrends', () => {
    const createMockCall = (
      id: string,
      sentiment: 'positive' | 'neutral' | 'negative',
      hasComplaint: boolean,
      hasBooking: boolean,
      quality: 'excellent' | 'good' | 'fair' | 'poor'
    ): CallAnalysis => ({
      callId: id,
      timestamp: new Date(),
      duration: 120,
      sentiment: {
        overall: sentiment,
        confidence: 75,
        emotionalTone: [],
        intensity: 50,
        keywords: [],
      },
      complaint: hasComplaint ? {
        isComplaint: true,
        confidence: 80,
        category: 'service',
        severity: 'medium',
        detectedIssues: ['Staff behavior'],
        requiresEscalation: false,
      } : undefined,
      bookingIntent: hasBooking ? {
        isBookingInquiry: true,
        confidence: 85,
        intentType: 'new-booking',
        urgency: 'medium',
        readyToBook: true,
      } : undefined,
      speakers: [{
        type: 'guest',
        confidence: 80,
        language: 'english',
        speaking_rate: 'normal',
        formality: 60,
        emotionalState: 'calm',
      }],
      keyPhrases: [],
      callQuality: {
        audioQuality: 80,
        clarity: 75,
        backgroundNoise: 20,
        speakerSeparation: 85,
        overallQuality: quality,
        technicalIssues: [],
      },
      actionItems: [],
      summary: 'Sample call',
    });

    it('should analyze trends from multiple calls', () => {
      const calls = [
        createMockCall('call-001', 'positive', false, false, 'excellent'),
        createMockCall('call-002', 'neutral', false, true, 'good'),
        createMockCall('call-003', 'negative', true, false, 'fair'),
      ];

      const trends = analyzeSpeechTrends(calls);

      expect(trends.totalCalls).toBe(3);
      expect(trends.averageDuration).toBe(120);
      expect(trends.sentimentDistribution.positive).toBeGreaterThan(0);
      expect(trends.complaintRate).toBeGreaterThan(0);
    });

    it('should calculate sentiment distribution', () => {
      const calls = [
        createMockCall('call-001', 'positive', false, false, 'excellent'),
        createMockCall('call-002', 'positive', false, false, 'excellent'),
        createMockCall('call-003', 'neutral', false, false, 'good'),
        createMockCall('call-004', 'negative', true, false, 'fair'),
      ];

      const trends = analyzeSpeechTrends(calls);

      expect(trends.sentimentDistribution.positive).toBe(50); // 2/4 = 50%
      expect(trends.sentimentDistribution.neutral).toBe(25); // 1/4 = 25%
      expect(trends.sentimentDistribution.negative).toBe(25); // 1/4 = 25%
    });

    it('should calculate complaint rate', () => {
      const calls = [
        createMockCall('call-001', 'positive', false, false, 'excellent'),
        createMockCall('call-002', 'negative', true, false, 'good'),
        createMockCall('call-003', 'neutral', false, false, 'good'),
        createMockCall('call-004', 'negative', true, false, 'fair'),
      ];

      const trends = analyzeSpeechTrends(calls);

      expect(trends.complaintRate).toBe(50); // 2/4 = 50%
    });

    it('should calculate booking conversion rate', () => {
      const calls = [
        createMockCall('call-001', 'positive', false, true, 'excellent'), // Booking inquiry, ready
        createMockCall('call-002', 'neutral', false, false, 'good'), // Not a booking
        createMockCall('call-003', 'positive', false, true, 'good'), // Booking inquiry, ready
      ];

      const trends = analyzeSpeechTrends(calls);

      expect(trends.bookingConversionRate).toBe(100); // 2/2 booking inquiries were ready
    });

    it('should identify improving trends', () => {
      const calls = [
        // First half - more negative
        createMockCall('call-001', 'negative', true, false, 'fair'),
        createMockCall('call-002', 'neutral', false, false, 'fair'),
        // Second half - more positive
        createMockCall('call-003', 'positive', false, false, 'excellent'),
        createMockCall('call-004', 'positive', false, true, 'excellent'),
      ];

      const trends = analyzeSpeechTrends(calls);

      expect(trends.trendAnalysis.improving).toBe(true);
      expect(trends.trendAnalysis.prediction).toContain('upward');
    });

    it('should identify declining trends', () => {
      const calls = [
        // First half - more positive
        createMockCall('call-001', 'positive', false, true, 'excellent'),
        createMockCall('call-002', 'positive', false, false, 'excellent'),
        // Second half - more negative
        createMockCall('call-003', 'negative', true, false, 'fair'),
        createMockCall('call-004', 'neutral', false, false, 'fair'),
      ];

      const trends = analyzeSpeechTrends(calls);

      expect(trends.trendAnalysis.improving).toBe(false);
      expect(trends.trendAnalysis.prediction).toContain('declining');
    });

    it('should calculate average call quality', () => {
      const calls = [
        createMockCall('call-001', 'positive', false, false, 'excellent'),
        createMockCall('call-002', 'neutral', false, false, 'good'),
        createMockCall('call-003', 'negative', false, false, 'fair'),
        createMockCall('call-004', 'positive', false, false, 'poor'),
      ];

      const trends = analyzeSpeechTrends(calls);

      expect(trends.averageCallQuality).toBeGreaterThan(0);
      expect(trends.averageCallQuality).toBeLessThanOrEqual(100);
    });

    it('should throw error with no calls', () => {
      expect(() => analyzeSpeechTrends([])).toThrow('At least one call is required');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete customer service workflow', () => {
      const input: SpeechInput = {
        callId: 'call-integration-001',
        timestamp: new Date('2025-01-22T14:30:00'),
        transcription: `Hello, I'm calling about my reservation. I made a booking for next Friday
          but I need to change it to Saturday. The room is a deluxe suite for 2 guests.
          Can you help me with that? Also, I wanted to know about your breakfast options.`,
        duration: 180,
        audioQuality: 85,
        backgroundNoise: 15,
        speakerCount: 2,
      };

      const analysis = analyzeCall(input);

      // Should detect positive/neutral sentiment
      expect(['positive', 'neutral']).toContain(analysis.sentiment.overall);

      // Should detect booking intent
      expect(analysis.bookingIntent).toBeDefined();
      expect(analysis.bookingIntent?.intentType).toBe('modification');

      // Should not be a complaint
      expect(analysis.complaint).toBeUndefined();

      // Should have good call quality
      expect(['excellent', 'good']).toContain(analysis.callQuality.overallQuality);

      // Should have actionable items
      expect(analysis.actionItems.length).toBeGreaterThan(0);
    });

    it('should handle escalated complaint workflow', () => {
      const input: SpeechInput = {
        callId: 'call-integration-002',
        timestamp: new Date('2025-01-22T16:00:00'),
        transcription: `This is absolutely unacceptable! The room is disgusting and dirty.
          There's a broken air conditioner and it's too hot. The staff has been very rude.
          I need to speak to a manager immediately! This is urgent!`,
        duration: 90,
        audioQuality: 70,
        backgroundNoise: 40,
        speakerCount: 1,
      };

      const analysis = analyzeCall(input);

      // Should detect negative sentiment
      expect(analysis.sentiment.overall).toBe('negative');
      expect(analysis.sentiment.intensity).toBeGreaterThan(60);

      // Should classify as complaint
      expect(analysis.complaint).toBeDefined();
      expect(analysis.complaint?.isComplaint).toBe(true);
      expect(['high', 'critical']).toContain(analysis.complaint?.severity);

      // Should require escalation
      expect(analysis.complaint?.requiresEscalation).toBe(true);

      // Should have urgent action items
      expect(analysis.actionItems.some(item =>
        item.includes('URGENT') || item.includes('Escalate')
      )).toBe(true);
    });

    it('should handle multi-call trend analysis', () => {
      const calls: CallAnalysis[] = [];

      // Simulate 10 calls with varying characteristics
      for (let i = 0; i < 10; i++) {
        const input: SpeechInput = {
          callId: `call-${i}`,
          timestamp: new Date(),
          transcription: i < 5 ?
            'The service is poor and I\'m disappointed' :
            'Great service! Thank you so much, very happy',
          duration: 120 + i * 10,
          audioQuality: 70 + i * 2,
        };

        calls.push(analyzeCall(input));
      }

      const trends = analyzeSpeechTrends(calls);

      expect(trends.totalCalls).toBe(10);
      expect(trends.trendAnalysis.improving).toBe(true);
      expect(trends.sentimentDistribution.positive).toBeGreaterThan(0);
      expect(trends.sentimentDistribution.negative).toBeGreaterThan(0);
    });
  });
});

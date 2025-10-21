import { classifyComplaintKeyword } from '../classifier';
import type { Complaint } from '../classifier';

describe('Complaint Classification', () => {
  describe('Category Classification', () => {
    it('should classify cleanliness complaints', () => {
      const complaint: Complaint = {
        id: 'c1',
        guestName: 'John Doe',
        text: 'The room was dirty and the bathroom had mold',
        timestamp: new Date(),
      };

      const result = classifyComplaintKeyword(complaint);

      expect(result.category).toBe('cleanliness');
      expect(result.department).toBe('housekeeping');
    });

    it('should classify noise complaints', () => {
      const complaint: Complaint = {
        id: 'c2',
        guestName: 'Jane Smith',
        text: 'Extremely loud noise from construction at 6 AM',
        timestamp: new Date(),
      };

      const result = classifyComplaintKeyword(complaint);

      expect(result.category).toBe('noise');
      expect(result.department).toBe('front-desk');
    });

    it('should classify service complaints', () => {
      const complaint: Complaint = {
        id: 'c3',
        guestName: 'Bob Johnson',
        text: 'Staff was rude and unhelpful at check-in',
        timestamp: new Date(),
      };

      const result = classifyComplaintKeyword(complaint);

      expect(result.category).toBe('service');
      expect(result.department).toBe('management');
    });

    it('should classify maintenance complaints', () => {
      const complaint: Complaint = {
        id: 'c4',
        guestName: 'Alice Brown',
        text: 'Air conditioning not working and toilet is broken',
        timestamp: new Date(),
      };

      const result = classifyComplaintKeyword(complaint);

      expect(result.category).toBe('maintenance');
      expect(result.department).toBe('maintenance');
    });

    it('should classify amenity complaints', () => {
      const complaint: Complaint = {
        id: 'c5',
        guestName: 'Charlie Davis',
        text: 'WiFi is not working and pool is closed',
        timestamp: new Date(),
      };

      const result = classifyComplaintKeyword(complaint);

      expect(result.category).toBe('amenities');
    });
  });

  describe('Urgency Classification', () => {
    it('should mark critical urgency for safety issues', () => {
      const complaint: Complaint = {
        id: 'c6',
        guestName: 'Test',
        text: 'Urgent: Fire alarm broken and emergency exit blocked',
        timestamp: new Date(),
      };

      const result = classifyComplaintKeyword(complaint);

      expect(result.urgency).toBe('critical');
    });

    it('should mark high urgency for immediate needs', () => {
      const complaint: Complaint = {
        id: 'c7',
        guestName: 'Test',
        text: 'No hot water in the shower immediately',
        timestamp: new Date(),
      };

      const result = classifyComplaintKeyword(complaint);

      expect(['critical', 'high']).toContain(result.urgency);
    });

    it('should mark medium urgency for moderate issues', () => {
      const complaint: Complaint = {
        id: 'c8',
        guestName: 'Test',
        text: 'TV remote is not working properly',
        timestamp: new Date(),
      };

      const result = classifyComplaintKeyword(complaint);

      expect(['medium', 'low']).toContain(result.urgency);
    });

    it('should mark low urgency for minor issues', () => {
      const complaint: Complaint = {
        id: 'c9',
        guestName: 'Test',
        text: 'Would like extra pillows when convenient',
        timestamp: new Date(),
      };

      const result = classifyComplaintKeyword(complaint);

      expect(['low', 'medium']).toContain(result.urgency);
    });
  });

  describe('Department Routing', () => {
    it('should route cleanliness to housekeeping', () => {
      const complaint: Complaint = {
        id: 'test',
        guestName: 'Test',
        text: 'Room needs cleaning',
        timestamp: new Date(),
      };

      const result = classifyComplaintKeyword(complaint);

      expect(result.department).toBe('housekeeping');
    });

    it('should route service to management', () => {
      const complaint: Complaint = {
        id: 'test',
        guestName: 'Test',
        text: 'Staff was rude',
        timestamp: new Date(),
      };

      const result = classifyComplaintKeyword(complaint);

      expect(result.department).toBe('management');
    });

    it('should route maintenance to maintenance department', () => {
      const complaint: Complaint = {
        id: 'test',
        guestName: 'Test',
        text: 'Plumbing issue in bathroom',
        timestamp: new Date(),
      };

      const result = classifyComplaintKeyword(complaint);

      expect(result.department).toBe('maintenance');
    });

    it('should route general complaints to front-desk', () => {
      const complaint: Complaint = {
        id: 'test',
        guestName: 'Test',
        text: 'Not happy with the stay',
        timestamp: new Date(),
      };

      const result = classifyComplaintKeyword(complaint);

      expect(result.department).toBe('front-desk');
    });
  });

  describe('Sentiment Analysis', () => {
    it('should detect negative sentiment', () => {
      const complaint: Complaint = {
        id: 'test',
        guestName: 'Test',
        text: 'Terrible experience, worst hotel ever',
        timestamp: new Date(),
      };

      const result = classifyComplaintKeyword(complaint);

      expect(result.sentiment).toBe('negative');
    });

    it('should detect mixed sentiment', () => {
      const complaint: Complaint = {
        id: 'test',
        guestName: 'Test',
        text: 'Room was nice but staff was unhelpful',
        timestamp: new Date(),
      };

      const result = classifyComplaintKeyword(complaint);

      expect(['mixed', 'negative']).toContain(result.sentiment);
    });
  });

  describe('Response Time', () => {
    it('should suggest faster response for critical', () => {
      const critical: Complaint = {
        id: 'test',
        guestName: 'Test',
        text: 'Emergency: safety issue',
        timestamp: new Date(),
      };

      const low: Complaint = {
        id: 'test2',
        guestName: 'Test',
        text: 'Minor issue with pillow',
        timestamp: new Date(),
      };

      const criticalResult = classifyComplaintKeyword(critical);
      const lowResult = classifyComplaintKeyword(low);

      expect(criticalResult.suggestedResponseTime).toBeLessThan(lowResult.suggestedResponseTime);
    });
  });

  describe('Confidence Scoring', () => {
    it('should provide confidence score', () => {
      const complaint: Complaint = {
        id: 'test',
        guestName: 'Test',
        text: 'Room is dirty',
        timestamp: new Date(),
      };

      const result = classifyComplaintKeyword(complaint);

      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should have higher confidence for clear complaints', () => {
      const clear: Complaint = {
        id: 'test',
        guestName: 'Test',
        text: 'Air conditioning broken, room is dirty, staff rude',
        timestamp: new Date(),
      };

      const vague: Complaint = {
        id: 'test2',
        guestName: 'Test',
        text: 'Not satisfied',
        timestamp: new Date(),
      };

      const clearResult = classifyComplaintKeyword(clear);
      const vagueResult = classifyComplaintKeyword(vague);

      expect(clearResult.confidence).toBeGreaterThan(vagueResult.confidence);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty complaint text', () => {
      const complaint: Complaint = {
        id: 'test',
        guestName: 'Test',
        text: '',
        timestamp: new Date(),
      };

      const result = classifyComplaintKeyword(complaint);

      expect(result).toBeDefined();
      expect(result.category).toBe('general');
    });

    it('should handle very long complaints', () => {
      const longText = 'This is a very long complaint. '.repeat(100);
      const complaint: Complaint = {
        id: 'test',
        guestName: 'Test',
        text: longText,
        timestamp: new Date(),
      };

      const result = classifyComplaintKeyword(complaint);

      expect(result).toBeDefined();
    });

    it('should handle multiple categories in one complaint', () => {
      const complaint: Complaint = {
        id: 'test',
        guestName: 'Test',
        text: 'Room is dirty, wifi not working, and staff was rude',
        timestamp: new Date(),
      };

      const result = classifyComplaintKeyword(complaint);

      expect(result.category).toBeTruthy();
      expect(result.department).toBeTruthy();
    });
  });
});

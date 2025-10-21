/**
 * Guest Complaint Classification & Routing
 */

export interface Complaint {
  id: string;
  guestName: string;
  text: string;
  timestamp: Date;
}

export interface ComplaintClassification {
  id: string;
  category: 'room' | 'service' | 'noise' | 'cleanliness' | 'amenity' | 'billing';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  sentiment: 'frustrated' | 'angry' | 'disappointed' | 'neutral';
  department: 'housekeeping' | 'front-desk' | 'maintenance' | 'management';
  confidence: number;
  method: 'keyword' | 'ml' | 'llm';
  processingTime?: number;
}

export function classifyComplaintKeyword(complaint: Complaint): ComplaintClassification {
  const startTime = Date.now();
  const text = complaint.text.toLowerCase();

  // Keyword-based classification
  let category: ComplaintClassification['category'] = 'service';
  let urgency: ComplaintClassification['urgency'] = 'medium';
  let department: ComplaintClassification['department'] = 'front-desk';

  if (text.includes('room') || text.includes('bed')) {
    category = 'room';
    department = 'housekeeping';
  }
  if (text.includes('dirty') || text.includes('clean')) {
    category = 'cleanliness';
    department = 'housekeeping';
    urgency = 'high';
  }
  if (text.includes('noise') || text.includes('loud')) {
    category = 'noise';
    urgency = 'high';
  }
  if (text.includes('broken') || text.includes('not working')) {
    category = 'amenity';
    department = 'maintenance';
    urgency = 'high';
  }
  if (text.includes('urgent') || text.includes('immediate')) {
    urgency = 'critical';
  }

  const sentiment: ComplaintClassification['sentiment'] =
    text.includes('terrible') || text.includes('worst') ? 'angry' :
    text.includes('disappointed') ? 'disappointed' :
    text.includes('frustrated') ? 'frustrated' : 'neutral';

  return {
    id: complaint.id,
    category,
    urgency,
    sentiment,
    department,
    confidence: 0.71,
    method: 'keyword',
    processingTime: Date.now() - startTime,
  };
}

export const COMPLAINT_MODELS = {
  'keyword': { name: 'Keyword-Based', cost: 0, avgLatency: 3, accuracy: 0.71, description: 'Rule-based categorization' },
  'ml': { name: 'Text Classification', cost: 0, avgLatency: 25, accuracy: 0.84, description: 'Local ML model' },
  'llm': { name: 'LLM Analysis', cost: 0.01, avgLatency: 400, accuracy: 0.94, description: 'Deep understanding' },
};

/**
 * AI Assistant Types
 * Natural language interface for hotel operations
 */

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  actions?: QuickAction[];
  visualization?: Visualization;
  metadata?: Record<string, any>;
}

export interface QuickAction {
  id: string;
  label: string;
  icon?: string;
  action: string; // Action identifier
  params?: Record<string, any>;
  primary?: boolean;
}

export interface Visualization {
  type: 'chart' | 'table' | 'timeline' | 'card' | 'list';
  data: any;
  config?: Record<string, any>;
}

export interface QueryIntent {
  type: 'forecast' | 'pricing' | 'noshow' | 'segmentation' | 'sentiment' | 'operations' | 'general';
  confidence: number;
  entities?: Record<string, any>;
  timeframe?: {
    start?: Date;
    end?: Date;
  };
  params?: Record<string, any>;
}

export interface AssistantResponse {
  message: Message;
  intent: QueryIntent;
  processingTime: number;
  suggestions?: string[]; // Follow-up question suggestions
}

export interface ConversationContext {
  messages: Message[];
  currentIntent?: QueryIntent;
  hotelContext?: {
    propertyName?: string;
    roomCount?: number;
    currentOccupancy?: number;
    avgRate?: number;
  };
}

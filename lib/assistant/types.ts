/**
 * AI Assistant Types
 * Natural language interface for hotel operations
 */

// Visualization data types
export type ChartData = Array<{ label: string; value: number; [key: string]: unknown }>;
export type TableData = Array<Record<string, unknown>>;
export type TimelineData = Array<{ date: Date; event: string; [key: string]: unknown }>;
export type CardData = Record<string, unknown>;
export type ListData = Array<string | Record<string, unknown>>;
export type VisualizationData = ChartData | TableData | TimelineData | CardData | ListData;

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  actions?: QuickAction[];
  visualization?: Visualization;
  metadata?: Record<string, unknown>;
}

export interface QuickAction {
  id: string;
  label: string;
  icon?: string;
  action: string; // Action identifier
  params?: Record<string, unknown>;
  primary?: boolean;
}

export interface Visualization {
  type: 'chart' | 'table' | 'timeline' | 'card' | 'list';
  data: VisualizationData;
  config?: Record<string, unknown>;
}

export interface QueryIntent {
  type: 'forecast' | 'pricing' | 'noshow' | 'segmentation' | 'sentiment' | 'operations' | 'general';
  confidence: number;
  entities?: Record<string, unknown>;
  timeframe?: {
    start?: Date;
    end?: Date;
  };
  params?: Record<string, unknown>;
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

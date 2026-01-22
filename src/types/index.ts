// Branded types for type-safe IDs
declare const __brand: unique symbol;
type Brand<B> = { [__brand]: B };
export type Branded<T, B> = T & Brand<B>;

export type CaptureId = Branded<string, 'CaptureId'>;
export type CategoryId = Branded<string, 'CategoryId'>;

// Input types
export type InputType = 'text' | 'voice' | 'image';

// Processing status
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Fixed categories (5 total) - matches plan
export type CaptureCategory = 'task' | 'idea' | 'shopping' | 'reminder' | 'note';

// Sync targets for direct API push
export type SyncTarget = 'todoist' | 'reminders' | 'claude' | 'chatgpt';

// Processing tier (2-tier system: Regex + Llama)
export type ProcessingTier = 1 | 2;

// Base capture interface
interface CaptureBase {
  id: CaptureId;
  rawText: string;
  createdAt: number;
  processedAt: number | null;
  status: ProcessingStatus;
  categoryId: CategoryId | null;
  extractedTitle: string | null;
  extractedDueDate: number | null;
  extractedPriority: 'high' | 'medium' | 'low' | null;
  isSynced: boolean;
  syncedAt: number | null;
}

// Discriminated union for captures - enforces media requirements
export interface TextCapture extends CaptureBase {
  inputType: 'text';
  imageUri?: never;
  audioUri?: never;
}

export interface VoiceCapture extends CaptureBase {
  inputType: 'voice';
  audioUri: string; // REQUIRED for voice
  imageUri?: never;
}

export interface ImageCapture extends CaptureBase {
  inputType: 'image';
  imageUri: string; // REQUIRED for image
  audioUri?: never;
}

export type Capture = TextCapture | VoiceCapture | ImageCapture;

// Category
export interface Category {
  id: CategoryId;
  name: string;
  emoji: string;
  color: string;
  sortOrder: number;
}

// Settings
export interface Settings {
  theme: 'light' | 'dark' | 'system';
  hapticFeedback: boolean;
  autoOpenKeyboard: boolean;
  defaultCategory: CategoryId | null;
}

// Filter state for Smart List
export interface FilterState {
  categories: CategoryId[];
  statuses: ProcessingStatus[];
  dateRange: {
    start: number | null;
    end: number | null;
  };
  searchQuery: string;
}

// Queue item for Fire and Forget processing
export interface QueueItem {
  captureId: CaptureId;
  priority: number;
  retryCount: number;
  lastAttempt: number | null;
}

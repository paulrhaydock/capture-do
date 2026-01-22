import { create } from 'zustand';
import type { Capture, CaptureId, Category, CategoryId, FilterState, QueueItem, Settings } from '../types';
import * as db from '../db';

interface CaptureState {
  // Data
  captures: Capture[];
  categories: Category[];
  settings: Settings;

  // Processing queue
  queue: QueueItem[];
  isProcessing: boolean;

  // UI state
  filter: FilterState;
  isListModalOpen: boolean;
  isSettingsModalOpen: boolean;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  addCapture: (rawText: string, inputType: 'text' | 'voice' | 'image', mediaUri?: string) => Promise<CaptureId>;
  deleteCapture: (id: CaptureId) => Promise<void>;
  processQueue: () => Promise<void>;
  setFilter: (filter: Partial<FilterState>) => void;
  clearFilter: () => void;
  toggleListModal: () => void;
  toggleSettingsModal: () => void;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => Promise<void>;
  refreshCaptures: () => Promise<void>;
}

const initialFilter: FilterState = {
  categories: [],
  statuses: [],
  dateRange: { start: null, end: null },
  searchQuery: '',
};

export const useCaptureStore = create<CaptureState>((set, get) => ({
  // Initial state
  captures: [],
  categories: [],
  settings: {
    theme: 'system',
    hapticFeedback: true,
    autoOpenKeyboard: true,
    defaultCategory: null,
  },
  queue: [],
  isProcessing: false,
  filter: initialFilter,
  isListModalOpen: false,
  isSettingsModalOpen: false,
  isInitialized: false,

  // Initialize - load data from database
  initialize: async () => {
    try {
      const [categories, settings, captures] = await Promise.all([
        db.getAllCategories(),
        db.getAllSettings(),
        db.getAllCaptures({ limit: 100 }),
      ]);

      // Find pending captures for queue
      const pendingCaptures = captures.filter((c) => c.status === 'pending');
      const queue: QueueItem[] = pendingCaptures.map((c) => ({
        captureId: c.id,
        priority: 0,
        retryCount: 0,
        lastAttempt: null,
      }));

      set({
        categories,
        settings,
        captures,
        queue,
        isInitialized: true,
      });

      // Start processing queue if there are items
      if (queue.length > 0) {
        get().processQueue();
      }
    } catch (error) {
      console.error('Failed to initialize store:', error);
    }
  },

  // Add capture - Fire and Forget pattern
  addCapture: async (rawText, inputType, mediaUri) => {
    const { settings } = get();

    // Create capture object based on input type
    const captureData = {
      rawText,
      inputType,
      createdAt: Date.now(),
      categoryId: settings.defaultCategory,
      ...(inputType === 'voice' && mediaUri ? { audioUri: mediaUri } : {}),
      ...(inputType === 'image' && mediaUri ? { imageUri: mediaUri } : {}),
    } as Parameters<typeof db.createCapture>[0];

    // Save to database immediately
    const id = await db.createCapture(captureData);

    // Get the full capture from database
    const capture = await db.getCapture(id);
    if (!capture) throw new Error('Failed to retrieve created capture');

    // Add to state
    set((state) => ({
      captures: [capture, ...state.captures],
      queue: [
        ...state.queue,
        { captureId: id, priority: 0, retryCount: 0, lastAttempt: null },
      ],
    }));

    // Trigger queue processing (non-blocking)
    setTimeout(() => get().processQueue(), 0);

    return id;
  },

  // Delete capture
  deleteCapture: async (id) => {
    await db.deleteCapture(id);
    set((state) => ({
      captures: state.captures.filter((c) => c.id !== id),
      queue: state.queue.filter((q) => q.captureId !== id),
    }));
  },

  // Process queue - handles background processing
  processQueue: async () => {
    const { queue, isProcessing } = get();

    if (isProcessing || queue.length === 0) return;

    set({ isProcessing: true });

    try {
      // Get next item from queue
      const item = queue[0];
      if (!item) {
        set({ isProcessing: false });
        return;
      }

      // Update status to processing
      await db.updateCaptureStatus(item.captureId, 'processing');

      // Update local state
      set((state) => ({
        captures: state.captures.map((c) =>
          c.id === item.captureId ? { ...c, status: 'processing' as const } : c
        ),
      }));

      // MVP: Simple regex-based processing
      const capture = get().captures.find((c) => c.id === item.captureId);
      if (capture) {
        const processed = processCapture(capture, get().categories);

        // Update database (convert null to undefined for optional fields)
        await db.updateCaptureStatus(item.captureId, 'completed', {
          extractedTitle: processed.title,
          extractedDueDate: processed.dueDate ?? undefined,
          extractedPriority: processed.priority ?? undefined,
          categoryId: processed.categoryId ?? undefined,
        });

        // Update local state
        set((state) => ({
          captures: state.captures.map((c) =>
            c.id === item.captureId
              ? {
                  ...c,
                  status: 'completed' as const,
                  processedAt: Date.now(),
                  extractedTitle: processed.title,
                  extractedDueDate: processed.dueDate,
                  extractedPriority: processed.priority,
                  categoryId: processed.categoryId,
                }
              : c
          ),
          queue: state.queue.slice(1), // Remove processed item
        }));
      }
    } catch (error) {
      console.error('Queue processing error:', error);
      // Mark as failed and move to next
      const item = queue[0];
      if (item) {
        await db.updateCaptureStatus(item.captureId, 'failed');
        set((state) => ({
          captures: state.captures.map((c) =>
            c.id === item.captureId ? { ...c, status: 'failed' as const } : c
          ),
          queue: state.queue.slice(1),
        }));
      }
    } finally {
      set({ isProcessing: false });

      // Continue processing if more items
      if (get().queue.length > 0) {
        setTimeout(() => get().processQueue(), 100);
      }
    }
  },

  // Filter actions
  setFilter: (filterUpdate) => {
    set((state) => ({
      filter: { ...state.filter, ...filterUpdate },
    }));
  },

  clearFilter: () => {
    set({ filter: initialFilter });
  },

  // Modal actions
  toggleListModal: () => {
    set((state) => ({ isListModalOpen: !state.isListModalOpen }));
  },

  toggleSettingsModal: () => {
    set((state) => ({ isSettingsModalOpen: !state.isSettingsModalOpen }));
  },

  // Settings
  updateSetting: async (key, value) => {
    await db.setSetting(key, String(value));
    set((state) => ({
      settings: { ...state.settings, [key]: value },
    }));
  },

  // Refresh captures from database
  refreshCaptures: async () => {
    const captures = await db.getAllCaptures({ limit: 100 });
    set({ captures });
  },
}));

// Simple regex-based processing for MVP
function processCapture(
  capture: Capture,
  categories: Category[]
): {
  title: string;
  dueDate: number | null;
  priority: 'high' | 'medium' | 'low' | null;
  categoryId: CategoryId | null;
} {
  const text = capture.rawText.toLowerCase();
  let title = capture.rawText.slice(0, 100); // First 100 chars as title
  let dueDate: number | null = null;
  let priority: 'high' | 'medium' | 'low' | null = null;
  let categoryId: CategoryId | null = capture.categoryId;

  // Priority detection
  if (text.includes('urgent') || text.includes('asap') || text.includes('!')) {
    priority = 'high';
  } else if (text.includes('important') || text.includes('soon')) {
    priority = 'medium';
  }

  // Simple date detection
  const todayMatch = text.match(/\b(today|tonight)\b/);
  const tomorrowMatch = text.match(/\btomorrow\b/);

  if (todayMatch) {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    dueDate = now.getTime();
  } else if (tomorrowMatch) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);
    dueDate = tomorrow.getTime();
  }

  // Category detection based on keywords
  if (!categoryId || categoryId === ('cat_inbox' as CategoryId)) {
    if (text.includes('todo') || text.includes('task') || text.includes('do ')) {
      categoryId = 'cat_tasks' as CategoryId;
    } else if (text.includes('idea') || text.includes('maybe') || text.includes('could')) {
      categoryId = 'cat_ideas' as CategoryId;
    } else if (text.includes('note') || text.includes('remember')) {
      categoryId = 'cat_notes' as CategoryId;
    } else if (text.includes('remind') || text.includes('don\'t forget')) {
      categoryId = 'cat_reminders' as CategoryId;
    }
  }

  // Clean up title - remove common prefixes
  title = title
    .replace(/^(todo:|task:|note:|idea:|remind me to|don't forget to)\s*/i, '')
    .trim();

  // Capitalize first letter
  if (title.length > 0) {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  return { title, dueDate, priority, categoryId };
}

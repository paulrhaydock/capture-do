// Database schema for CaptureDo MVP
// Simplified 3-table schema as per YAGNI recommendations

export const SCHEMA_VERSION = 1;

export const CREATE_TABLES_SQL = `
-- Categories table (5 fixed categories for MVP)
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  color TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Captures table (main data)
CREATE TABLE IF NOT EXISTS captures (
  id TEXT PRIMARY KEY NOT NULL,
  input_type TEXT NOT NULL CHECK (input_type IN ('text', 'voice', 'image')),
  raw_text TEXT NOT NULL,
  image_uri TEXT,
  audio_uri TEXT,
  created_at INTEGER NOT NULL,
  processed_at INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  category_id TEXT REFERENCES categories(id),
  extracted_title TEXT,
  extracted_due_date INTEGER,
  extracted_priority TEXT CHECK (extracted_priority IN ('high', 'medium', 'low')),
  is_synced INTEGER NOT NULL DEFAULT 0,
  synced_at INTEGER
);

-- Settings table (key-value store)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_captures_status ON captures(status);
CREATE INDEX IF NOT EXISTS idx_captures_created_at ON captures(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_captures_category_id ON captures(category_id);
`;

// Default categories (5 fixed for MVP) - matches plan: task, idea, shopping, reminder, note
export const DEFAULT_CATEGORIES = [
  { id: 'cat_task', name: 'Task', emoji: '✅', color: '#3B82F6', sortOrder: 0 },
  { id: 'cat_idea', name: 'Idea', emoji: '💡', color: '#8B5CF6', sortOrder: 1 },
  { id: 'cat_shopping', name: 'Shopping', emoji: '🛒', color: '#10B981', sortOrder: 2 },
  { id: 'cat_reminder', name: 'Reminder', emoji: '🔔', color: '#F59E0B', sortOrder: 3 },
  { id: 'cat_note', name: 'Note', emoji: '📝', color: '#6B7280', sortOrder: 4 },
];

// Default settings
export const DEFAULT_SETTINGS = {
  theme: 'system',
  hapticFeedback: 'true',
  autoOpenKeyboard: 'true',
  defaultCategory: 'cat_task',
};

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

// Default categories (5 fixed for MVP)
export const DEFAULT_CATEGORIES = [
  { id: 'cat_inbox', name: 'Inbox', emoji: '📥', color: '#6366f1', sortOrder: 0 },
  { id: 'cat_tasks', name: 'Tasks', emoji: '✅', color: '#22c55e', sortOrder: 1 },
  { id: 'cat_ideas', name: 'Ideas', emoji: '💡', color: '#eab308', sortOrder: 2 },
  { id: 'cat_notes', name: 'Notes', emoji: '📝', color: '#3b82f6', sortOrder: 3 },
  { id: 'cat_reminders', name: 'Reminders', emoji: '🔔', color: '#f97316', sortOrder: 4 },
];

// Default settings
export const DEFAULT_SETTINGS = {
  theme: 'system',
  hapticFeedback: 'true',
  autoOpenKeyboard: 'true',
  defaultCategory: 'cat_inbox',
};

import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL, DEFAULT_CATEGORIES, DEFAULT_SETTINGS, SCHEMA_VERSION } from './schema';
import type { Capture, CaptureId, Category, CategoryId, Settings, ProcessingStatus } from '../types';

const DB_NAME = 'capturedo.db';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await initializeDatabase(db);
  }
  return db;
}

async function initializeDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  // Check schema version
  const versionResult = await database.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  const currentVersion = versionResult?.user_version ?? 0;

  if (currentVersion < SCHEMA_VERSION) {
    // Create tables
    await database.execAsync(CREATE_TABLES_SQL);

    // Seed default categories
    for (const cat of DEFAULT_CATEGORIES) {
      await database.runAsync(
        `INSERT OR IGNORE INTO categories (id, name, emoji, color, sort_order) VALUES (?, ?, ?, ?, ?)`,
        [cat.id, cat.name, cat.emoji, cat.color, cat.sortOrder]
      );
    }

    // Seed default settings
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      await database.runAsync(
        `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`,
        [key, value]
      );
    }

    // Update schema version
    await database.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  }
}

// Capture operations
export async function createCapture(
  capture: Omit<Capture, 'id' | 'processedAt' | 'status' | 'extractedTitle' | 'extractedDueDate' | 'extractedPriority' | 'isSynced' | 'syncedAt'>
): Promise<CaptureId> {
  const database = await getDatabase();
  const id = `cap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` as CaptureId;

  await database.runAsync(
    `INSERT INTO captures (id, input_type, raw_text, image_uri, audio_uri, created_at, status, category_id)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
    [
      id,
      capture.inputType,
      capture.rawText,
      capture.inputType === 'image' ? (capture as { imageUri: string }).imageUri : null,
      capture.inputType === 'voice' ? (capture as { audioUri: string }).audioUri : null,
      capture.createdAt,
      capture.categoryId,
    ]
  );

  return id;
}

export async function getCapture(id: CaptureId): Promise<Capture | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<CaptureRow>(
    `SELECT * FROM captures WHERE id = ?`,
    [id]
  );
  return row ? mapRowToCapture(row) : null;
}

export async function getAllCaptures(options?: {
  categoryId?: CategoryId;
  status?: ProcessingStatus;
  limit?: number;
  offset?: number;
}): Promise<Capture[]> {
  const database = await getDatabase();

  let query = 'SELECT * FROM captures WHERE 1=1';
  const params: (string | number)[] = [];

  if (options?.categoryId) {
    query += ' AND category_id = ?';
    params.push(options.categoryId);
  }
  if (options?.status) {
    query += ' AND status = ?';
    params.push(options.status);
  }

  query += ' ORDER BY created_at DESC';

  if (options?.limit) {
    query += ' LIMIT ?';
    params.push(options.limit);
    if (options.offset) {
      query += ' OFFSET ?';
      params.push(options.offset);
    }
  }

  const rows = await database.getAllAsync<CaptureRow>(query, params);
  return rows.map(mapRowToCapture);
}

export async function updateCaptureStatus(
  id: CaptureId,
  status: ProcessingStatus,
  updates?: {
    extractedTitle?: string;
    extractedDueDate?: number;
    extractedPriority?: 'high' | 'medium' | 'low';
    categoryId?: CategoryId;
  }
): Promise<void> {
  const database = await getDatabase();

  let query = 'UPDATE captures SET status = ?, processed_at = ?';
  const params: (string | number | null)[] = [status, status === 'completed' ? Date.now() : null];

  if (updates?.extractedTitle !== undefined) {
    query += ', extracted_title = ?';
    params.push(updates.extractedTitle);
  }
  if (updates?.extractedDueDate !== undefined) {
    query += ', extracted_due_date = ?';
    params.push(updates.extractedDueDate);
  }
  if (updates?.extractedPriority !== undefined) {
    query += ', extracted_priority = ?';
    params.push(updates.extractedPriority);
  }
  if (updates?.categoryId !== undefined) {
    query += ', category_id = ?';
    params.push(updates.categoryId);
  }

  query += ' WHERE id = ?';
  params.push(id);

  await database.runAsync(query, params);
}

export async function deleteCapture(id: CaptureId): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM captures WHERE id = ?', [id]);
}

// Category operations
export async function getAllCategories(): Promise<Category[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<CategoryRow>(
    'SELECT * FROM categories ORDER BY sort_order'
  );
  return rows.map(mapRowToCategory);
}

// Settings operations
export async function getSetting(key: keyof Settings): Promise<string | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [key]
  );
  return row?.value ?? null;
}

export async function setSetting(key: keyof Settings, value: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    [key, value]
  );
}

export async function getAllSettings(): Promise<Settings> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{ key: string; value: string }>(
    'SELECT key, value FROM settings'
  );

  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }

  return {
    theme: (settings.theme as Settings['theme']) ?? 'system',
    hapticFeedback: settings.hapticFeedback === 'true',
    autoOpenKeyboard: settings.autoOpenKeyboard === 'true',
    defaultCategory: (settings.defaultCategory as CategoryId) ?? null,
  };
}

// Row types for database mapping
interface CaptureRow {
  id: string;
  input_type: string;
  raw_text: string;
  image_uri: string | null;
  audio_uri: string | null;
  created_at: number;
  processed_at: number | null;
  status: string;
  category_id: string | null;
  extracted_title: string | null;
  extracted_due_date: number | null;
  extracted_priority: string | null;
  is_synced: number;
  synced_at: number | null;
}

interface CategoryRow {
  id: string;
  name: string;
  emoji: string;
  color: string;
  sort_order: number;
}

function mapRowToCapture(row: CaptureRow): Capture {
  const base = {
    id: row.id as CaptureId,
    rawText: row.raw_text,
    createdAt: row.created_at,
    processedAt: row.processed_at,
    status: row.status as ProcessingStatus,
    categoryId: row.category_id as CategoryId | null,
    extractedTitle: row.extracted_title,
    extractedDueDate: row.extracted_due_date,
    extractedPriority: row.extracted_priority as 'high' | 'medium' | 'low' | null,
    isSynced: row.is_synced === 1,
    syncedAt: row.synced_at,
  };

  switch (row.input_type) {
    case 'voice':
      return { ...base, inputType: 'voice', audioUri: row.audio_uri! };
    case 'image':
      return { ...base, inputType: 'image', imageUri: row.image_uri! };
    default:
      return { ...base, inputType: 'text' };
  }
}

function mapRowToCategory(row: CategoryRow): Category {
  return {
    id: row.id as CategoryId,
    name: row.name,
    emoji: row.emoji,
    color: row.color,
    sortOrder: row.sort_order,
  };
}

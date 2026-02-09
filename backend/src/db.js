import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, '../database.sqlite'));
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  -- Users table (clients, salon owners, professionals)
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('client', 'salon', 'professional')) NOT NULL,
    avatar_url TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  -- Salons table
  CREATE TABLE IF NOT EXISTS salons (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    instagram TEXT,
    whatsapp TEXT,
    opening_hours TEXT DEFAULT '09:00',
    closing_hours TEXT DEFAULT '19:00',
    logo_url TEXT,
    cover_photo_url TEXT,
    bio TEXT,
    niche TEXT CHECK(niche IN ('barbershop', 'salon', 'manicure', 'aesthetics', 'makeup')) DEFAULT 'barbershop',
    average_rating REAL DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (owner_id) REFERENCES users(id)
  );

  -- Professionals table
  CREATE TABLE IF NOT EXISTS professionals (
    id TEXT PRIMARY KEY,
    salon_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    specialty TEXT,
    bio TEXT,
    photo_url TEXT,
    commission_percentage REAL DEFAULT 50,
    average_rating REAL DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (salon_id) REFERENCES salons(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- Professional schedules
  CREATE TABLE IF NOT EXISTS professional_schedules (
    id TEXT PRIMARY KEY,
    professional_id TEXT NOT NULL,
    day_of_week INTEGER CHECK(day_of_week BETWEEN 0 AND 6),
    start_time TEXT,
    end_time TEXT,
    is_working INTEGER DEFAULT 1,
    FOREIGN KEY (professional_id) REFERENCES professionals(id)
  );

  -- Professional days off
  CREATE TABLE IF NOT EXISTS professional_days_off (
    id TEXT PRIMARY KEY,
    professional_id TEXT NOT NULL,
    date_start TEXT NOT NULL,
    date_end TEXT NOT NULL,
    reason TEXT,
    FOREIGN KEY (professional_id) REFERENCES professionals(id)
  );

  -- Services table
  CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    salon_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL,
    price REAL NOT NULL,
    category TEXT,
    icon TEXT DEFAULT 'scissors',
    is_active INTEGER DEFAULT 1,
    niche_preset INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (salon_id) REFERENCES salons(id)
  );

  -- Professional-Service relationship (N:N)
  CREATE TABLE IF NOT EXISTS professional_services (
    professional_id TEXT NOT NULL,
    service_id TEXT NOT NULL,
    PRIMARY KEY (professional_id, service_id),
    FOREIGN KEY (professional_id) REFERENCES professionals(id),
    FOREIGN KEY (service_id) REFERENCES services(id)
  );

  -- Clients table
  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- Appointments table
  CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    salon_id TEXT NOT NULL,
    professional_id TEXT NOT NULL,
    client_id TEXT NOT NULL,
    service_id TEXT NOT NULL,
    scheduled_date TEXT NOT NULL,
    scheduled_time TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    price REAL NOT NULL,
    status TEXT CHECK(status IN ('scheduled', 'in_progress', 'completed', 'no_show', 'cancelled')) DEFAULT 'scheduled',
    client_notes TEXT,
    professional_notes TEXT,
    started_at TEXT,
    completed_at TEXT,
    cancellation_reason TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (salon_id) REFERENCES salons(id),
    FOREIGN KEY (professional_id) REFERENCES professionals(id),
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (service_id) REFERENCES services(id)
  );

  -- Reviews table
  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    appointment_id TEXT NOT NULL,
    client_id TEXT NOT NULL,
    professional_id TEXT NOT NULL,
    salon_id TEXT NOT NULL,
    rating INTEGER CHECK(rating BETWEEN 1 AND 5) NOT NULL,
    comment TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (professional_id) REFERENCES professionals(id),
    FOREIGN KEY (salon_id) REFERENCES salons(id)
  );

  -- Notifications table
  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    data TEXT,
    is_read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- Refresh tokens table
  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- Create indexes
  CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(scheduled_date);
  CREATE INDEX IF NOT EXISTS idx_appointments_professional ON appointments(professional_id);
  CREATE INDEX IF NOT EXISTS idx_appointments_client ON appointments(client_id);
  CREATE INDEX IF NOT EXISTS idx_appointments_salon ON appointments(salon_id);
  CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
  CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
  CREATE INDEX IF NOT EXISTS idx_reviews_professional ON reviews(professional_id);
`);

export default db;

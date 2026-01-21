import { pool } from './db.js';

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS processed_events (
      event_id VARCHAR(255) PRIMARY KEY,
      status VARCHAR(50),
      processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log("Database initialized");
}

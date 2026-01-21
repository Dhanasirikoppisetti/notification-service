import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT,
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
});

/* =======================
   Ensure table exists
======================= */
async function initIdempotencyTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS processed_events (
      event_id VARCHAR(255) PRIMARY KEY,
      processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log("Idempotency table ready");
}

// Initialize once on startup
initIdempotencyTable();

/* =======================
   Idempotency helpers
======================= */
export async function isEventProcessed(eventId) {
  const res = await pool.query(
    "SELECT 1 FROM processed_events WHERE event_id = $1",
    [eventId]
  );
  return res.rowCount > 0;
}

export async function markEventProcessed(eventId) {
  await pool.query(
    "INSERT INTO processed_events (event_id) VALUES ($1) ON CONFLICT DO NOTHING",
    [eventId]
  );
}

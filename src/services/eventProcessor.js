import { pool } from '../config/db.js';

export async function processEvent(event) {
  const { event_id, type, payload } = event;

  // 1️⃣ Check idempotency
  const exists = await pool.query(
    'SELECT event_id FROM processed_events WHERE event_id=$1',
    [event_id]
  );

  if (exists.rows.length > 0) {
    console.log(`Duplicate event ignored: ${event_id}`);
    return;
  }

  // 2️⃣ Process event
  if (type === 'USER_REGISTERED') {
    console.log(`Welcome email sent to ${payload.email}`);
  }

  if (type === 'ORDER_PLACED') {
    console.log(`Order confirmation sent for order ${payload.order_id}`);
  }

  // 3️⃣ Save event as processed
  await pool.query(
    'INSERT INTO processed_events (event_id, status) VALUES ($1, $2)',
    [event_id, 'SUCCESS']
  );
}

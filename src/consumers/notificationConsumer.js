import { channel } from "../queue/rabbitmq.js";
import { isEventProcessed, markEventProcessed } from "../db/idempotency.js";

/* =======================
   Retry Configuration
======================= */
const MAX_RETRIES = parseInt(process.env.RETRY_MAX_ATTEMPTS || "3");
const INITIAL_BACKOFF = parseInt(process.env.RETRY_INITIAL_BACKOFF_MS || "500");

const USER_QUEUE = process.env.USER_EVENTS_QUEUE;
const ORDER_QUEUE = process.env.ORDER_EVENTS_QUEUE;
const DLQ_QUEUE = process.env.DEAD_LETTER_QUEUE;

/* =======================
   In-memory Metrics
======================= */
let received = 0;
let processed = 0;
let failed = 0;

/* =======================
   Helpers
======================= */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function retryHandler(fn, event) {
  let attempt = 0;
  let delay = INITIAL_BACKOFF;

  while (attempt < MAX_RETRIES) {
    try {
      await fn();
      return true;
    } catch (err) {
      attempt++;
      console.log(`Retry ${attempt} failed for event`, event);

      if (attempt >= MAX_RETRIES) {
        console.log("Max retries reached → sending to DLQ");
        channel.sendToQueue(
          DLQ_QUEUE,
          Buffer.from(JSON.stringify(event))
        );
        return false;
      }

      await sleep(delay);
      delay *= 2;
    }
  }
}

/* =======================
   Consumers
======================= */
export const startConsumers = async () => {

  /* -------- USER EVENTS -------- */
  await channel.consume(USER_QUEUE, async (msg) => {
    if (!msg) return;
    received++;

    const event = JSON.parse(msg.content.toString());
    const eventId = event.event_id;

    if (!eventId) {
      console.log("User event missing event_id → skipped");
      channel.ack(msg);
      return;
    }

    if (await isEventProcessed(eventId)) {
      console.log("Duplicate USER event skipped:", eventId);
      channel.ack(msg);
      return;
    }

    const success = await retryHandler(async () => {
      if (event.email?.includes("fail")) {
        throw new Error("Simulated email failure");
      }

      console.log(`Welcome email sent to ${event.email}`);
      await markEventProcessed(eventId);
      processed++;
    }, event);

    if (!success) failed++;

    channel.ack(msg);
  });

  /* -------- ORDER EVENTS -------- */
  await channel.consume(ORDER_QUEUE, async (msg) => {
    if (!msg) return;
    received++;

    const event = JSON.parse(msg.content.toString());
    const eventId = event.event_id;

    if (!eventId) {
      console.log("Order event missing event_id → skipped");
      channel.ack(msg);
      return;
    }

    if (await isEventProcessed(eventId)) {
      console.log("Duplicate ORDER event skipped:", eventId);
      channel.ack(msg);
      return;
    }

    const success = await retryHandler(async () => {
      if (event.orderId?.includes("FAIL")) {
        throw new Error("Simulated order failure");
      }

      console.log(`Order confirmation sent for order ${event.orderId}`);
      await markEventProcessed(eventId);
      processed++;
    }, event);

    if (!success) failed++;

    channel.ack(msg);
  });

  console.log("Notification consumers started");
};

/* =======================
   Metrics API Helper
======================= */
export const getStats = () => ({
  received,
  processed,
  failed,
});

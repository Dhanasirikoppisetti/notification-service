import amqp from 'amqplib';
import { processEvent } from './eventProcessor.js';
import { retry } from './retry.js';

export async function startConsumer() {
  const conn = await amqp.connect(
    `amqp://${process.env.MESSAGE_QUEUE_USER}:${process.env.MESSAGE_QUEUE_PASSWORD}@${process.env.MESSAGE_QUEUE_HOST}`
  );

  const channel = await conn.createChannel();

  const queues = [
    process.env.USER_EVENTS_QUEUE,
    process.env.ORDER_EVENTS_QUEUE,
  ];

  for (const queue of queues) {
    await channel.assertQueue(queue, { durable: true });

    channel.consume(queue, async (msg) => {
      const event = JSON.parse(msg.content.toString());

      try {
        await retry(
          () => processEvent(event),
          process.env.RETRY_MAX_ATTEMPTS,
          process.env.RETRY_INITIAL_BACKOFF_MS
        );

        channel.ack(msg);
      } catch (err) {
        console.error('Moved to DLQ:', event.event_id);
        channel.sendToQueue(
          process.env.DEAD_LETTER_QUEUE,
          Buffer.from(JSON.stringify(event))
        );
        channel.ack(msg);
      }
    });
  }
}

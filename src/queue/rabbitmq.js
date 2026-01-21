import amqp from "amqplib";

const RABBITMQ_URL = `amqp://${process.env.MESSAGE_QUEUE_USER}:${process.env.MESSAGE_QUEUE_PASSWORD}@${process.env.MESSAGE_QUEUE_HOST}:${process.env.MESSAGE_QUEUE_PORT}`;

export let channel;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const connectRabbitMQ = async (retries = 10) => {
  while (retries > 0) {
    try {
      console.log("Connecting to RabbitMQ...");
      const connection = await amqp.connect(RABBITMQ_URL);
      channel = await connection.createChannel();

      await channel.assertQueue(process.env.USER_EVENTS_QUEUE, { durable: true });
      await channel.assertQueue(process.env.ORDER_EVENTS_QUEUE, { durable: true });
      await channel.assertQueue(process.env.DEAD_LETTER_QUEUE, { durable: true });

      console.log("RabbitMQ connected & queues created");
      return;
    } catch (error) {
      retries--;
      console.log(`RabbitMQ not ready. Retrying in 5s... (${retries} retries left)`);
      await sleep(5000);
    }
  }

  console.error("RabbitMQ connection failed after retries");
  process.exit(1);
};

import express from "express";
import dotenv from "dotenv";
import { connectRabbitMQ } from "./queue/rabbitmq.js";
import { startConsumers, getStats } from "./consumers/notificationConsumer.js";


dotenv.config();

const app = express();
const PORT = process.env.SERVICE_PORT || 8090;


app.get("/api/health", (req, res) => {
  res.json({ status: "healthy" });
});


app.get("/api/status", (req, res) => {
  res.json(getStats());
});


app.listen(PORT, async () => {
  console.log(`Service running on port ${PORT}`);
  await connectRabbitMQ(); 
   await startConsumers();  // 🔥 IMPORTANT
});

# 📢 Notification Service (Event-Driven Architecture)

This project implements a production-ready notification service using Node.js, RabbitMQ, PostgreSQL, and Docker.
It demonstrates asynchronous event processing, retry mechanisms, dead-letter queues, idempotency, and service health monitoring.

## 🏗️ Architecture Overview

### Flow:

Producers publish events (USER_EVENTS, ORDER_EVENTS)

RabbitMQ routes events to queues

Notification service consumes events

Events are processed asynchronously

Failures trigger retries with exponential backoff

After max retries, events go to a Dead Letter Queue (DLQ)

Idempotency ensures duplicate events are not reprocessed

Metrics and health exposed via REST APIs

### 🧰 Tech Stack

Backend: Node.js (Express)

Message Broker: RabbitMQ

Database: PostgreSQL

Containerization: Docker & Docker Compose

Messaging Pattern: Event-Driven Architecture

### ✨ Features Implemented

✅ RabbitMQ consumers for multiple event types

✅ Retry mechanism with exponential backoff

✅ Dead Letter Queue (DLQ) for failed events

✅ Idempotent event processing using PostgreSQL

✅ Health check API

✅ Metrics API (received / processed / failed)

✅ Fully Dockerized setup

✅ RabbitMQ Management UI support

### 🚀 How to Run the Project
1️⃣ Prerequisites

Make sure you have:

Docker

Docker Compose

### 2️⃣ Start the System
docker-compose up --build


Wait until logs show:

RabbitMQ connected & queues created
Notification consumers started
Service running on port 8090

### 🔍 Verification & Testing
🔹 Health Check
curl http://localhost:8090/api/health


Expected:

{"status":"healthy"}

🔹 Initial Metrics
curl http://localhost:8090/api/status


Expected:

{"received":0,"processed":0,"failed":0}

### 🐰 RabbitMQ Dashboard

#### Open in browser:

http://localhost:15672


Login:

Username: guest
Password: guest


Queues visible:

user_events

order_events

failed_events_dlq

## 📩 Publish Test Events
### ✔ Normal User Event
docker exec -it notification-service-rabbitmq-1 rabbitmqadmin publish \
  exchange=amq.default routing_key=user_events \
  payload='{"event_id":"evt-101","email":"user@gmail.com"}'

### 🔁 Duplicate Event (Idempotency Test)
docker exec -it notification-service-rabbitmq-1 rabbitmqadmin publish \
  exchange=amq.default routing_key=user_events \
  payload='{"event_id":"evt-101","email":"user@gmail.com"}'


### Metrics result:

{"received":2,"processed":1,"failed":0}


### Logs show:

Duplicate USER event skipped: evt-101

### ❌ Failure Event (Retry + DLQ)
docker exec -it notification-service-rabbitmq-1 rabbitmqadmin publish \
  exchange=amq.default routing_key=user_events \
  payload='{"event_id":"evt-fail","email":"fail_user@gmail.com"}'


#### Metrics:

{"received":3,"processed":1,"failed":1}


DLQ will contain the failed message.

📊 Metrics API
GET /api/status


Response:

{
  "received": number,
  "processed": number,
  "failed": number
}

### 🧠 Idempotency Strategy

Each event carries a unique event_id

Before processing, the service checks PostgreSQL

If the event was already processed, it is skipped

Prevents duplicate notifications and side effects

### 🧹 Stop the System
docker-compose down

## 🎯 Conclusion

This project demonstrates:

Scalable event-driven design

Reliable message processing

Fault tolerance using retries and DLQ

Production-grade idempotency handling

Observability via health and metrics APIs

## 🎥 Demo Video

Click the image below to watch the full demo of the Notification Service:

[![Notification Service Demo](https://img.youtube.com/vi/https://kUpA0Ghv2hY.jpg)](https://youtu.be/kUpA0Ghv2hY)

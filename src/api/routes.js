import express from 'express';
import { pool } from '../config/db.js';

export const router = express.Router();

let stats = {
  received: 0,
  processed: 0,
  failed: 0
};

router.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'healthy' });
  } catch {
    res.status(503).json({ status: 'unhealthy' });
  }
});

router.get('/status', (req, res) => {
  res.json(stats);
});

export function updateStats(type) {
  stats[type]++;
}

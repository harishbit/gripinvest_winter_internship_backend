import express from 'express';
import { db } from '../db/db';

const router = express.Router();

// GET /api/health
router.get('/', async (req, res) => {
  try {
    // Test database connection
    await db.execute('SELECT 1');
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        api: 'running',
      },
      version: '1.0.0',
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'disconnected',
        api: 'running',
      },
      error: 'Database connection failed',
    });
  }
});

export { router as healthRoutes };

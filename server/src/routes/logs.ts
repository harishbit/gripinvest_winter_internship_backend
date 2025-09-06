import express from 'express';
import { verifyToken } from '../utils/auth';
import { getTransactionLogs, getErrorSummary, analyzeErrors } from '../utils/transaction-logger';

const router = express.Router();

// GET /api/logs
router.get('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authorization required'
      });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({
        error: 'Invalid or expired token'
      });
    }

    const { limit = '50', offset = '0' } = req.query;

    // Get transaction logs for the user
    const logs = await getTransactionLogs(payload.userId, payload.email);
    const paginatedLogs = logs.slice(Number(offset), Number(offset) + Number(limit));

    // Get error summary and AI analysis
    const errorSummary = await getErrorSummary(payload.userId, payload.email);
    const aiInsights = analyzeErrors(errorSummary);

    res.json({
      logs: paginatedLogs,
      pagination: {
        total: logs.length,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: Number(offset) + Number(limit) < logs.length,
      },
      errorSummary,
      aiInsights,
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

export { router as logRoutes };

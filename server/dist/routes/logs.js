"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = require("../utils/auth");
const transaction_logger_1 = require("../utils/transaction-logger");
const router = express_1.default.Router();
exports.logRoutes = router;
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
        const payload = (0, auth_1.verifyToken)(token);
        if (!payload) {
            return res.status(401).json({
                error: 'Invalid or expired token'
            });
        }
        const { limit = '50', offset = '0' } = req.query;
        // Get transaction logs for the user
        const logs = await (0, transaction_logger_1.getTransactionLogs)(payload.userId, payload.email);
        const paginatedLogs = logs.slice(Number(offset), Number(offset) + Number(limit));
        // Get error summary and AI analysis
        const errorSummary = await (0, transaction_logger_1.getErrorSummary)(payload.userId, payload.email);
        const aiInsights = (0, transaction_logger_1.analyzeErrors)(errorSummary);
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
    }
    catch (error) {
        console.error('Get logs error:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});
//# sourceMappingURL=logs.js.map
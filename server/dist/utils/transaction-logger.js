"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logTransaction = logTransaction;
exports.getTransactionLogs = getTransactionLogs;
exports.getErrorSummary = getErrorSummary;
exports.analyzeErrors = analyzeErrors;
const db_1 = require("../db/db");
const schema_1 = require("../db/schema");
const auth_1 = require("./auth");
const drizzle_orm_1 = require("drizzle-orm");
async function logTransaction({ request, response, userId, email, errorMessage, }) {
    try {
        // Extract user info from token if not provided
        let finalUserId = userId;
        let finalEmail = email;
        if (!finalUserId || !finalEmail) {
            const authHeader = request.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                const payload = (0, auth_1.verifyToken)(token);
                if (payload) {
                    finalUserId = payload.userId;
                    finalEmail = payload.email;
                }
            }
        }
        await db_1.db.insert(schema_1.transactionLogs).values({
            userId: finalUserId,
            email: finalEmail,
            endpoint: request.path,
            httpMethod: request.method,
            statusCode: response.statusCode,
            errorMessage: errorMessage,
        });
    }
    catch (error) {
        console.error('Failed to log transaction:', error);
        // Don't throw error to avoid breaking the main request
    }
}
async function getTransactionLogs(userId, email, limit = 50) {
    try {
        let logs;
        if (userId) {
            logs = await db_1.db
                .select()
                .from(schema_1.transactionLogs)
                .where((0, drizzle_orm_1.eq)(schema_1.transactionLogs.userId, userId))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.transactionLogs.createdAt))
                .limit(limit);
        }
        else if (email) {
            logs = await db_1.db
                .select()
                .from(schema_1.transactionLogs)
                .where((0, drizzle_orm_1.eq)(schema_1.transactionLogs.email, email))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.transactionLogs.createdAt))
                .limit(limit);
        }
        else {
            logs = await db_1.db
                .select()
                .from(schema_1.transactionLogs)
                .orderBy((0, drizzle_orm_1.desc)(schema_1.transactionLogs.createdAt))
                .limit(limit);
        }
        return logs;
    }
    catch (error) {
        console.error('Failed to get transaction logs:', error);
        return [];
    }
}
async function getErrorSummary(userId, email) {
    try {
        const logs = await getTransactionLogs(userId, email, 1000);
        const errorLogs = logs.filter(log => log.statusCode >= 400);
        const summary = {
            totalErrors: errorLogs.length,
            errorByEndpoint: errorLogs.reduce((acc, log) => {
                acc[log.endpoint] = (acc[log.endpoint] || 0) + 1;
                return acc;
            }, {}),
            errorByStatusCode: errorLogs.reduce((acc, log) => {
                acc[log.statusCode] = (acc[log.statusCode] || 0) + 1;
                return acc;
            }, {}),
            recentErrors: errorLogs.slice(0, 10),
        };
        return summary;
    }
    catch (error) {
        console.error('Failed to get error summary:', error);
        return {
            totalErrors: 0,
            errorByEndpoint: {},
            errorByStatusCode: {},
            recentErrors: [],
        };
    }
}
function analyzeErrors(errorSummary) {
    // AI-powered error analysis (simplified version)
    const insights = {
        criticalIssues: [],
        recommendations: [],
        patterns: [],
    };
    if (errorSummary.totalErrors > 0) {
        // Find most common error endpoints
        const topErrorEndpoint = Object.entries(errorSummary.errorByEndpoint)
            .sort(([, a], [, b]) => b - a)[0];
        if (topErrorEndpoint) {
            insights.criticalIssues.push({
                type: 'high_error_rate',
                endpoint: topErrorEndpoint[0],
                count: topErrorEndpoint[1],
                message: `High error rate detected on ${topErrorEndpoint[0]} endpoint`,
            });
            insights.recommendations.push({
                type: 'investigate_endpoint',
                endpoint: topErrorEndpoint[0],
                message: `Investigate and fix issues with ${topErrorEndpoint[0]} endpoint`,
            });
        }
        // Check for 500 errors
        if (errorSummary.errorByStatusCode[500]) {
            insights.criticalIssues.push({
                type: 'server_errors',
                count: errorSummary.errorByStatusCode[500],
                message: 'Server errors detected - check application logs',
            });
            insights.recommendations.push({
                type: 'check_logs',
                message: 'Review server logs for 500 errors and fix underlying issues',
            });
        }
        // Check for authentication errors
        if (errorSummary.errorByStatusCode[401] || errorSummary.errorByStatusCode[403]) {
            insights.patterns.push({
                type: 'auth_issues',
                message: 'Authentication/authorization issues detected',
            });
            insights.recommendations.push({
                type: 'review_auth',
                message: 'Review authentication flow and token validation',
            });
        }
    }
    return insights;
}
//# sourceMappingURL=transaction-logger.js.map
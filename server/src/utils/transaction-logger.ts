import { Request, Response } from 'express';
import { db } from '../db/db';
import { transactionLogs } from '../db/schema';
import { verifyToken } from './auth';
import { eq, desc } from 'drizzle-orm';

export interface LogTransactionParams {
  request: Request;
  response: Response;
  userId?: string;
  email?: string;
  errorMessage?: string;
}

export async function logTransaction({
  request,
  response,
  userId,
  email,
  errorMessage,
}: LogTransactionParams): Promise<void> {
  try {
    // Extract user info from token if not provided
    let finalUserId = userId;
    let finalEmail = email;

    if (!finalUserId || !finalEmail) {
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const payload = verifyToken(token);
        if (payload) {
          finalUserId = payload.userId;
          finalEmail = payload.email;
        }
      }
    }

    await db.insert(transactionLogs).values({
      userId: finalUserId,
      email: finalEmail,
      endpoint: request.path,
      httpMethod: request.method as 'GET' | 'POST' | 'PUT' | 'DELETE',
      statusCode: response.statusCode,
      errorMessage: errorMessage,
    });
  } catch (error) {
    console.error('Failed to log transaction:', error);
    // Don't throw error to avoid breaking the main request
  }
}

export async function getTransactionLogs(
  userId?: string,
  email?: string,
  limit: number = 50
): Promise<any[]> {
  try {
    let logs;
    if (userId) {
      logs = await db
        .select()
        .from(transactionLogs)
        .where(eq(transactionLogs.userId, userId))
        .orderBy(desc(transactionLogs.createdAt))
        .limit(limit);
    } else if (email) {
      logs = await db
        .select()
        .from(transactionLogs)
        .where(eq(transactionLogs.email, email))
        .orderBy(desc(transactionLogs.createdAt))
        .limit(limit);
    } else {
      logs = await db
        .select()
        .from(transactionLogs)
        .orderBy(desc(transactionLogs.createdAt))
        .limit(limit);
    }

    return logs;
  } catch (error) {
    console.error('Failed to get transaction logs:', error);
    return [];
  }
}

export async function getErrorSummary(
  userId?: string,
  email?: string
): Promise<any> {
  try {
    const logs = await getTransactionLogs(userId, email, 1000);
    
    const errorLogs = logs.filter(log => log.statusCode >= 400);
    
    const summary = {
      totalErrors: errorLogs.length,
      errorByEndpoint: errorLogs.reduce((acc: any, log: any) => {
        acc[log.endpoint] = (acc[log.endpoint] || 0) + 1;
        return acc;
      }, {}),
      errorByStatusCode: errorLogs.reduce((acc: any, log: any) => {
        acc[log.statusCode] = (acc[log.statusCode] || 0) + 1;
        return acc;
      }, {}),
      recentErrors: errorLogs.slice(0, 10),
    };

    return summary;
  } catch (error) {
    console.error('Failed to get error summary:', error);
    return {
      totalErrors: 0,
      errorByEndpoint: {},
      errorByStatusCode: {},
      recentErrors: [],
    };
  }
}

export function analyzeErrors(errorSummary: any): any {
  // AI-powered error analysis (simplified version)
  const insights = {
    criticalIssues: [] as any[],
    recommendations: [] as any[],
    patterns: [] as any[],
  };

  if (errorSummary.totalErrors > 0) {
    // Find most common error endpoints
    const topErrorEndpoint = Object.entries(errorSummary.errorByEndpoint)
      .sort(([, a], [, b]) => (b as number) - (a as number))[0];

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
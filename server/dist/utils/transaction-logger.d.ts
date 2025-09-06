import { Request, Response } from 'express';
export interface LogTransactionParams {
    request: Request;
    response: Response;
    userId?: string;
    email?: string;
    errorMessage?: string;
}
export declare function logTransaction({ request, response, userId, email, errorMessage, }: LogTransactionParams): Promise<void>;
export declare function getTransactionLogs(userId?: string, email?: string, limit?: number): Promise<any[]>;
export declare function getErrorSummary(userId?: string, email?: string): Promise<any>;
export declare function analyzeErrors(errorSummary: any): any;
//# sourceMappingURL=transaction-logger.d.ts.map
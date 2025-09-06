export interface JWTPayload {
    userId: string;
    email: string;
    iat?: number;
    exp?: number;
}
export declare function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string;
export declare function verifyToken(token: string): JWTPayload | null;
export declare function hashPassword(password: string): Promise<string>;
export declare function verifyPassword(password: string, hashedPassword: string): Promise<boolean>;
export declare function validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
};
//# sourceMappingURL=auth.d.ts.map
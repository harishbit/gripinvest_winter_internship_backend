"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.validatePasswordStrength = validatePasswordStrength;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
function generateToken(payload) {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}
function verifyToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (error) {
        return null;
    }
}
async function hashPassword(password) {
    const saltRounds = 12;
    return bcryptjs_1.default.hash(password, saltRounds);
}
async function verifyPassword(password, hashedPassword) {
    return bcryptjs_1.default.compare(password, hashedPassword);
}
function validatePasswordStrength(password) {
    const feedback = [];
    let score = 0;
    // Length check
    if (password.length < 8) {
        feedback.push('Password must be at least 8 characters long');
    }
    else {
        score += 1;
    }
    // Uppercase check
    if (!/[A-Z]/.test(password)) {
        feedback.push('Add uppercase letters');
    }
    else {
        score += 1;
    }
    // Lowercase check
    if (!/[a-z]/.test(password)) {
        feedback.push('Add lowercase letters');
    }
    else {
        score += 1;
    }
    // Number check
    if (!/\d/.test(password)) {
        feedback.push('Add numbers');
    }
    else {
        score += 1;
    }
    // Special character check
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        feedback.push('Add special characters');
    }
    else {
        score += 1;
    }
    // Common password check
    const commonPasswords = ['password', '123456', 'qwerty', 'abc123', 'password123'];
    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
        feedback.push('Avoid common password patterns');
        score -= 1;
    }
    return {
        isValid: score >= 4 && password.length >= 8,
        score: Math.max(0, Math.min(5, score)),
        feedback: feedback.length > 0 ? feedback : ['Strong password!']
    };
}
//# sourceMappingURL=auth.js.map
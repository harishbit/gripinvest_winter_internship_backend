"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const db_1 = require("../db/db");
const schema_1 = require("../db/schema");
const auth_1 = require("../utils/auth");
const drizzle_orm_1 = require("drizzle-orm");
const router = express_1.default.Router();
exports.authRoutes = router;
const signupSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1, 'First name is required'),
    lastName: zod_1.z.string().optional(),
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    riskAppetite: zod_1.z.enum(['low', 'moderate', 'high']).default('moderate'),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
// POST /api/auth/signup
router.post('/signup', async (req, res) => {
    try {
        const validatedData = signupSchema.parse(req.body);
        // Validate password strength
        const passwordValidation = (0, auth_1.validatePasswordStrength)(validatedData.password);
        if (!passwordValidation.isValid) {
            return res.status(400).json({
                error: 'Password does not meet requirements',
                feedback: passwordValidation.feedback,
                score: passwordValidation.score
            });
        }
        // Check if user already exists
        const existingUser = await db_1.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.email, validatedData.email))
            .limit(1);
        if (existingUser.length > 0) {
            return res.status(409).json({
                error: 'User with this email already exists'
            });
        }
        // Hash password
        const hashedPassword = await (0, auth_1.hashPassword)(validatedData.password);
        // Create user
        const [newUser] = await db_1.db.insert(schema_1.users).values({
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            email: validatedData.email,
            passwordHash: hashedPassword,
            riskAppetite: validatedData.riskAppetite,
        });
        // Generate JWT token
        const token = (0, auth_1.generateToken)({
            userId: String(newUser.insertId),
            email: validatedData.email,
        });
        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: newUser.insertId,
                firstName: validatedData.firstName,
                lastName: validatedData.lastName,
                email: validatedData.email,
                riskAppetite: validatedData.riskAppetite,
            },
            passwordFeedback: {
                score: passwordValidation.score,
                feedback: passwordValidation.feedback,
            },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: 'Validation error',
                details: error.issues
            });
        }
        console.error('Signup error:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});
// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const validatedData = loginSchema.parse(req.body);
        // Find user by email
        const user = await db_1.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.email, validatedData.email))
            .limit(1);
        if (user.length === 0) {
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }
        const foundUser = user[0];
        // Verify password
        const { verifyPassword } = await Promise.resolve().then(() => __importStar(require('../utils/auth')));
        const isPasswordValid = await verifyPassword(validatedData.password, foundUser.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }
        // Generate JWT token
        const token = (0, auth_1.generateToken)({
            userId: foundUser.id,
            email: foundUser.email,
        });
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: foundUser.id,
                firstName: foundUser.firstName,
                lastName: foundUser.lastName,
                email: foundUser.email,
                riskAppetite: foundUser.riskAppetite,
            },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: 'Validation error',
                details: error.issues
            });
        }
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});
// GET /api/auth/me
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Authorization header missing or invalid'
            });
        }
        const token = authHeader.substring(7);
        const payload = (0, auth_1.verifyToken)(token);
        if (!payload) {
            return res.status(401).json({
                error: 'Invalid or expired token'
            });
        }
        // Get user details
        const user = await db_1.db
            .select({
            id: schema_1.users.id,
            firstName: schema_1.users.firstName,
            lastName: schema_1.users.lastName,
            email: schema_1.users.email,
            riskAppetite: schema_1.users.riskAppetite,
            createdAt: schema_1.users.createdAt,
        })
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, payload.userId))
            .limit(1);
        if (user.length === 0) {
            return res.status(404).json({
                error: 'User not found'
            });
        }
        res.json({
            user: user[0],
        });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});
//# sourceMappingURL=auth.js.map
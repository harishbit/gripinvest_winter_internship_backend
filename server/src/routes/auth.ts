import express from 'express';
import { z } from 'zod';
import { db } from '../db/db';
import { users } from '../db/schema';
import { hashPassword, generateToken, verifyToken, validatePasswordStrength } from '../utils/auth';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const router = express.Router();

const signupSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  riskAppetite: z.enum(['low', 'moderate', 'high']).default('moderate'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const validatedData = signupSchema.parse(req.body);

    // Validate password strength
    const passwordValidation = validatePasswordStrength(validatedData.password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: 'Password does not meet requirements',
        feedback: passwordValidation.feedback,
        score: passwordValidation.score
      });
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(409).json({
        error: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);

    // Generate UUID for user
    const userId = randomUUID();

    // Create user
    const result = await db.insert(users).values({
      id: userId,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      email: validatedData.email,
      passwordHash: hashedPassword,
      riskAppetite: validatedData.riskAppetite,
    });

    // Generate JWT token
    const token = generateToken({
      userId: userId,
      email: validatedData.email,
    });

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: userId,
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
  } catch (error) {
    if (error instanceof z.ZodError) {
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
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);

    if (user.length === 0) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    const foundUser = user[0];

    // Verify password
    const { verifyPassword } = await import('../utils/auth');
    const isPasswordValid = await verifyPassword(validatedData.password, foundUser.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = generateToken({
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
  } catch (error) {
    if (error instanceof z.ZodError) {
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
    const payload = verifyToken(token);

    if (!payload) {
      return res.status(401).json({
        error: 'Invalid or expired token'
      });
    }

    // Get user details
    const user = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        riskAppetite: users.riskAppetite,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (user.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({
      user: user[0],
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

export { router as authRoutes };

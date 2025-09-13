import express, { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/db';
import { users, passwordResetTokens } from '../db/schema';
import { hashPassword, generateToken, verifyToken, validatePasswordStrength } from '../utils/auth';
import { EmailService, generateResetCode } from '../utils/email';
import { eq, and, gt } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';

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

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().length(6, 'Reset code must be 6 digits'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Register a new user account
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - email
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: User's first name
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 description: User's last name
 *                 example: "Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: "john.doe@example.com"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: User's password (minimum 8 characters)
 *                 example: "SecurePass123!"
 *               riskAppetite:
 *                 type: string
 *                 enum: [low, moderate, high]
 *                 description: User's investment risk tolerance
 *                 example: "moderate"
 *     responses:
 *       201:
 *         description: User successfully registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error or weak password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: User with email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// POST /api/auth/signup
router.post('/signup', async (req: Request, res: Response) => {
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

    // Send welcome email (don't wait for it to complete)
    EmailService.sendWelcomeEmail(validatedData.email, validatedData.firstName)
      .catch(error => console.error('Failed to send welcome email:', error));

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

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate user and get access token
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: "john.doe@example.com"
 *               password:
 *                 type: string
 *                 description: User's password
 *                 example: "SecurePass123!"
 *     responses:
 *       200:
 *         description: User successfully authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
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

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/auth/me
router.get('/me', async (req: Request, res: Response) => {
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

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset code
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: "john.doe@example.com"
 *     responses:
 *       200:
 *         description: Password reset code sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password reset code sent to your email"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST /api/auth/forgot-password
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const validatedData = forgotPasswordSchema.parse(req.body);

    // Check if user exists
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);

    if (user.length === 0) {
      return res.status(404).json({
        error: 'User with this email does not exist'
      });
    }

    // Generate reset code
    const resetCode = generateResetCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutes expiry

    // Save reset token to database
    await db.insert(passwordResetTokens).values({
      email: validatedData.email,
      token: resetCode,
      expiresAt: expiresAt,
      isUsed: '0'
    });

    // Send email with reset code
    const emailSent = await EmailService.sendPasswordResetCode(validatedData.email, resetCode, user[0].firstName);

    if (!emailSent) {
      return res.status(500).json({
        error: 'Failed to send password reset email'
      });
    }

    res.json({
      message: 'Password reset code sent to your email'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.issues
      });
    }

    console.error('Forgot password error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using verification code
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: "john.doe@example.com"
 *               code:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *                 description: 6-digit verification code
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 description: New password (minimum 8 characters)
 *                 example: "NewSecurePass123!"
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password reset successfully"
 *       400:
 *         description: Validation error or weak password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid or expired reset code
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST /api/auth/reset-password
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const validatedData = resetPasswordSchema.parse(req.body);

    // Validate password strength
    const passwordValidation = validatePasswordStrength(validatedData.newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: 'Password does not meet requirements',
        feedback: passwordValidation.feedback,
        score: passwordValidation.score
      });
    }

    // Find valid reset token
    const currentTime = new Date();
    const resetToken = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.email, validatedData.email),
          eq(passwordResetTokens.token, validatedData.code),
          eq(passwordResetTokens.isUsed, '0'),
          gt(passwordResetTokens.expiresAt, currentTime)
        )
      )
      .limit(1);

    if (resetToken.length === 0) {
      return res.status(401).json({
        error: 'Invalid or expired reset code'
      });
    }

    // Check if user exists
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);

    if (user.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(validatedData.newPassword);

    // Update user password
    await db
      .update(users)
      .set({
        passwordHash: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.email, validatedData.email));

    // Mark reset token as used
    await db
      .update(passwordResetTokens)
      .set({
        isUsed: '1'
      })
      .where(eq(passwordResetTokens.id, resetToken[0].id));

    res.json({
      message: 'Password reset successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.issues
      });
    }

    console.error('Reset password error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

export { router as authRoutes };

import express from 'express';
import { z } from 'zod';
import { db } from '../db/db';
import { investments, investmentProducts } from '../db/schema';
import { verifyToken } from '../utils/auth';
import { eq, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const router = express.Router();

const investmentSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  amount: z.number().positive('Amount must be positive').min(1000, 'Minimum investment is ₹1000'),
});

/**
 * @swagger
 * /investments:
 *   get:
 *     summary: Get user's investments and portfolio summary
 *     tags: [Investments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User investments and portfolio summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 investments:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Investment'
 *                       - type: object
 *                         properties:
 *                           product:
 *                             $ref: '#/components/schemas/InvestmentProduct'
 *                 portfolio:
 *                   $ref: '#/components/schemas/PortfolioSummary'
 *       401:
 *         description: Unauthorized - Authentication required
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
// GET /api/investments
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

    // Get user's investments with product details
    const userInvestments = await db
      .select({
        id: investments.id,
        amount: investments.amount,
        investedAt: investments.investedAt,
        status: investments.status,
        expectedReturn: investments.expectedReturn,
        maturityDate: investments.maturityDate,
        product: {
          id: investmentProducts.id,
          name: investmentProducts.name,
          investmentType: investmentProducts.investmentType,
          annualYield: investmentProducts.annualYield,
          riskLevel: investmentProducts.riskLevel,
          tenureMonths: investmentProducts.tenureMonths,
        },
      })
      .from(investments)
      .innerJoin(investmentProducts, eq(investments.productId, investmentProducts.id))
      .where(eq(investments.userId, payload.userId))
      .orderBy(desc(investments.investedAt));

    // Calculate portfolio summary
    const totalInvested = userInvestments.reduce((sum: number, inv: any) => sum + Number(inv.amount), 0);
    const activeInvestments = userInvestments.filter((inv: any) => inv.status === 'active');
    const totalExpectedReturn = activeInvestments.reduce((sum: number, inv: any) => sum + Number(inv.expectedReturn || 0), 0);

    // Calculate risk distribution
    const riskDistribution: { [key: string]: number } = {};
    if (userInvestments.length > 0) {
      userInvestments.forEach((inv: any) => {
        const risk = inv.product?.riskLevel;
        if (risk) {
          riskDistribution[risk] = (riskDistribution[risk] || 0) + Number(inv.amount);
        }
      });
    }

    // Calculate type distribution
    const typeDistribution: { [key: string]: number } = {};
    if (userInvestments.length > 0) {
      userInvestments.forEach((inv: any) => {
        const type = inv.product?.investmentType;
        if (type) {
          typeDistribution[type] = (typeDistribution[type] || 0) + Number(inv.amount);
        }
      });
    }

    const insights = {
      totalInvested,
      totalExpectedReturn,
      activeInvestmentsCount: activeInvestments.length,
      averageYield: userInvestments.length > 0 
        ? userInvestments.reduce((sum: number, inv: any) => sum + Number(inv.product.annualYield), 0) / userInvestments.length 
        : 0,
      riskDistribution,
      typeDistribution,
    };

    res.json({
      investments: userInvestments,
      portfolio: insights,
    });
  } catch (error) {
    console.error('Get investments error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /investments:
 *   post:
 *     summary: Create a new investment
 *     tags: [Investments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - amount
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the investment product
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               amount:
 *                 type: number
 *                 format: decimal
 *                 minimum: 1000
 *                 description: Investment amount (minimum ₹1000)
 *                 example: 50000
 *     responses:
 *       201:
 *         description: Investment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Investment created successfully"
 *                 investment:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     amount:
 *                       type: number
 *                       format: decimal
 *                     expectedReturn:
 *                       type: number
 *                       format: decimal
 *                     maturityDate:
 *                       type: string
 *                       format: date-time
 *                     product:
 *                       $ref: '#/components/schemas/InvestmentProduct'
 *       400:
 *         description: Validation error or investment amount limits exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Product not found
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
// POST /api/investments
router.post('/', async (req, res) => {
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

    const validatedData = investmentSchema.parse(req.body);

    // Get product details
    const product = await db
      .select()
      .from(investmentProducts)
      .where(eq(investmentProducts.id, validatedData.productId))
      .limit(1);

    if (product.length === 0) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    const productData = product[0];

    // Validate investment amount
    if (validatedData.amount < Number(productData.minInvestment)) {
      return res.status(400).json({
        error: `Minimum investment amount is ₹${productData.minInvestment}`
      });
    }

    if (productData.maxInvestment && validatedData.amount > Number(productData.maxInvestment)) {
      return res.status(400).json({
        error: `Maximum investment amount is ₹${productData.maxInvestment}`
      });
    }

    // Calculate expected return and maturity date
    const annualYield = Number(productData.annualYield);
    const tenureMonths = productData.tenureMonths;
    const expectedReturn = (validatedData.amount * annualYield * tenureMonths) / (100 * 12);
    
    const maturityDate = new Date();
    maturityDate.setMonth(maturityDate.getMonth() + tenureMonths);

    // Create investment
    const result = await db.insert(investments).values({
      userId: payload.userId,
      productId: validatedData.productId,
      amount: validatedData.amount,
      expectedReturn: expectedReturn,
      maturityDate: maturityDate,
    } as any);

    // Get the created investment with its generated ID
    const createdInvestment = await db
      .select()
      .from(investments)
      .where(eq(investments.userId, payload.userId))
      .orderBy(desc(investments.investedAt))
      .limit(1);

    res.status(201).json({
      message: 'Investment created successfully',
      investment: {
        id: createdInvestment[0]?.id,
        amount: validatedData.amount,
        expectedReturn,
        maturityDate,
        product: productData,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.issues
      });
    }

    console.error('Create investment error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

export { router as investmentRoutes };

import express from 'express';
import { z } from 'zod';
import { db } from '../db/db';
import { investmentProducts, users } from '../db/schema';
import { verifyToken } from '../utils/auth';
import { eq, desc, asc } from 'drizzle-orm';

const router = express.Router();

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  investmentType: z.enum(['bond', 'fd', 'mf', 'etf', 'other']),
  tenureMonths: z.number().min(1, 'Tenure must be at least 1 month'),
  annualYield: z.number().min(0, 'Annual yield must be non-negative'),
  riskLevel: z.enum(['low', 'moderate', 'high']),
  minInvestment: z.number().min(0, 'Minimum investment must be non-negative').default(1000),
  maxInvestment: z.number().min(0, 'Maximum investment must be non-negative').optional(),
  description: z.string().optional(),
});

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all investment products with optional filtering and sorting
 *     tags: [Products]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [bond, fd, mf, etf, other]
 *         description: Filter by investment type
 *       - in: query
 *         name: riskLevel
 *         schema:
 *           type: string
 *           enum: [low, moderate, high]
 *         description: Filter by risk level
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, annualYield, tenureMonths, minInvestment]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of investment products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InvestmentProduct'
 *                 total:
 *                   type: integer
 *                   description: Total number of products
 *                 summary:
 *                   type: object
 *                   properties:
 *                     byType:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                     byRiskLevel:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                     avgYield:
 *                       type: number
 *                       format: decimal
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { type, riskLevel, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Get all products first, then filter and sort in memory (simplified approach)
    const allProducts = await db.select().from(investmentProducts);

    // Apply filters
    let filteredProducts = allProducts;
    if (type) {
      filteredProducts = filteredProducts.filter(p => p.investmentType === type);
    }
    if (riskLevel) {
      filteredProducts = filteredProducts.filter(p => p.riskLevel === riskLevel);
    }

    // Apply sorting
    filteredProducts.sort((a, b) => {
      let aValue, bValue;
      if (sortBy === 'yield') {
        aValue = Number(a.annualYield);
        bValue = Number(b.annualYield);
      } else if (sortBy === 'tenure') {
        aValue = a.tenureMonths;
        bValue = b.tenureMonths;
      } else {
        aValue = new Date(a.createdAt || 0).getTime();
        bValue = new Date(b.createdAt || 0).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    const products = filteredProducts;

    res.json({
      products,
      count: products.length,
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get a specific investment product by ID
 *     tags: [Products]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product unique identifier
 *     responses:
 *       200:
 *         description: Product found successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 product:
 *                   $ref: '#/components/schemas/InvestmentProduct'
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
// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await db
      .select()
      .from(investmentProducts)
      .where(eq(investmentProducts.id, req.params.id))
      .limit(1);

    if (product.length === 0) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    res.json({
      product: product[0],
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new investment product (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - investmentType
 *               - tenureMonths
 *               - annualYield
 *               - riskLevel
 *             properties:
 *               name:
 *                 type: string
 *                 description: Product name
 *                 example: "Premium Bond Series A"
 *               investmentType:
 *                 type: string
 *                 enum: [bond, fd, mf, etf, other]
 *                 description: Type of investment product
 *                 example: "bond"
 *               tenureMonths:
 *                 type: integer
 *                 minimum: 1
 *                 description: Investment tenure in months
 *                 example: 24
 *               annualYield:
 *                 type: number
 *                 format: decimal
 *                 minimum: 0
 *                 description: Expected annual yield percentage
 *                 example: 8.5
 *               riskLevel:
 *                 type: string
 *                 enum: [low, moderate, high]
 *                 description: Risk level of the product
 *                 example: "low"
 *               minInvestment:
 *                 type: number
 *                 format: decimal
 *                 minimum: 0
 *                 description: Minimum investment amount
 *                 example: 1000
 *               maxInvestment:
 *                 type: number
 *                 format: decimal
 *                 minimum: 0
 *                 description: Maximum investment amount
 *                 example: 1000000
 *               description:
 *                 type: string
 *                 description: Product description
 *                 example: "A low-risk government bond with steady returns"
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Product created successfully"
 *                 product:
 *                   $ref: '#/components/schemas/InvestmentProduct'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Admin access required
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
// POST /api/products (admin only)
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

    // Temporarily allow any authenticated user to create products
    // TODO: Add role checking after database migration
    const user = await db
      .select({
        id: users.id,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (user.length === 0) {
      return res.status(403).json({
        error: 'User not found'
      });
    }

    const validatedData = productSchema.parse(req.body);

    // Auto-generate description if not provided
    let description = validatedData.description;
    if (!description) {
      description = `A ${validatedData.investmentType.toUpperCase()} investment product with ${validatedData.annualYield}% annual yield. ` +
        `Minimum investment: ₹${validatedData.minInvestment}, ` +
        `Tenure: ${validatedData.tenureMonths} months, ` +
        `Risk level: ${validatedData.riskLevel}.`;
    }

    const [newProduct] = await db.insert(investmentProducts).values({
      name: validatedData.name,
      investmentType: validatedData.investmentType,
      tenureMonths: validatedData.tenureMonths,
      annualYield: validatedData.annualYield.toString(),
      riskLevel: validatedData.riskLevel,
      minInvestment: validatedData.minInvestment.toString(),
      maxInvestment: validatedData.maxInvestment?.toString(),
      description,
    });

    res.status(201).json({
      message: 'Product created successfully',
      product: {
        id: newProduct.insertId,
        ...validatedData,
        description,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.issues
      });
    }

    console.error('Create product error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete an investment product (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product unique identifier
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Product deleted successfully"
 *       401:
 *         description: Unauthorized - Admin access required
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
// DELETE /api/products/:id (admin only)
router.delete('/:id', async (req, res) => {
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

    // Temporarily allow any authenticated user to delete products
    // TODO: Add role checking after database migration
    const user = await db
      .select({
        id: users.id,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (user.length === 0) {
      return res.status(403).json({
        error: 'User not found'
      });
    }

    // Check if product exists
    const product = await db
      .select()
      .from(investmentProducts)
      .where(eq(investmentProducts.id, req.params.id))
      .limit(1);

    if (product.length === 0) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    // Delete the product
    await db
      .delete(investmentProducts)
      .where(eq(investmentProducts.id, req.params.id));

    res.json({
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

export { router as productRoutes };

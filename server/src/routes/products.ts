import express from 'express';
import { z } from 'zod';
import { db } from '../db/db';
import { investmentProducts } from '../db/schema';
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

// POST /api/products (admin only)
router.post('/', async (req, res) => {
  try {
    // Verify admin token (simplified - in production, check user role)
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

export { router as productRoutes };

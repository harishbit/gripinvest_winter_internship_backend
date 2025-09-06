"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.productRoutes = void 0;
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const db_1 = require("../db/db");
const schema_1 = require("../db/schema");
const auth_1 = require("../utils/auth");
const drizzle_orm_1 = require("drizzle-orm");
const router = express_1.default.Router();
exports.productRoutes = router;
const productSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Product name is required'),
    investmentType: zod_1.z.enum(['bond', 'fd', 'mf', 'etf', 'other']),
    tenureMonths: zod_1.z.number().min(1, 'Tenure must be at least 1 month'),
    annualYield: zod_1.z.number().min(0, 'Annual yield must be non-negative'),
    riskLevel: zod_1.z.enum(['low', 'moderate', 'high']),
    minInvestment: zod_1.z.number().min(0, 'Minimum investment must be non-negative').default(1000),
    maxInvestment: zod_1.z.number().min(0, 'Maximum investment must be non-negative').optional(),
    description: zod_1.z.string().optional(),
});
// GET /api/products
router.get('/', async (req, res) => {
    try {
        const { type, riskLevel, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        // Get all products first, then filter and sort in memory (simplified approach)
        const allProducts = await db_1.db.select().from(schema_1.investmentProducts);
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
            }
            else if (sortBy === 'tenure') {
                aValue = a.tenureMonths;
                bValue = b.tenureMonths;
            }
            else {
                aValue = new Date(a.createdAt || 0).getTime();
                bValue = new Date(b.createdAt || 0).getTime();
            }
            if (sortOrder === 'asc') {
                return aValue - bValue;
            }
            else {
                return bValue - aValue;
            }
        });
        const products = filteredProducts;
        res.json({
            products,
            count: products.length,
        });
    }
    catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});
// GET /api/products/:id
router.get('/:id', async (req, res) => {
    try {
        const product = await db_1.db
            .select()
            .from(schema_1.investmentProducts)
            .where((0, drizzle_orm_1.eq)(schema_1.investmentProducts.id, req.params.id))
            .limit(1);
        if (product.length === 0) {
            return res.status(404).json({
                error: 'Product not found'
            });
        }
        res.json({
            product: product[0],
        });
    }
    catch (error) {
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
        const payload = (0, auth_1.verifyToken)(token);
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
        const [newProduct] = await db_1.db.insert(schema_1.investmentProducts).values({
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
//# sourceMappingURL=products.js.map
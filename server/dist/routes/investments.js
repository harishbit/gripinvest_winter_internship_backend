"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.investmentRoutes = void 0;
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const db_1 = require("../db/db");
const schema_1 = require("../db/schema");
const auth_1 = require("../utils/auth");
const drizzle_orm_1 = require("drizzle-orm");
const router = express_1.default.Router();
exports.investmentRoutes = router;
const investmentSchema = zod_1.z.object({
    productId: zod_1.z.string().uuid('Invalid product ID'),
    amount: zod_1.z.number().positive('Amount must be positive').min(1000, 'Minimum investment is ₹1000'),
});
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
        const payload = (0, auth_1.verifyToken)(token);
        if (!payload) {
            return res.status(401).json({
                error: 'Invalid or expired token'
            });
        }
        // Get user's investments with product details
        const userInvestments = await db_1.db
            .select({
            id: schema_1.investments.id,
            amount: schema_1.investments.amount,
            investedAt: schema_1.investments.investedAt,
            status: schema_1.investments.status,
            expectedReturn: schema_1.investments.expectedReturn,
            maturityDate: schema_1.investments.maturityDate,
            product: {
                id: schema_1.investmentProducts.id,
                name: schema_1.investmentProducts.name,
                investmentType: schema_1.investmentProducts.investmentType,
                annualYield: schema_1.investmentProducts.annualYield,
                riskLevel: schema_1.investmentProducts.riskLevel,
                tenureMonths: schema_1.investmentProducts.tenureMonths,
            },
        })
            .from(schema_1.investments)
            .innerJoin(schema_1.investmentProducts, (0, drizzle_orm_1.eq)(schema_1.investments.productId, schema_1.investmentProducts.id))
            .where((0, drizzle_orm_1.eq)(schema_1.investments.userId, payload.userId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.investments.investedAt));
        // Calculate portfolio summary
        const totalInvested = userInvestments.reduce((sum, inv) => sum + Number(inv.amount), 0);
        const activeInvestments = userInvestments.filter((inv) => inv.status === 'active');
        const totalExpectedReturn = activeInvestments.reduce((sum, inv) => sum + Number(inv.expectedReturn || 0), 0);
        // Calculate risk distribution
        const riskDistribution = {};
        if (userInvestments.length > 0) {
            userInvestments.forEach((inv) => {
                const risk = inv.product?.riskLevel;
                if (risk) {
                    riskDistribution[risk] = (riskDistribution[risk] || 0) + Number(inv.amount);
                }
            });
        }
        // Calculate type distribution
        const typeDistribution = {};
        if (userInvestments.length > 0) {
            userInvestments.forEach((inv) => {
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
                ? userInvestments.reduce((sum, inv) => sum + Number(inv.product.annualYield), 0) / userInvestments.length
                : 0,
            riskDistribution,
            typeDistribution,
        };
        res.json({
            investments: userInvestments,
            portfolio: insights,
        });
    }
    catch (error) {
        console.error('Get investments error:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});
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
        const payload = (0, auth_1.verifyToken)(token);
        if (!payload) {
            return res.status(401).json({
                error: 'Invalid or expired token'
            });
        }
        const validatedData = investmentSchema.parse(req.body);
        // Get product details
        const product = await db_1.db
            .select()
            .from(schema_1.investmentProducts)
            .where((0, drizzle_orm_1.eq)(schema_1.investmentProducts.id, validatedData.productId))
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
        const result = await db_1.db.insert(schema_1.investments).values({
            userId: payload.userId,
            productId: validatedData.productId,
            amount: validatedData.amount,
            expectedReturn: expectedReturn,
            maturityDate: maturityDate,
        });
        // Get the created investment with its generated ID
        const createdInvestment = await db_1.db
            .select()
            .from(schema_1.investments)
            .where((0, drizzle_orm_1.eq)(schema_1.investments.userId, payload.userId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.investments.investedAt))
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
//# sourceMappingURL=investments.js.map
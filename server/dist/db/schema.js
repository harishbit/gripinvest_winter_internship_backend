"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionLogs = exports.investments = exports.investmentProducts = exports.users = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.users = (0, mysql_core_1.mysqlTable)('users', {
    id: (0, mysql_core_1.char)('id', { length: 36 }).primaryKey().default('(UUID())'),
    firstName: (0, mysql_core_1.varchar)('first_name', { length: 100 }).notNull(),
    lastName: (0, mysql_core_1.varchar)('last_name', { length: 100 }),
    email: (0, mysql_core_1.varchar)('email', { length: 255 }).notNull().unique(),
    passwordHash: (0, mysql_core_1.varchar)('password_hash', { length: 255 }).notNull(),
    riskAppetite: (0, mysql_core_1.mysqlEnum)('risk_appetite', ['low', 'moderate', 'high']).default('moderate'),
    createdAt: (0, mysql_core_1.datetime)('created_at').default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
    updatedAt: (0, mysql_core_1.datetime)('updated_at').default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});
exports.investmentProducts = (0, mysql_core_1.mysqlTable)('investment_products', {
    id: (0, mysql_core_1.char)('id', { length: 36 }).primaryKey().default('(UUID())'),
    name: (0, mysql_core_1.varchar)('name', { length: 255 }).notNull(),
    investmentType: (0, mysql_core_1.mysqlEnum)('investment_type', ['bond', 'fd', 'mf', 'etf', 'other']).notNull(),
    tenureMonths: (0, mysql_core_1.int)('tenure_months').notNull(),
    annualYield: (0, mysql_core_1.decimal)('annual_yield', { precision: 5, scale: 2 }).notNull(),
    riskLevel: (0, mysql_core_1.mysqlEnum)('risk_level', ['low', 'moderate', 'high']).notNull(),
    minInvestment: (0, mysql_core_1.decimal)('min_investment', { precision: 12, scale: 2 }).default('1000.00'),
    maxInvestment: (0, mysql_core_1.decimal)('max_investment', { precision: 12, scale: 2 }),
    description: (0, mysql_core_1.text)('description'),
    createdAt: (0, mysql_core_1.datetime)('created_at').default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
    updatedAt: (0, mysql_core_1.datetime)('updated_at').default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});
exports.investments = (0, mysql_core_1.mysqlTable)('investments', {
    id: (0, mysql_core_1.char)('id', { length: 36 }).primaryKey().default('(UUID())'),
    userId: (0, mysql_core_1.char)('user_id', { length: 36 }).notNull(),
    productId: (0, mysql_core_1.char)('product_id', { length: 36 }).notNull(),
    amount: (0, mysql_core_1.decimal)('amount', { precision: 12, scale: 2 }).notNull(),
    investedAt: (0, mysql_core_1.datetime)('invested_at').default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
    status: (0, mysql_core_1.mysqlEnum)('status', ['active', 'matured', 'cancelled']).default('active'),
    expectedReturn: (0, mysql_core_1.decimal)('expected_return', { precision: 12, scale: 2 }),
    maturityDate: (0, mysql_core_1.datetime)('maturity_date'),
});
exports.transactionLogs = (0, mysql_core_1.mysqlTable)('transaction_logs', {
    id: (0, mysql_core_1.bigint)('id', { mode: 'number' }).primaryKey().autoincrement(),
    userId: (0, mysql_core_1.char)('user_id', { length: 36 }),
    email: (0, mysql_core_1.varchar)('email', { length: 255 }),
    endpoint: (0, mysql_core_1.varchar)('endpoint', { length: 255 }).notNull(),
    httpMethod: (0, mysql_core_1.mysqlEnum)('http_method', ['GET', 'POST', 'PUT', 'DELETE']).notNull(),
    statusCode: (0, mysql_core_1.int)('status_code').notNull(),
    errorMessage: (0, mysql_core_1.text)('error_message'),
    createdAt: (0, mysql_core_1.datetime)('created_at').default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
});
//# sourceMappingURL=schema.js.map
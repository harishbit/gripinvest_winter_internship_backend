import { 
  mysqlTable, 
  char, 
  varchar, 
  text, 
  decimal, 
  int, 
  datetime, 
  bigint, 
  mysqlEnum,
  primaryKey 
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const users = mysqlTable('users', {
  id: char('id', { length: 36 }).primaryKey().default(sql`(UUID())`),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  riskAppetite: mysqlEnum('risk_appetite', ['low', 'moderate', 'high']).default('moderate'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

export const investmentProducts = mysqlTable('investment_products', {
  id: char('id', { length: 36 }).primaryKey().default(sql`(UUID())`),
  name: varchar('name', { length: 255 }).notNull(),
  investmentType: mysqlEnum('investment_type', ['bond', 'fd', 'mf', 'etf', 'other']).notNull(),
  tenureMonths: int('tenure_months').notNull(),
  annualYield: decimal('annual_yield', { precision: 5, scale: 2 }).notNull(),
  riskLevel: mysqlEnum('risk_level', ['low', 'moderate', 'high']).notNull(),
  minInvestment: decimal('min_investment', { precision: 12, scale: 2 }).default('1000'),
  maxInvestment: decimal('max_investment', { precision: 12, scale: 2 }),
  description: text('description'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

export const investments = mysqlTable('investments', {
  id: char('id', { length: 36 }).primaryKey().default(sql`(UUID())`),
  userId: char('user_id', { length: 36 }).notNull(),
  productId: char('product_id', { length: 36 }).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  investedAt: datetime('invested_at').default(sql`CURRENT_TIMESTAMP`),
  status: mysqlEnum('status', ['active', 'matured', 'cancelled']).default('active'),
  expectedReturn: decimal('expected_return', { precision: 12, scale: 2 }),
  maturityDate: datetime('maturity_date'),
});

export const transactionLogs = mysqlTable('transaction_logs', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  userId: char('user_id', { length: 36 }),
  email: varchar('email', { length: 255 }),
  endpoint: varchar('endpoint', { length: 255 }).notNull(),
  httpMethod: mysqlEnum('http_method', ['GET', 'POST', 'PUT', 'DELETE']).notNull(),
  statusCode: int('status_code').notNull(),
  errorMessage: text('error_message'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const passwordResetTokens = mysqlTable('password_reset_tokens', {
  id: char('id', { length: 36 }).primaryKey().default(sql`(UUID())`),
  email: varchar('email', { length: 255 }).notNull(),
  token: varchar('token', { length: 6 }).notNull(), // 6-digit code
  expiresAt: datetime('expires_at').notNull(),
  isUsed: mysqlEnum('is_used', ['0', '1']).default('0'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Relations
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type InvestmentProduct = typeof investmentProducts.$inferSelect;
export type NewInvestmentProduct = typeof investmentProducts.$inferInsert;
export type Investment = typeof investments.$inferSelect;
export type NewInvestment = typeof investments.$inferInsert;
export type TransactionLog = typeof transactionLogs.$inferSelect;
export type NewTransactionLog = typeof transactionLogs.$inferInsert;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert;

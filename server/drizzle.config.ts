import type { Config } from 'drizzle-kit';
import { config } from 'dotenv';

config();

const isProduction = process.env.NODE_ENV === 'production';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: isProduction ? {
    host: process.env.PROD_DB_HOST!,
    port: parseInt(process.env.PROD_DB_PORT || '3306'),
    user: process.env.PROD_DB_USER!,
    password: process.env.PROD_DB_PASSWORD!,
    database: process.env.PROD_DB_NAME!,
    ssl: { rejectUnauthorized: false },
  } : {
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
  },
} satisfies Config;


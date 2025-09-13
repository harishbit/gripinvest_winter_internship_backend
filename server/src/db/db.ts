import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' }); 

const isProduction = process.env.NODE_ENV === 'production';
const getConnectionConfig = () => {
  if (isProduction) {
    return {
      host: process.env.PROD_DB_HOST!,
      port: parseInt(process.env.PROD_DB_PORT || '3306'),
      user: process.env.PROD_DB_USER!,
      password: process.env.PROD_DB_PASSWORD!,
      database: process.env.PROD_DB_NAME!,
      ssl: { rejectUnauthorized: false },
      connectTimeout: 60000,
      connectionLimit: 10,
    };
  } else {
    return {
      host: process.env.DB_HOST!,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
      database: process.env.DB_NAME!,
      connectTimeout: 60000,
      connectionLimit: 10,
    };
  }
};

const connectionConfig = getConnectionConfig();
// For debuging.
// console.log('Database connection config:', {
//   ...connectionConfig,
//   password: '[REDACTED]',
//   environment: isProduction ? 'production' : 'development'
// });

// Create the MySQL connection pool
const connection = mysql.createPool(connectionConfig);

export const db = drizzle(connection, { schema, mode: 'default' });

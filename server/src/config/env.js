import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const ENV = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/syncboard',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'syncboard_jwt_super_secret_access_key_2026_dev',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'syncboard_jwt_super_secret_refresh_key_2026_dev',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  COOKIE_SECURE: process.env.COOKIE_SECURE === 'true',
  NODE_ENV: process.env.NODE_ENV || 'development'
};

if (!process.env.JWT_ACCESS_SECRET && ENV.NODE_ENV === 'production') {
  console.warn('WARNING: JWT_ACCESS_SECRET is using default value in production!');
}

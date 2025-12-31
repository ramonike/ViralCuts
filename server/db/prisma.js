import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const globalForPrisma = globalThis;

/**
 * Prisma error codes that indicate connection issues
 * P1001: Can't reach database server
 * P1002: Database server timed out
 */
const RETRYABLE_ERROR_CODES = ['P1001', 'P1002'];

/**
 * Checks if an error is a retryable Prisma connection error
 * @param {Error} error - The error to check
 * @returns {boolean} - True if the error is retryable
 */
export function isRetryableError(error) {
  if (!error) return false;
  
  // Check for Prisma error codes
  if (error.code && RETRYABLE_ERROR_CODES.includes(error.code)) {
    return true;
  }
  
  // Check error message for connection-related issues
  const message = error.message?.toLowerCase() || '';
  return (
    message.includes('connection refused') ||
    message.includes('timeout') ||
    message.includes('econnrefused') ||
    message.includes('etimedout') ||
    message.includes('can\'t reach database')
  );
}

/**
 * Connects to the database with retry logic and exponential backoff
 * @param {object} options - Configuration options
 * @param {number} options.maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} options.baseDelayMs - Base delay in milliseconds (default: 1000)
 * @param {number} options.maxDelayMs - Maximum delay in milliseconds (default: 10000)
 * @returns {Promise<void>}
 * @throws {Error} - Throws if all retry attempts fail
 */
export async function connectWithRetry(options = {}) {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 10000,
  } = options;

  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Test the connection with a simple query
      await prisma.$queryRaw`SELECT 1`;
      console.log(`Database connected successfully on attempt ${attempt}`);
      return;
    } catch (error) {
      lastError = error;
      const errorCode = error.code || 'UNKNOWN';
      const errorMessage = error.message || 'Unknown error';
      
      console.error(
        `Database connection attempt ${attempt}/${maxRetries} failed:`,
        `[${errorCode}] ${errorMessage}`
      );

      // Don't retry if it's not a retryable error
      if (!isRetryableError(error)) {
        console.error('Non-retryable error encountered, failing immediately');
        throw error;
      }

      // Don't wait after the last attempt
      if (attempt < maxRetries) {
        // Calculate delay with exponential backoff: baseDelay * 2^(attempt-1)
        const exponentialDelay = baseDelayMs * Math.pow(2, attempt - 1);
        const delay = Math.min(exponentialDelay, maxDelayMs);
        
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All retries exhausted
  const errorMessage = `Failed to connect to database after ${maxRetries} attempts`;
  console.error(errorMessage);
  
  const finalError = new Error(errorMessage);
  finalError.cause = lastError;
  finalError.code = lastError?.code || 'CONNECTION_FAILED';
  throw finalError;
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  
  // Create pg Pool for the adapter
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;

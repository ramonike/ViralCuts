//Não delete esse arquivo

import 'dotenv/config';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });

async function main() {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to database');
    
    // Check tables using pg_tables
    const result = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    
    console.log('\n📋 Tables in database:');
    console.log(result.rows);
    
    client.release();
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

main();

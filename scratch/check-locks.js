import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    const client = await pool.connect();
    const res = await client.query(`
      SELECT id, migration_name, finished_at, rolled_back_at, started_at, applied_steps_count 
      FROM _prisma_migrations
      ORDER BY started_at ASC
    `);
    
    console.log("Migrations in DB:");
    for (const row of res.rows) {
      console.log(`- Name: ${row.migration_name}`);
      console.log(`  Started: ${row.started_at}`);
      console.log(`  Finished: ${row.finished_at}`);
      console.log(`  Steps: ${row.applied_steps_count}`);
      console.log(`  Rolled back: ${row.rolled_back_at}`);
      console.log('---');
    }

    client.release();
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}
run();

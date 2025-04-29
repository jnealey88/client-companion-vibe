import { Pool, neonConfig } from '@neondatabase/serverless';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function applyMigration() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('Applying migration: 0001_add_website_url.sql');
    const migrationContent = await fs.readFile(
      path.join(__dirname, '../migrations/0001_add_website_url.sql'),
      'utf8'
    );
    
    await pool.query(migrationContent);
    console.log('Migration successfully applied!');
  } catch (error) {
    console.error('Error applying migration:', error);
  } finally {
    await pool.end();
  }
}

applyMigration();
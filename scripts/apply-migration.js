const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Applying migration: 0001_add_website_url.sql');
    const migrationContent = fs.readFileSync(
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
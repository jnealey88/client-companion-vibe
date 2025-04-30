// Script to apply schema changes for Replit Auth
import { pool } from '../server/db.js';

async function applySchemaChanges() {
  console.log('Applying schema changes for Replit Auth...');
  
  const client = await pool.connect();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    // Create sessions table
    console.log('Creating sessions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR(255) PRIMARY KEY,
        sess JSONB NOT NULL,
        expire TIMESTAMP NOT NULL
      )
    `);
    
    // Create index on expire column
    await client.query(`
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions (expire)
    `);
    
    // Check if users table exists
    const userExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users'
      )
    `);
    
    if (userExists.rows[0].exists) {
      // Drop the users table entirely (since we're in development)
      console.log('Dropping existing users table...');
      await client.query(`
        DROP TABLE IF EXISTS user_clients CASCADE;
        DROP TABLE IF EXISTS users CASCADE;
      `);
    }
    
    // Create new users table
    console.log('Creating new users table...');
    await client.query(`
      CREATE TABLE users (
        id VARCHAR(255) PRIMARY KEY NOT NULL,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        bio TEXT,
        profile_image_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create user_clients table
    console.log('Creating user_clients table...');
    await client.query(`
      CREATE TABLE user_clients (
        user_id VARCHAR(255) NOT NULL,
        client_id INTEGER NOT NULL,
        PRIMARY KEY (user_id, client_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
      )
    `);
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('Schema changes applied successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error applying schema changes:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Run the migration
applySchemaChanges()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
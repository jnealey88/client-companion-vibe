// Script to create the required tables for Replit Auth

import { pool } from '../server/db.js';

async function createReplitAuthTables() {
  console.log('Creating tables for Replit Auth...');
  
  try {
    const client = await pool.connect();
    
    try {
      // Start transaction
      await client.query('BEGIN');
      
      // Create sessions table
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
      
      // Recreate users table with new schema
      // First check if old table exists
      const userTableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'users'
        )
      `);
      
      if (userTableExists.rows[0].exists) {
        // Rename old table to backup
        await client.query(`ALTER TABLE users RENAME TO users_old`);
        
        // Create new users table
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
      } else {
        // Create new users table if it doesn't exist
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
      }
      
      // User clients table with string user_id
      const userClientsTableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'user_clients'
        )
      `);
      
      if (userClientsTableExists.rows[0].exists) {
        // Rename old table to backup
        await client.query(`ALTER TABLE user_clients RENAME TO user_clients_old`);
        
        // Create new user_clients table
        await client.query(`
          CREATE TABLE user_clients (
            user_id VARCHAR(255) NOT NULL,
            client_id INTEGER NOT NULL,
            PRIMARY KEY (user_id, client_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
          )
        `);
      } else {
        // Create new user_clients table if it doesn't exist
        await client.query(`
          CREATE TABLE user_clients (
            user_id VARCHAR(255) NOT NULL,
            client_id INTEGER NOT NULL,
            PRIMARY KEY (user_id, client_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
          )
        `);
      }
      
      // Commit transaction
      await client.query('COMMIT');
      console.log('Successfully created Replit Auth tables!');
    } catch (err) {
      // Rollback transaction in case of error
      await client.query('ROLLBACK');
      console.error('Error creating Replit Auth tables:', err);
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error connecting to database:', err);
    throw err;
  }
}

// Run the migration
createReplitAuthTables()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
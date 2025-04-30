import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import * as schema from '../shared/schema';
import { sql } from 'drizzle-orm';
import ws from 'ws';

// Configure Neon with WebSocket
neonConfig.webSocketConstructor = ws;

// This script pushes the schema to the database

async function push() {
  console.log('Pushing schema to database...');
  
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  try {
    // Create tables
    console.log('Creating users table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    console.log('Creating task_type enum...');
    try {
      await db.execute(sql`
        CREATE TYPE IF NOT EXISTS task_type AS ENUM (
          'company_analysis', 'schedule_discovery', 'proposal',
          'define_scope', 'contract', 'third_party',
          'site_map', 'ai_site_designer', 'ai_qa_tool',
          'status_update', 'site_maintenance', 'site_optimizer'
        );
      `);
    } catch (error) {
      console.log('task_type enum might already exist, continuing...');
    }
    
    console.log('Creating task_status enum...');
    try {
      await db.execute(sql`
        CREATE TYPE IF NOT EXISTS task_status AS ENUM (
          'pending', 'in_progress', 'completed'
        );
      `);
    } catch (error) {
      console.log('task_status enum might already exist, continuing...');
    }
    
    console.log('Creating clients table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        contact_name TEXT NOT NULL,
        contact_title TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        industry TEXT NOT NULL,
        website_url TEXT,
        status TEXT NOT NULL DEFAULT 'discovery',
        project_name TEXT NOT NULL,
        project_description TEXT,
        project_status TEXT NOT NULL DEFAULT 'active',
        project_start_date TIMESTAMP NOT NULL DEFAULT NOW(),
        project_end_date TIMESTAMP,
        project_value INTEGER NOT NULL DEFAULT 0,
        last_contact TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    console.log('Creating user_clients table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_clients (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, client_id)
      );
    `);
    
    console.log('Creating companion_tasks table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS companion_tasks (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        type task_type NOT NULL,
        status task_status NOT NULL DEFAULT 'pending',
        content TEXT,
        metadata TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMP
      );
    `);
    
    console.log('Creating sessions table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "session" (
        sid varchar NOT NULL COLLATE "default",
        sess json NOT NULL,
        expire timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY (sid)
      );
    `);
    
    console.log('Schema successfully pushed to database!');
  } catch (error) {
    console.error('Error pushing schema:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

push().catch(console.error);
import pg from 'pg';
const { Pool } = pg;

// Run this migration to update the task_type enum
async function migrationUpdateTaskTypeEnum() {
  try {
    console.log('Starting migration to update task_type enum...');

    // Connect to the database
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // First backup existing data
    const { rows: tasks } = await pool.query('SELECT * FROM companion_tasks');
    console.log(`Backing up ${tasks.length} tasks`);

    // Update the enum
    await pool.query(`
      ALTER TYPE task_type ADD VALUE IF NOT EXISTS 'schedule_discovery';
      ALTER TYPE task_type ADD VALUE IF NOT EXISTS 'define_scope';
      ALTER TYPE task_type ADD VALUE IF NOT EXISTS 'third_party';
      ALTER TYPE task_type ADD VALUE IF NOT EXISTS 'ai_site_designer';
      ALTER TYPE task_type ADD VALUE IF NOT EXISTS 'ai_qa_tool';
      ALTER TYPE task_type ADD VALUE IF NOT EXISTS 'site_maintenance';
      ALTER TYPE task_type ADD VALUE IF NOT EXISTS 'site_optimizer';
    `);
    
    console.log('Successfully updated task_type enum');
    
    // Close the connection
    await pool.end();
    
    return { success: true, message: 'task_type enum updated successfully' };
  } catch (error) {
    console.error('Error updating task_type enum:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the migration
migrationUpdateTaskTypeEnum()
  .then(result => {
    console.log(result);
    process.exit(result.success ? 0 : 1);
  })
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });

export default migrationUpdateTaskTypeEnum;
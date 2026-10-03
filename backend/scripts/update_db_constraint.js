process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_5NL7jcVQMkXH@ep-sparkling-thunder-b5gj9g0y-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require';
const pool = require('../src/config/database');

async function updateConstraint() {
  try {
    await pool.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;');
    await pool.query("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('seeker', 'provider', 'manager', 'admin', 'user'));");
    console.log('Database constraint updated successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to update constraint:', err);
    process.exit(1);
  }
}

updateConstraint();

// Apply Phase 2 migration to Supabase
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://neqvzxaabhvfureehakr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_qxAQVgb2hMyZWrwWti6q0w_LanWYXIo';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function applyMigration() {
  console.log('📦 Reading migration file...\n');

  const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250116000000_create_leads_system.sql');

  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    process.exit(1);
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  console.log('✅ Migration file loaded');
  console.log(`📊 SQL size: ${(migrationSQL.length / 1024).toFixed(2)} KB\n`);

  console.log('⚠️  IMPORTANT: This script cannot execute raw SQL with the anon key.');
  console.log('⚠️  You need to apply this migration manually.\n');

  console.log('📋 To apply the migration, follow these steps:\n');
  console.log('1. Open Supabase Studio:');
  console.log('   https://supabase.com/dashboard/project/neqvzxaabhvfureehakr\n');

  console.log('2. Navigate to:');
  console.log('   SQL Editor (left sidebar)\n');

  console.log('3. Click "New Query" and paste the contents of:');
  console.log('   supabase/migrations/20250116000000_create_leads_system.sql\n');

  console.log('4. Click "Run" to execute the migration\n');

  console.log('5. Verify the migration was successful by running:');
  console.log('   node test-migration.js\n');

  console.log('📄 Migration file location:');
  console.log(`   ${migrationPath}\n`);

  // Create a copy for easy access
  const copyPath = path.join(__dirname, 'MIGRATION_TO_APPLY.sql');
  fs.copyFileSync(migrationPath, copyPath);
  console.log('✅ Created copy for easy access:');
  console.log(`   ${copyPath}\n`);

  console.log('You can also open the file directly and copy-paste it into Supabase Studio.');
}

applyMigration();

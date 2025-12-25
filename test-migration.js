// Quick test to check if Phase 2 migration was applied
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://neqvzxaabhvfureehakr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_qxAQVgb2hMyZWrwWti6q0w_LanWYXIo';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testMigration() {
  console.log('🔍 Checking if Phase 2 tables exist...\n');

  const tests = [
    { table: 'leads', description: 'Leads table' },
    { table: 'api_keys', description: 'API Keys table' },
    { table: 'lead_activity_log', description: 'Lead Activity Log table' }
  ];

  const results = [];

  for (const test of tests) {
    try {
      const { data, error } = await supabase
        .from(test.table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ ${test.description}: NOT EXISTS`);
        console.log(`   Error: ${error.message}\n`);
        results.push({ ...test, exists: false, error: error.message });
      } else {
        console.log(`✅ ${test.description}: EXISTS`);
        results.push({ ...test, exists: true });
      }
    } catch (err) {
      console.log(`❌ ${test.description}: ERROR`);
      console.log(`   ${err.message}\n`);
      results.push({ ...test, exists: false, error: err.message });
    }
  }

  console.log('\n' + '='.repeat(50));
  const allExist = results.every(r => r.exists);

  if (allExist) {
    console.log('✅ ALL PHASE 2 TABLES EXIST!');
    console.log('Migration was successfully applied.');
  } else {
    console.log('❌ SOME TABLES ARE MISSING!');
    console.log('Migration needs to be applied.');
    console.log('\nTo apply the migration:');
    console.log('1. Open Supabase Studio at: https://neqvzxaabhvfureehakr.supabase.co');
    console.log('2. Go to SQL Editor');
    console.log('3. Copy/paste contents of: supabase/migrations/20250116000000_create_leads_system.sql');
    console.log('4. Run the script');
  }
  console.log('='.repeat(50));

  process.exit(allExist ? 0 : 1);
}

testMigration();

const { readFileSync } = require('fs');
const path = require('path');

// Read the new migration file
const migrationFile = path.join(__dirname, 'supabase', 'migrations', '20250107000000_fix_api_keys_schema.sql');

try {
  const migrationSQL = readFileSync(migrationFile, 'utf8');
  
  console.log('📦 API Keys Schema Fix Migration:');
  console.log('====================================');
  console.log('');
  console.log('⚠️  APPLY THIS IN SUPABASE STUDIO SQL EDITOR:');
  console.log('');
  console.log(migrationSQL);
  console.log('');
  console.log('====================================');
  console.log('🎯 This will add the missing key_last_four column to api_keys table');
  console.log('📍 Go to: https://supabase.com/dashboard/project/neqvzxaabhvfureehakr');
  console.log('📝 Navigate to SQL Editor and run the above SQL');
  
} catch (error) {
  console.error('❌ Error reading migration file:', error.message);
}
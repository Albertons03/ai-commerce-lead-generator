// Check API key in database
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const SUPABASE_URL = 'https://neqvzxaabhvfureehakr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_qxAQVgb2hMyZWrwWti6q0w_LanWYXIo';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const testKey = 'sk_live_lXlnCdk5555uSQxE_Iu-OK62shpND290JnZUrc_6bt0';

async function checkApiKey() {
  console.log('🔍 Checking API key in database...\n');

  // Fetch all API keys
  const { data: apiKeys, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('is_active', true);

  if (error) {
    console.error('❌ Error fetching API keys:', error);
    return;
  }

  console.log(`✅ Found ${apiKeys.length} active API keys\n`);

  if (apiKeys.length === 0) {
    console.log('⚠️  No API keys found!');
    return;
  }

  // Display all keys
  apiKeys.forEach((key, i) => {
    console.log(`Key ${i + 1}:`);
    console.log(`  ID: ${key.id}`);
    console.log(`  Name: ${key.name}`);
    console.log(`  Prefix: ${key.key_prefix}`);
    console.log(`  Last 4: ${key.key_last_four}`);
    console.log(`  Hash: ${key.key_hash.substring(0, 20)}...`);
    console.log(`  Active: ${key.is_active}`);
    console.log('');
  });

  // Test the key
  console.log('🔐 Testing API key:', testKey);
  console.log('');

  let matchFound = false;
  for (const record of apiKeys) {
    const isMatch = await bcrypt.compare(testKey, record.key_hash);
    console.log(`  Comparing with "${record.name}": ${isMatch ? '✅ MATCH!' : '❌ No match'}`);
    if (isMatch) {
      matchFound = true;
      console.log('\n✅ API KEY VALID!');
      console.log(`  Matched with: ${record.name}`);
      console.log(`  Organization ID: ${record.organization_id}`);
    }
  }

  if (!matchFound) {
    console.log('\n❌ NO MATCH FOUND!');
    console.log('');
    console.log('⚠️  The API key does not match any hash in the database.');
    console.log('This could mean:');
    console.log('  1. The key was not saved correctly');
    console.log('  2. The hash was not generated correctly');
    console.log('  3. The key has been modified');
  }
}

checkApiKey();

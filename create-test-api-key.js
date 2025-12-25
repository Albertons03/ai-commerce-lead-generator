// Create test API key directly in database
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const SUPABASE_URL = 'https://neqvzxaabhvfureehakr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_qxAQVgb2hMyZWrwWti6q0w_LanWYXIo';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createTestApiKey() {
  console.log('🔑 Creating test API key...\n');

  // Step 1: Get your organization ID
  console.log('📋 Step 1: Fetch organizations');
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .limit(5);

  if (orgError || !orgs || orgs.length === 0) {
    console.error('❌ No organizations found. Please create one first.');
    console.error('Error:', orgError);
    return;
  }

  console.log('✅ Found organizations:');
  orgs.forEach((org, i) => {
    console.log(`   ${i + 1}. ${org.name} (${org.slug}) - ID: ${org.id}`);
  });

  const orgId = orgs[0].id;
  console.log(`\n📌 Using organization: ${orgs[0].name}\n`);

  // Step 2: Generate API key
  console.log('🔐 Step 2: Generate API key');
  const randomBytes = crypto.randomBytes(32);
  const key = `sk_live_${randomBytes.toString('base64url')}`;
  const prefix = key.substring(0, 12);
  const lastFour = key.slice(-4);

  console.log(`✅ Generated key: ${prefix}...${lastFour}`);
  console.log(`   Full key: ${key}\n`);

  // Step 3: Hash the key
  console.log('🔒 Step 3: Hash the key');
  const hash = await bcrypt.hash(key, 10);
  console.log(`✅ Key hashed\n`);

  // Step 4: Insert into database (will fail with anon key, but shows SQL)
  console.log('💾 Step 4: Insert into database');
  console.log('⚠️  This will likely fail with anon key. Use Supabase SQL Editor instead:\n');

  const insertSQL = `
INSERT INTO public.api_keys (
  organization_id,
  name,
  key_hash,
  key_prefix,
  key_last_four,
  is_active,
  rate_limit_per_minute,
  usage_count
) VALUES (
  '${orgId}',
  'Test API Key',
  '${hash}',
  '${prefix}',
  '${lastFour}',
  true,
  60,
  0
) RETURNING id;
`;

  console.log('📝 SQL to run in Supabase Studio:');
  console.log('='.repeat(80));
  console.log(insertSQL);
  console.log('='.repeat(80));

  console.log('\n📋 INSTRUCTIONS:');
  console.log('1. Open Supabase Studio: https://supabase.com/dashboard/project/neqvzxaabhvfureehakr');
  console.log('2. Go to SQL Editor');
  console.log('3. Copy-paste the SQL above');
  console.log('4. Run the query');
  console.log('\n🔑 YOUR API KEY (save this!):');
  console.log('='.repeat(80));
  console.log(key);
  console.log('='.repeat(80));

  // Try to insert (will probably fail but let's try)
  console.log('\n🔄 Attempting to insert (may fail with RLS)...');
  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      organization_id: orgId,
      name: 'Test API Key',
      key_hash: hash,
      key_prefix: prefix,
      key_last_four: lastFour,
      is_active: true,
      rate_limit_per_minute: 60,
      usage_count: 0,
    })
    .select()
    .single();

  if (error) {
    console.log('❌ Failed to insert (expected with anon key)');
    console.log('   Error:', error.message);
    console.log('\n✅ Use the SQL query above in Supabase Studio instead!');
  } else {
    console.log('✅ SUCCESS! API key created in database!');
    console.log('   Key ID:', data.id);
  }
}

createTestApiKey();

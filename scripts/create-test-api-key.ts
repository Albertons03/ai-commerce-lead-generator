/**
 * =====================================================
 * Create Test API Key Script
 * =====================================================
 * This script creates a test API key for development and testing.
 *
 * Usage:
 *   npx ts-node scripts/create-test-api-key.ts
 *
 * Requirements:
 *   - Valid Supabase credentials in .env.local
 *   - Organization ID and User ID
 *   - bcryptjs installed
 * =====================================================
 */

import * as crypto from 'crypto';

// Note: In a real implementation, you would import these
// For now, this is a reference implementation
async function createTestApiKey() {
  console.log('🔑 Creating Test API Key...\n');

  // Generate a random API key
  const randomBytes = crypto.randomBytes(32).toString('hex');
  const rawKey = `sk_test_${randomBytes}`;

  console.log('Generated API Key (SAVE THIS - shown only once):');
  console.log('─'.repeat(80));
  console.log(rawKey);
  console.log('─'.repeat(80));
  console.log('\n');

  // Instructions for manual insertion
  console.log('📝 Manual Setup Instructions:\n');
  console.log('1. Install bcryptjs if not already installed:');
  console.log('   npm install bcryptjs @types/bcryptjs\n');

  console.log('2. Hash the API key using bcryptjs:\n');
  console.log('   In Node.js REPL or separate script:');
  console.log('   ');
  console.log('   const bcrypt = require("bcryptjs");');
  console.log(`   const hash = await bcrypt.hash("${rawKey}", 10);`);
  console.log('   console.log(hash);\n');

  console.log('3. Insert into database using Supabase SQL Editor:\n');
  console.log('   INSERT INTO api_keys (');
  console.log('     organization_id,');
  console.log('     name,');
  console.log('     key_prefix,');
  console.log('     key_hash,');
  console.log('     is_active,');
  console.log('     allowed_domains,');
  console.log('     rate_limit_per_minute,');
  console.log('     created_by');
  console.log('   ) VALUES (');
  console.log('     \'YOUR_ORG_ID_HERE\',  -- Replace with actual organization ID');
  console.log('     \'Test API Key\',');
  console.log(`     '${rawKey.substring(0, 8)}',`);
  console.log('     \'YOUR_BCRYPT_HASH_HERE\',  -- Replace with bcrypt hash from step 2');
  console.log('     true,');
  console.log('     ARRAY[\'*\'],  -- Allow all domains for testing');
  console.log('     10,');
  console.log('     \'YOUR_USER_ID_HERE\'  -- Replace with actual user ID');
  console.log('   );\n');

  console.log('4. Test the API key:\n');
  console.log('   curl -X POST http://localhost:3000/api/public/leads \\');
  console.log('     -H "Content-Type: application/json" \\');
  console.log(`     -H "X-API-Key: ${rawKey}" \\`);
  console.log('     -d \'{"name":"Test Lead","email":"test@example.com"}\'\n');

  console.log('⚠️  Security Notes:');
  console.log('   - This is a TEST key - do not use in production');
  console.log('   - Store the raw key securely (e.g., in .env.local)');
  console.log('   - Never commit API keys to version control');
  console.log('   - Rotate keys regularly in production\n');
}

// Alternative: Automated version (requires setup)
async function createApiKeyAutomated() {
  console.log('🤖 Automated API Key Creation\n');
  console.log('This requires:');
  console.log('1. bcryptjs installed: npm install bcryptjs');
  console.log('2. Valid SUPABASE_SERVICE_ROLE_KEY in .env.local');
  console.log('3. Organization ID and User ID\n');

  console.log('Example code:\n');
  console.log('```typescript');
  console.log('import bcrypt from "bcryptjs";');
  console.log('import { createAdminSupabaseClient } from "@/lib/supabase/client";');
  console.log('');
  console.log('async function createApiKey(organizationId: string, userId: string) {');
  console.log('  // Generate API key');
  console.log('  const randomBytes = require("crypto").randomBytes(32).toString("hex");');
  console.log('  const rawKey = `sk_test_${randomBytes}`;');
  console.log('  ');
  console.log('  // Hash with bcrypt');
  console.log('  const keyHash = await bcrypt.hash(rawKey, 10);');
  console.log('  ');
  console.log('  // Insert into database');
  console.log('  const supabase = createAdminSupabaseClient();');
  console.log('  const { data, error } = await supabase');
  console.log('    .from("api_keys")');
  console.log('    .insert({');
  console.log('      organization_id: organizationId,');
  console.log('      name: "Test API Key",');
  console.log('      key_prefix: rawKey.substring(0, 8),');
  console.log('      key_hash: keyHash,');
  console.log('      is_active: true,');
  console.log('      allowed_domains: ["*"],');
  console.log('      rate_limit_per_minute: 10,');
  console.log('      created_by: userId,');
  console.log('    })');
  console.log('    .select()');
  console.log('    .single();');
  console.log('  ');
  console.log('  if (error) throw error;');
  console.log('  ');
  console.log('  console.log("✅ API Key created!");');
  console.log('  console.log("Raw Key:", rawKey);');
  console.log('  console.log("Key ID:", data.id);');
  console.log('  ');
  console.log('  return rawKey;');
  console.log('}');
  console.log('```\n');
}

// Quick bcrypt hash generator
async function generateBcryptHash() {
  console.log('🔐 Bcrypt Hash Generator\n');
  console.log('Quick way to hash an API key:\n');
  console.log('```javascript');
  console.log('// In Node.js REPL (run: node)');
  console.log('const bcrypt = require("bcryptjs");');
  console.log('');
  console.log('// Hash your API key');
  console.log('bcrypt.hash("YOUR_API_KEY_HERE", 10).then(hash => {');
  console.log('  console.log("Hash:", hash);');
  console.log('});');
  console.log('');
  console.log('// Or using async/await in a script:');
  console.log('const hash = await bcrypt.hash("YOUR_API_KEY_HERE", 10);');
  console.log('console.log(hash);');
  console.log('```\n');
}

// Main execution
async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║       Test API Key Generator for Lead Capture API        ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  // Generate test key
  await createTestApiKey();

  console.log('\n' + '═'.repeat(80) + '\n');

  // Show automated option
  await createApiKeyAutomated();

  console.log('\n' + '═'.repeat(80) + '\n');

  // Show bcrypt helper
  await generateBcryptHash();

  console.log('\n✨ Done! Follow the instructions above to set up your test API key.\n');
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { createTestApiKey, createApiKeyAutomated, generateBcryptHash };

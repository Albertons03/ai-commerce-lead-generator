/**
 * Script to create test data for the application
 * Run this after setting up the database
 */

import { createClient } from "@supabase/supabase-js";

// Environment variables
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestData() {
  console.log("🚀 Creating test data...");

  try {
    // 1. Create test user (if not exists)
    const testEmail = "test@example.com";
    let userId = null;

    // Try to find existing user
    const { data: existingUsers } = await supabase
      .from("users")
      .select("id")
      .eq("email", testEmail);

    if (existingUsers?.length) {
      userId = existingUsers[0].id;
      console.log("✅ Using existing test user:", userId);
    } else {
      // Create test user
      const { data: newUser, error: userError } = await (supabase
        .from("users")
        .insert as any)([
          {
            email: testEmail,
            name: "Test User",
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (userError) {
        console.error("❌ Failed to create user:", userError);
        return;
      }

      userId = newUser.id;
      console.log("✅ Created test user:", userId);
    }

    // 2. Create test organization
    const orgSlug = "alibabaa";
    let orgId = null;

    // Check if organization exists
    const { data: existingOrgs } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", orgSlug);

    if (existingOrgs?.length) {
      orgId = existingOrgs[0].id;
      console.log("✅ Using existing organization:", orgId);
    } else {
      // Create organization
      const { data: newOrg, error: orgError } = await (supabase
        .from("organizations")
        .insert as any)([
          {
            name: "Alibaba Test Store",
            slug: orgSlug,
            created_by: userId,
            metadata: {
              description: "Test e-commerce store for AI chatbot",
              industry: "E-commerce",
              website: "https://alibaba-test.com",
            },
          },
        ])
        .select()
        .single();

      if (orgError) {
        console.error("❌ Failed to create organization:", orgError);
        return;
      }

      orgId = newOrg.id;
      console.log("✅ Created organization:", orgId, orgSlug);
    }

    // 3. Create organization membership
    const { data: existingMembership } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", orgId)
      .eq("user_id", userId);

    if (!existingMembership?.length) {
      const { error: memberError } = await (supabase
        .from("organization_members")
        .insert as any)([
          {
            organization_id: orgId,
            user_id: userId,
            role: "owner",
          },
        ]);

      if (memberError) {
        console.error("❌ Failed to create membership:", memberError);
        return;
      }

      console.log("✅ Created organization membership");
    }

    // 4. Create sample conversation
    const { data: conversation, error: convError } = await (supabase
      .from("conversations")
      .insert as any)([
        {
          organization_id: orgId,
          status: "active",
          visitor_metadata: {
            user_agent: "Test User Agent",
            page_url: "http://localhost:3001/test",
            referrer: null,
            ip_address: "127.0.0.1",
          },
          metadata: {
            test_conversation: true,
          },
        },
      ])
      .select()
      .single();

    if (convError) {
      console.error("❌ Failed to create conversation:", convError);
      return;
    }

    console.log("✅ Created test conversation:", conversation.id);

    // 5. Create sample products (if products table exists)
    try {
      const { data: products, error: productError } = await (supabase
        .from("products")
        .insert as any)([
          {
            organization_id: orgId,
            name: "Dell Latitude 5520 Laptop",
            description:
              "Professional business laptop with Intel i5 processor, 8GB RAM, 256GB SSD",
            price: 899.99,
            category: "Laptops",
            metadata: {
              brand: "Dell",
              processor: "Intel i5",
              ram: "8GB",
              storage: "256GB SSD",
              screen_size: "15.6 inch",
            },
            is_active: true,
          },
          {
            organization_id: orgId,
            name: "HP EliteBook 840 G8",
            description:
              "Ultra-portable business laptop with AMD Ryzen 7, 16GB RAM, 512GB SSD",
            price: 1199.99,
            category: "Laptops",
            metadata: {
              brand: "HP",
              processor: "AMD Ryzen 7",
              ram: "16GB",
              storage: "512GB SSD",
              screen_size: "14 inch",
            },
            is_active: true,
          },
          {
            organization_id: orgId,
            name: "Logitech MX Master 3 Mouse",
            description:
              "Advanced wireless mouse with precision tracking and customizable buttons",
            price: 99.99,
            category: "Accessories",
            metadata: {
              brand: "Logitech",
              type: "Wireless Mouse",
              connectivity: "Bluetooth/USB",
            },
            is_active: true,
          },
        ])
        .select();

      if (!productError && products?.length) {
        console.log(`✅ Created ${products.length} sample products`);
      }
    } catch (error) {
      console.log("⚠️  Products table might not exist yet (Phase 3B)");
    }

    console.log("\n🎉 Test data creation completed!");
    console.log("📋 Summary:");
    console.log(`   - User ID: ${userId}`);
    console.log(`   - Organization: ${orgId} (${orgSlug})`);
    console.log(`   - Conversation: ${conversation.id}`);
    console.log("\n🔗 URLs to test:");
    console.log(`   - Dashboard: http://localhost:3001/${orgSlug}`);
    console.log(`   - Chatbot: http://localhost:3001/${orgSlug}/chatbot`);
    console.log(`   - Leads: http://localhost:3001/${orgSlug}/leads`);
  } catch (error) {
    console.error("❌ Failed to create test data:", error);
  }
}

// Run the script
if (require.main === module) {
  createTestData()
    .then(() => {
      console.log("✅ Script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script failed:", error);
      process.exit(1);
    });
}

export default createTestData;

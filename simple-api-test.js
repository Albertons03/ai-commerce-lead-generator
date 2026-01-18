// const fetch = require('node-fetch'); // Built-in fetch in Node.js 18+

async function testSimpleAPI() {
  console.log("🔍 Testing simple API endpoints...");

  // Test main page
  try {
    const response = await fetch("http://localhost:3000");
    console.log(`✅ Main page: Status ${response.status}`);
  } catch (error) {
    console.log(`❌ Main page error: ${error.message}`);
  }

  // Test API health (if exists)
  try {
    const response = await fetch("http://localhost:3000/api/test");
    console.log(`✅ API test: Status ${response.status}`);
  } catch (error) {
    console.log(`❌ API test error: ${error.message}`);
  }

  // Test conversations API
  try {
    const response = await fetch("http://localhost:3000/api/conversations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        organization_id: "9677edeb-0ac8-45e8-b2bc-c389cc99fac0",
        visitor_metadata: { test: true },
      }),
    });
    const data = await response.json();
    console.log(`✅ Conversations API: Status ${response.status}`);
    console.log(`📄 Response:`, JSON.stringify(data, null, 2));
  } catch (error) {
    console.log(`❌ Conversations API error: ${error.message}`);
  }
}

testSimpleAPI();

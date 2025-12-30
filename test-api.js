// No node-fetch import needed - use built-in fetch

async function testConversationsAPI() {
  try {
    console.log("🧪 Testing Phase 3C - Conversations API...");

    const response = await fetch("http://localhost:3000/api/conversations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        organization_id: "9677edeb-0ac8-45e8-b2bc-c389cc99fac0",
        visitor_metadata: {
          test: true,
          page: "node-test",
        },
      }),
    });

    const data = await response.json();

    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log("✅ Phase 3C Test SUCCESSFUL!");
      return data;
    } else {
      console.log("❌ Phase 3C Test FAILED!");
      return null;
    }
  } catch (error) {
    console.error("❌ Error testing API:", error.message);
    return null;
  }
}

testConversationsAPI();

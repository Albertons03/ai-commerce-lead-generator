# Phase 2 - Manual Testing Checklist

## ✅ Database Migration Status
- [x] Tables created (leads, api_keys, lead_activity_log)
- [x] Enum types created (lead_status, lead_source)
- [x] RLS policies applied
- [x] Indexes created
- [x] Triggers configured

## 🧪 Testing Steps

### 1. User Authentication & Organization Setup
**URL:** http://localhost:3000/login

- [ ] Login with existing user OR signup with new user
- [ ] Verify redirect to organization selection/creation
- [ ] Create organization if needed
- [ ] Verify dashboard loads successfully

### 2. API Keys Management
**URL:** http://localhost:3000/[orgSlug]/settings/api-keys

- [ ] Navigate to Settings > API Keys
- [ ] Click "Generate New API Key"
- [ ] Copy the generated API key (starts with `sk_live_` or `sk_test_`)
- [ ] Verify key is displayed in the list (masked)
- [ ] Note: Save this key for testing the Public API!

**Expected UI Elements:**
- API key list table
- "Generate New API Key" button
- Key prefix visible (e.g., `sk_live_abc***xyz`)
- Revoke button for each key
- Created date
- Last used timestamp

### 3. Leads Dashboard Integration
**URL:** http://localhost:3000/[orgSlug]

- [ ] Verify dashboard shows lead statistics cards:
  - Total Leads
  - New Leads (this week)
  - Average Lead Score
  - Conversion Rate
- [ ] All cards should show "0" if no leads exist yet
- [ ] No errors in console

### 4. Leads List Page
**URL:** http://localhost:3000/[orgSlug]/leads

- [ ] Page loads without errors
- [ ] Empty state displayed if no leads (with call-to-action)
- [ ] Filters UI visible:
  - Status filter (new, contacted, qualified, converted, lost)
  - Source filter (chatbot, manual, import, web_form, referral)
  - Date range picker
  - Search box
- [ ] Pagination controls visible (even if disabled)

**If leads exist:**
- [ ] Table displays lead data correctly
- [ ] Status badges show correct colors
- [ ] Lead score badges visible
- [ ] Clicking a row navigates to lead detail
- [ ] Sorting works on columns
- [ ] Filters update the list

### 5. Public Lead Capture API
**Endpoint:** `POST http://localhost:3000/api/public/leads`

**Using curl:**
```bash
curl -X POST http://localhost:3000/api/public/leads \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY_HERE" \
  -d '{
    "name": "Test Lead",
    "email": "test@example.com",
    "phone": "+1234567890",
    "company": "Test Company",
    "source": "chatbot",
    "metadata": {
      "campaign": "winter-sale",
      "referrer": "google"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Test Lead",
    "email": "test@example.com"
  }
}
```

**Test Cases:**
- [ ] Valid lead creation returns 201
- [ ] Missing API key returns 401
- [ ] Invalid API key returns 401
- [ ] Missing required fields (name, email) returns 400
- [ ] Duplicate email (within 24h) returns 409
- [ ] Rate limiting works (>10 requests/min returns 429)

### 6. Lead Detail Page
**URL:** http://localhost:3000/[orgSlug]/leads/[leadId]

After creating a lead via API:
- [ ] Navigate to lead detail page
- [ ] Contact information displayed correctly
- [ ] Status badge visible
- [ ] Lead score displayed
- [ ] Metadata section shows custom fields
- [ ] Activity timeline visible (should show "Lead created" entry)
- [ ] Edit lead button works (if implemented)

### 7. Internal Leads API (Authenticated)
**Requires:** Valid session cookie (login first)

**GET /api/leads** - List leads
```bash
curl http://localhost:3000/api/leads?organization_id=YOUR_ORG_ID \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

**GET /api/leads/[id]** - Get single lead
```bash
curl http://localhost:3000/api/leads/LEAD_ID?organization_id=YOUR_ORG_ID \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

**PATCH /api/leads/[id]** - Update lead
```bash
curl -X PATCH http://localhost:3000/api/leads/LEAD_ID?organization_id=YOUR_ORG_ID \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -H "Content-Type: application/json" \
  -d '{"status": "qualified", "lead_score": 85}'
```

**GET /api/leads/stats** - Lead statistics
```bash
curl http://localhost:3000/api/leads/stats?organization_id=YOUR_ORG_ID \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

**POST /api/leads/export** - Export leads to CSV
```bash
curl -X POST http://localhost:3000/api/leads/export?organization_id=YOUR_ORG_ID \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -H "Content-Type: application/json" \
  -d '{"filters": {"status": ["new", "qualified"]}}' \
  --output leads.csv
```

### 8. API Keys Management API
**Requires:** Valid session cookie

**GET /api/api-keys** - List API keys
```bash
curl http://localhost:3000/api/api-keys?organization_id=YOUR_ORG_ID \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

**POST /api/api-keys** - Generate new key
```bash
curl -X POST http://localhost:3000/api/api-keys?organization_id=YOUR_ORG_ID \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -H "Content-Type: application/json" \
  -d '{"name": "Production API Key", "environment": "production"}'
```

**DELETE /api/api-keys/[id]** - Revoke key
```bash
curl -X DELETE http://localhost:3000/api/api-keys/KEY_ID?organization_id=YOUR_ORG_ID \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

## 🐛 Common Issues & Solutions

### Issue: "Organization ID required"
**Solution:** Ensure you're logged in and have selected/created an organization

### Issue: "API key not found" or "Invalid API key"
**Solution:**
1. Go to Settings > API Keys
2. Generate a new API key
3. Use the full key (including `sk_live_` prefix)

### Issue: Empty state persists after creating lead
**Solution:**
1. Refresh the page
2. Check browser console for errors
3. Verify lead was created in database

### Issue: Rate limit errors (429)
**Solution:** Wait 1 minute before retrying

### Issue: CORS errors on Public API
**Solution:**
1. Check API key's `allowed_domains` configuration
2. Ensure request includes proper headers
3. Test from same origin first (http://localhost:3000)

## 📊 Success Criteria

Phase 2 is complete when:
- ✅ All database tables exist and are accessible
- ✅ User can generate and manage API keys
- ✅ Public Lead Capture API accepts leads
- ✅ Leads appear in the dashboard list
- ✅ Lead detail page displays all information
- ✅ Lead statistics show on dashboard
- ✅ All CRUD operations work
- ✅ No console errors on any page
- ✅ Rate limiting functions correctly
- ✅ Export to CSV works

## 🚀 Ready for Phase 3?

Once all checkboxes are marked, Phase 2 is complete and we can move to:

**Phase 3 - AI Chatbot:**
- Public embeddable chat endpoint
- Conversation storage
- OpenAI integration
- Product-aware responses
- Lead capture triggers

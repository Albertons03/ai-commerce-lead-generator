# Phase 3: AI-Powered E-commerce Chatbot 🤖

> **Build in Public Series** - Follow our journey building a production-grade RAG chatbot

## 🎯 What We're Building

An intelligent chatbot system that helps e-commerce businesses convert website visitors into qualified leads through AI-powered conversations. The chatbot understands your product catalog and provides accurate, helpful recommendations without hallucinations.

## 🏗️ Architecture Overview

```
User Message
    ↓
Vector Search (pgvector)
    ↓
Retrieve Relevant Products
    ↓
Assemble Context + Prompt
    ↓
OpenAI GPT-4
    ↓
Store Response + Detect Leads
    ↓
Return Answer
```

## 🔑 Key Features

- **🎯 Zero Hallucinations**: AI only recommends real products from your catalog
- **🔍 Semantic Search**: Vector embeddings enable natural language product discovery
- **📊 Lead Scoring**: AI automatically scores conversation quality (0-100)
- **💬 Context-Aware**: Maintains conversation history for coherent multi-turn chats
- **🏢 Multi-Tenant**: Complete data isolation per organization
- **📈 Traceable**: Every AI response linked to specific products and reasoning

## 🛠️ Technology Stack

- **Vector Database**: PostgreSQL + pgvector (cosine similarity)
- **Embeddings**: OpenAI text-embedding-3-small (1536 dimensions)
- **Chat Model**: GPT-4 Turbo
- **Storage**: Supabase (PostgreSQL)
- **Framework**: Next.js 14 (TypeScript)

## 📅 Implementation Phases

### ✅ Phase A: Database & Vector Setup (4-6 hours)
- Enable pgvector extension
- Create vector storage tables
- Build similarity search functions
- Set up RLS policies

**Status**: 🟡 In Progress
**Doc**: [Phase A Guide](./PHASE_3A_DATABASE_SETUP.md)

### 🔜 Phase B: Product Training Endpoint (8-10 hours)
- OpenAI embedding generation
- Batch processing pipeline
- Product catalog management API

**Status**: ⏳ Not Started
**Doc**: Coming soon

### 🔜 Phase C: Chat Storage Layer (4-5 hours)
- Conversation persistence
- Message sequencing
- Session management

**Status**: ⏳ Not Started
**Doc**: Coming soon

### 🔜 Phase D: RAG Chat API (12-15 hours)
- Vector similarity search
- Prompt assembly pipeline
- OpenAI chat integration
- Response formatting

**Status**: ⏳ Not Started
**Doc**: Coming soon

### 🔜 Phase E: Lead Capture & Scoring (6-8 hours)
- Trigger detection
- AI-based scoring
- Automatic lead creation

**Status**: ⏳ Not Started
**Doc**: Coming soon

## 📊 Success Metrics

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| Vector Search Speed | < 100ms | Users expect instant responses |
| Chat Response Time | < 2s | Conversation flow feels natural |
| RAG Retrieval Accuracy | > 85% | Recommendations must be relevant |
| Lead Detection Recall | > 85% | Don't miss potential customers |
| Zero Hallucinations | 100% | Trust is critical for commerce |

## 🎓 Learning Resources

- [What is RAG?](https://www.pinecone.io/learn/retrieval-augmented-generation/)
- [pgvector Guide](https://github.com/pgvector/pgvector)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
- [Vector Similarity Search](https://www.pinecone.io/learn/vector-similarity/)

## 🔗 Repository Structure

```
/docs
  ├── PHASE_3_README.md          ← You are here
  ├── PHASE_3A_DATABASE_SETUP.md ← Database setup guide
  └── ... (more guides coming)

/supabase/migrations
  └── 20250117000000_create_chatbot_system.sql

/app/api
  ├── /train-bot    ← Product training endpoint
  └── /chat         ← RAG chat endpoint

/lib/ai
  ├── openai-client.ts      ← OpenAI SDK wrapper
  ├── embedding-service.ts  ← Embedding generation
  ├── rag-service.ts        ← Vector search
  ├── prompt-builder.ts     ← Prompt assembly
  └── lead-scorer.ts        ← AI lead scoring
```

## 🚀 Quick Start

**Prerequisites**:
- Supabase project with PostgreSQL 14+
- OpenAI API key
- Node.js 18+

**Setup**:
```bash
# Install dependencies
npm install openai uuid

# Set environment variables
OPENAI_API_KEY=sk-...
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_CHAT_MODEL=gpt-4-turbo-preview

# Run Phase A migration
npx supabase db push
```

## 💡 Why This Approach?

### Why PostgreSQL + pgvector instead of Pinecone/Weaviate?

**Pros**:
- ✅ No additional service to manage
- ✅ Native SQL queries with vector search
- ✅ Same database for all data (vectors + conversations + leads)
- ✅ RLS policies enforce multi-tenancy
- ✅ Lower cost (no separate vector DB subscription)

**Cons**:
- ❌ Slightly slower than specialized vector DBs (but < 100ms is acceptable)
- ❌ Limited to ~1M vectors per table (sufficient for most use cases)

### Why OpenAI Embeddings instead of open-source?

**Pros**:
- ✅ Best-in-class quality (1536 dimensions)
- ✅ Fast API response (< 200ms)
- ✅ Same vendor as chat model (consistency)
- ✅ Cost-effective ($0.00002 per 1K tokens)

**Cons**:
- ❌ Vendor lock-in (but embeddings are portable)
- ❌ Requires internet connection

### Why GPT-4 Turbo instead of GPT-3.5?

**Pros**:
- ✅ Better reasoning (fewer hallucinations)
- ✅ Longer context window (128K tokens)
- ✅ Follows instructions more reliably

**Cons**:
- ❌ Higher cost (~10x vs GPT-3.5)
- ❌ Slightly slower response

**Strategy**: Use GPT-4 for production, GPT-3.5 for high-volume scenarios

## 📈 Estimated Costs (per 1,000 conversations)

| Component | Cost | Notes |
|-----------|------|-------|
| Embeddings (training) | $0.02 | One-time per product |
| Chat completions | $3.00 | GPT-4 Turbo ($0.01/1K input, $0.03/1K output) |
| Vector search | $0.00 | Included in Supabase |
| **Total** | **~$3.00** | Scales linearly |

**ROI**: If 10% of conversations convert to leads worth $50 each → $5,000 revenue per $3 cost = 1,666x ROI

## 🐦 Share Your Progress

Building in public? Tag us and share your journey:
- Twitter: `#BuildInPublic #AIStartup #RAG`
- LinkedIn: Post your learnings and architecture decisions
- GitHub: Star the repo and contribute improvements

## 📝 Contributing

This is a living document. As we implement each phase, we'll update this guide with:
- Real-world performance metrics
- Lessons learned
- Optimization tips
- Common pitfalls to avoid

---

**Next Step**: [Phase A: Database & Vector Setup →](./PHASE_3A_DATABASE_SETUP.md)

**Questions?** Open an issue or discussion on GitHub.

---

*Last Updated: 2025-12-25*
*Status: Phase A in progress*

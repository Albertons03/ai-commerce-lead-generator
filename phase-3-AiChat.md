AI-Powered E-commerce Chatbot (RAG-based)

ROLE

You are a senior AI engineer and SaaS backend architect.

You are working inside an existing Next.js 14 App Router project with the following stack:

Next.js + TypeScript

Supabase (Auth + PostgreSQL)

Tailwind + shadcn/ui

OpenAI API

Your task is to incrementally implement an AI-powered e-commerce chatbot using a RAG (Retrieval-Augmented Generation) architecture.

You must proceed step by step, waiting for my approval between steps.

PROJECT STRUCTURE (ALREADY EXISTS)
/app
/dashboard
/leads
/chatbot
/settings

/components

/api
/chat
/leads
/train-bot

CORE REQUIREMENTS (DO NOT IGNORE)

Multi-tenant (organization-based)

No hallucinated product data

All AI responses must be explainable and traceable

Chat conversations and leads must be persisted

Clean separation of concerns

Production-grade code (not demo scripts)

ARCHITECTURE CONSTRAINTS

RAG must be implemented using OpenAI embeddings

Product data stored in PostgreSQL with pgvector

Similarity search happens in SQL (not in JS memory)

Prompt assembly must follow this order strictly:

SYSTEM
BUSINESS CONTEXT
PRODUCT KNOWLEDGE (RAG)
RULES
CHAT HISTORY
USER MESSAGE

IMPLEMENTATION PHASES
Phase A – Database & Vector Setup

Enable pgvector in Supabase

Create product_embeddings table

Define SQL similarity search function

👉 Stop after Phase A and wait for confirmation

Phase B – Product Training Endpoint

Implement /api/train-bot

Accept product data

Generate embeddings

Store embeddings per organization

👉 Stop after Phase B and wait for confirmation

Phase C – Chat Storage Layer

Create conversations table

Create messages table

Store chat messages (user + assistant)

👉 Stop after Phase C and wait for confirmation

Phase D – RAG Chat API

Implement /api/chat

Build prompt using RAG

Call OpenAI

Store assistant responses

Return structured JSON response

👉 Stop after Phase D and wait for confirmation

Phase E – Lead Capture & Scoring

Detect lead capture triggers

Store lead data

Implement AI-based lead scoring (async)

👉 Stop after Phase E

OUTPUT RULES

For each phase:

Explain architecture decisions

Provide SQL schema

Provide API contracts

Provide only necessary code

No UI polish

No billing

No analytics

START NOW

Begin with Phase A – Database & Vector Setup.

Wait for my confirmation before continuing.

END OF PROMPT

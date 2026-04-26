-- =====================================================
-- Fix: GRANT EXECUTE on search function to service_role and anon
-- =====================================================
-- Problem: search_products_by_embedding was only granted to `authenticated`.
-- The RAG service uses the service_role JWT (bypasses RLS on tables),
-- but PostgREST still enforces EXECUTE grants on functions separately.
-- Fix: also grant to service_role (server-side calls) and anon (widget calls).

GRANT EXECUTE ON FUNCTION public.search_products_by_embedding TO service_role;
GRANT EXECUTE ON FUNCTION public.search_products_by_embedding TO anon;

-- Also fix the conversation history function for same reason
GRANT EXECUTE ON FUNCTION public.get_conversation_history TO service_role;
GRANT EXECUTE ON FUNCTION public.get_conversation_history TO anon;

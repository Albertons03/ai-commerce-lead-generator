-- Fix API Keys table - Add missing key_last_four column
-- This migration adds the missing key_last_four column that is expected by the application

ALTER TABLE public.api_keys 
ADD COLUMN key_last_four TEXT;

-- Update existing records to populate key_last_four from key_prefix if possible
-- This is a best effort - in practice, existing keys would need to be re-generated
UPDATE public.api_keys 
SET key_last_four = CASE 
  WHEN LENGTH(key_prefix) >= 4 THEN RIGHT(key_prefix, 4)
  ELSE key_prefix 
END
WHERE key_last_four IS NULL;
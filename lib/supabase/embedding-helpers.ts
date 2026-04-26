/**
 * Supabase Embedding Helpers
 *
 * Database operations for product embeddings:
 * - Upsert embeddings
 * - Batch insert/update
 * - Query existing embeddings
 * - Delete embeddings
 */

import { createClient } from '@supabase/supabase-js';
import type { EmbeddingResult } from '../ai/embedding-service';

// =====================================================
// Types
// =====================================================

export interface ProductEmbedding {
  id: string;
  organization_id: string;
  product_id: string;
  product_name: string;
  product_description: string;
  embedding: number[];
  embedding_model: string;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UpsertEmbeddingInput {
  organization_id: string;
  product_id: string;
  product_name: string;
  product_description: string;
  embedding: number[];
  embedding_model: string;
  metadata?: Record<string, unknown>;
}

export interface BatchUpsertResult {
  inserted: number;
  updated: number;
  failed: number;
  errors: Array<{
    product_id: string;
    error: string;
  }>;
}

// =====================================================
// Client Creation
// =====================================================

/**
 * Create a Supabase client with service role key
 * This bypasses RLS and should only be used in API routes
 */
function getServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// =====================================================
// Query Operations
// =====================================================

/**
 * Get existing embeddings for products
 */
export async function getExistingEmbeddings(
  organizationId: string,
  productIds: string[]
): Promise<Map<string, ProductEmbedding>> {
  const supabase = getServiceRoleClient();

  const { data, error } = await supabase
    .from('product_embeddings')
    .select('*')
    .eq('organization_id', organizationId)
    .in('product_id', productIds);

  if (error) {
    throw new Error(`Failed to query embeddings: ${error.message}`);
  }

  // Create map for quick lookup
  const embeddingMap = new Map<string, ProductEmbedding>();
  (data || []).forEach((embedding) => {
    embeddingMap.set(embedding.product_id, embedding as ProductEmbedding);
  });

  return embeddingMap;
}

/**
 * Check if products already have embeddings
 */
export async function checkExistingEmbeddings(
  organizationId: string,
  productIds: string[]
): Promise<{
  existing: string[];
  missing: string[];
}> {
  const embeddingMap = await getExistingEmbeddings(organizationId, productIds);

  const existing: string[] = [];
  const missing: string[] = [];

  productIds.forEach((productId) => {
    if (embeddingMap.has(productId)) {
      existing.push(productId);
    } else {
      missing.push(productId);
    }
  });

  return { existing, missing };
}

/**
 * Count total embeddings for an organization
 */
export async function countEmbeddings(organizationId: string): Promise<number> {
  const supabase = getServiceRoleClient();

  const { count, error } = await supabase
    .from('product_embeddings')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId);

  if (error) {
    throw new Error(`Failed to count embeddings: ${error.message}`);
  }

  return count || 0;
}

// =====================================================
// Insert/Update Operations
// =====================================================

/**
 * Upsert a single product embedding
 */
export async function upsertEmbedding(
  input: UpsertEmbeddingInput
): Promise<void> {
  const supabase = getServiceRoleClient();

  const { error } = await supabase
    .from('product_embeddings')
    .upsert(
      {
        organization_id: input.organization_id,
        product_id: input.product_id,
        product_name: input.product_name,
        product_description: input.product_description,
        embedding: JSON.stringify(input.embedding),
        embedding_model: input.embedding_model,
        metadata: input.metadata || {},
        is_active: true,
      },
      {
        onConflict: 'organization_id,product_id',
      }
    );

  if (error) {
    throw new Error(`Failed to upsert embedding: ${error.message}`);
  }
}

/**
 * Batch upsert product embeddings
 *
 * Uses Promise.allSettled for graceful degradation
 * Returns counts of successful and failed operations
 */
export async function batchUpsertEmbeddings(
  organizationId: string,
  embeddingResults: EmbeddingResult[],
  productData: Map<string, { name: string; description: string; price?: number; metadata?: Record<string, unknown> }>,
  model: string,
  overwriteExisting: boolean = false
): Promise<BatchUpsertResult> {
  const supabase = getServiceRoleClient();

  // Always check which products already exist (for accurate inserted/updated counts)
  const existing = await getExistingEmbeddings(
    organizationId,
    embeddingResults.map((r) => r.product_id)
  );
  const existingProductIds = new Set(existing.keys());

  // Prepare upsert data
  // If not overwriting, skip products that already exist
  const upsertData = embeddingResults
    .filter((result) => overwriteExisting || !existingProductIds.has(result.product_id))
    .map((result) => {
      const product = productData.get(result.product_id);
      if (!product) {
        throw new Error(`Missing product data for ${result.product_id}`);
      }

      return {
        organization_id: organizationId,
        product_id: result.product_id,
        product_name: product.name,
        product_description: product.description,
        product_price: product.price ?? null,
        embedding: JSON.stringify(result.embedding),
        embedding_model: model,
        metadata: product.metadata || {},
        is_active: true,
      };
    });

  if (upsertData.length === 0) {
    return {
      inserted: 0,
      updated: 0,
      failed: 0,
      errors: [],
    };
  }

  // Perform batch upsert
  const { data, error } = await supabase
    .from('product_embeddings')
    .upsert(upsertData, {
      onConflict: 'organization_id,product_id',
    })
    .select('product_id');

  if (error) {
    // If batch upsert fails, try individual upserts
    console.error('Batch upsert failed, trying individual upserts:', error);
    return await fallbackIndividualUpserts(upsertData);
  }

  // Calculate counts
  const upsertedIds = new Set((data || []).map((d) => d.product_id));
  const inserted = upsertData.filter(
    (d) => !existingProductIds.has(d.product_id) && upsertedIds.has(d.product_id)
  ).length;
  const updated = upsertData.filter(
    (d) => existingProductIds.has(d.product_id) && upsertedIds.has(d.product_id)
  ).length;

  return {
    inserted,
    updated,
    failed: 0,
    errors: [],
  };
}

/**
 * Fallback to individual upserts if batch fails
 */
async function fallbackIndividualUpserts(
  upsertData: Array<{
    organization_id: string;
    product_id: string;
    product_name: string;
    product_description: string;
    product_price: number | null;
    embedding: string;
    embedding_model: string;
    metadata: Record<string, unknown>;
    is_active: boolean;
  }>
): Promise<BatchUpsertResult> {
  const supabase = getServiceRoleClient();

  const results = await Promise.allSettled(
    upsertData.map(async (data) => {
      const { error } = await supabase
        .from('product_embeddings')
        .upsert(data, {
          onConflict: 'organization_id,product_id',
        });

      if (error) {
        throw new Error(error.message);
      }

      return data.product_id;
    })
  );

  const inserted: string[] = [];
  const errors: Array<{ product_id: string; error: string }> = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      inserted.push(result.value);
    } else {
      errors.push({
        product_id: upsertData[index].product_id,
        error: result.reason.message,
      });
    }
  });

  return {
    inserted: inserted.length,
    updated: 0, // Can't distinguish in fallback
    failed: errors.length,
    errors,
  };
}

// =====================================================
// Delete Operations
// =====================================================

/**
 * Delete embeddings for specific products
 */
export async function deleteEmbeddings(
  organizationId: string,
  productIds: string[]
): Promise<number> {
  const supabase = getServiceRoleClient();

  const { data, error } = await supabase
    .from('product_embeddings')
    .delete()
    .eq('organization_id', organizationId)
    .in('product_id', productIds)
    .select('id');

  if (error) {
    throw new Error(`Failed to delete embeddings: ${error.message}`);
  }

  return (data || []).length;
}

/**
 * Soft delete embeddings (set is_active = false)
 */
export async function deactivateEmbeddings(
  organizationId: string,
  productIds: string[]
): Promise<number> {
  const supabase = getServiceRoleClient();

  const { data, error } = await supabase
    .from('product_embeddings')
    .update({ is_active: false })
    .eq('organization_id', organizationId)
    .in('product_id', productIds)
    .select('id');

  if (error) {
    throw new Error(`Failed to deactivate embeddings: ${error.message}`);
  }

  return (data || []).length;
}

/**
 * Delete all embeddings for an organization
 */
export async function deleteAllEmbeddings(
  organizationId: string
): Promise<number> {
  const supabase = getServiceRoleClient();

  const { data, error } = await supabase
    .from('product_embeddings')
    .delete()
    .eq('organization_id', organizationId)
    .select('id');

  if (error) {
    throw new Error(`Failed to delete all embeddings: ${error.message}`);
  }

  return (data || []).length;
}

// =====================================================
// Verification
// =====================================================

/**
 * Verify that user has access to organization
 */
export async function verifyOrganizationAccess(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const supabase = getServiceRoleClient();

  const { data, error } = await supabase
    .from('organization_members')
    .select('id')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}

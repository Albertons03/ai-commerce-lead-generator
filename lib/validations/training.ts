/**
 * Validation Schemas for Training API
 *
 * Uses Zod for runtime type validation of API requests
 */

import { z } from 'zod';

// =====================================================
// Product Input Schema
// =====================================================

/**
 * Schema for a single product input
 */
export const productInputSchema = z.object({
  product_id: z
    .string()
    .min(1, 'product_id is required')
    .max(255, 'product_id must be less than 255 characters'),

  product_name: z
    .string()
    .min(1, 'product_name is required')
    .max(500, 'product_name must be less than 500 characters'),

  product_description: z
    .string()
    .min(1, 'product_description is required')
    .max(5000, 'product_description must be less than 5000 characters'),

  category: z
    .string()
    .max(255, 'category must be less than 255 characters')
    .optional(),

  price: z
    .number()
    .nonnegative('price must be non-negative')
    .finite('price must be a finite number')
    .optional(),

  metadata: z.record(z.unknown()).optional(),
});

export type ProductInput = z.infer<typeof productInputSchema>;

// =====================================================
// Training Request Schema
// =====================================================

/**
 * Schema for the /api/train-bot endpoint request body
 */
export const trainBotRequestSchema = z.object({
  organization_id: z
    .string()
    .uuid('organization_id must be a valid UUID'),

  products: z
    .array(productInputSchema)
    .min(1, 'At least one product is required')
    .max(100, 'Maximum 100 products per request'),

  batch_size: z
    .number()
    .int('batch_size must be an integer')
    .min(1, 'batch_size must be at least 1')
    .max(20, 'batch_size must be at most 20')
    .default(10),

  overwrite_existing: z
    .boolean()
    .default(false)
    .describe('Whether to overwrite existing embeddings for these products'),
});

export type TrainBotRequest = z.infer<typeof trainBotRequestSchema>;

// =====================================================
// Training Response Schema
// =====================================================

/**
 * Schema for successful training response
 */
export const trainBotResponseSchema = z.object({
  success: z.literal(true),

  data: z.object({
    processed: z.number().int().nonnegative(),
    inserted: z.number().int().nonnegative(),
    updated: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    totalTokens: z.number().int().nonnegative(),
    estimatedCost: z.number().nonnegative(),
    duration: z.number().int().nonnegative(),
  }),

  message: z.string().optional(),
});

export type TrainBotResponse = z.infer<typeof trainBotResponseSchema>;

// =====================================================
// Error Response Schema
// =====================================================

/**
 * Schema for error responses
 */
export const errorResponseSchema = z.object({
  success: z.literal(false),

  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;

// =====================================================
// Validation Helpers
// =====================================================

/**
 * Validate request body with detailed error messages
 */
export function validateTrainBotRequest(body: unknown): {
  success: true;
  data: TrainBotRequest;
} | {
  success: false;
  errors: z.ZodError;
} {
  const result = trainBotRequestSchema.safeParse(body);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, errors: result.error };
}

/**
 * Format Zod validation errors for API response
 */
export function formatValidationErrors(error: z.ZodError): {
  code: string;
  message: string;
  details: Array<{
    path: string;
    message: string;
  }>;
} {
  return {
    code: 'validation_error',
    message: 'Invalid request body',
    details: error.errors.map((err) => ({
      path: err.path.join('.'),
      message: err.message,
    })),
  };
}

// =====================================================
// Organization Validation
// =====================================================

/**
 * Validate that a user has access to an organization
 *
 * This should be called in API routes to verify the user
 * is authorized to perform operations on the organization.
 */
export interface OrganizationAccessCheck {
  userId: string;
  organizationId: string;
}

/**
 * Schema for organization access validation
 */
export const organizationAccessSchema = z.object({
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
});

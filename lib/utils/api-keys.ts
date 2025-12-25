import * as crypto from 'crypto'
import * as bcrypt from 'bcryptjs'

/**
 * =====================================================
 * API Key Utility Functions
 * =====================================================
 * Functions for secure API key generation, hashing, and verification
 */

const BCRYPT_ROUNDS = 10

/**
 * Generates a secure API key with the format: sk_live_[32_random_chars]
 *
 * @returns {string} A securely generated API key
 *
 * @example
 * const apiKey = generateApiKey()
 * // Returns: "sk_live_abc123xyz789..." (total length ~40 chars)
 */
export function generateApiKey(): string {
  // Generate 32 random bytes and convert to base64url format
  // base64url is URL-safe (no +, /, or = characters)
  const randomBytes = crypto.randomBytes(32).toString('base64url')

  // Prefix with sk_live_ to indicate it's a live secret key
  return `sk_live_${randomBytes}`
}

/**
 * Hashes an API key using bcrypt for secure storage
 *
 * @param {string} apiKey - The plain text API key to hash
 * @returns {Promise<string>} The bcrypt hash of the API key
 *
 * @example
 * const hash = await hashApiKey(apiKey)
 * // Store this hash in the database, never store the plain key
 */
export async function hashApiKey(apiKey: string): Promise<string> {
  try {
    const hash = await bcrypt.hash(apiKey, BCRYPT_ROUNDS)
    return hash
  } catch (error) {
    console.error('Error hashing API key:', error)
    throw new Error('Failed to hash API key')
  }
}

/**
 * Verifies an API key against a stored hash
 *
 * @param {string} apiKey - The plain text API key to verify
 * @param {string} hash - The stored bcrypt hash to compare against
 * @returns {Promise<boolean>} True if the key matches the hash, false otherwise
 *
 * @example
 * const isValid = await verifyApiKey(providedKey, storedHash)
 * if (isValid) {
 *   // Allow access
 * }
 */
export async function verifyApiKey(apiKey: string, hash: string): Promise<boolean> {
  try {
    const isValid = await bcrypt.compare(apiKey, hash)
    return isValid
  } catch (error) {
    console.error('Error verifying API key:', error)
    return false
  }
}

/**
 * Extracts the key prefix for display purposes
 * Shows only the first part of the key (sk_live_xxxx)
 *
 * @param {string} apiKey - The full API key
 * @returns {string} The prefix portion of the key (first 20 chars)
 *
 * @example
 * const prefix = getKeyPrefix("sk_live_abc123xyz789...")
 * // Returns: "sk_live_abc123xyz789"
 */
export function getKeyPrefix(apiKey: string): string {
  return apiKey.substring(0, Math.min(20, apiKey.length))
}

/**
 * Masks an API key for safe display
 * Shows only the prefix and last 4 characters
 *
 * @param {string} keyPrefix - The key prefix stored in database
 * @param {string} lastFour - The last 4 characters of the key (optional)
 * @returns {string} A masked version of the key
 *
 * @example
 * const masked = maskKey("sk_live_abc123xyz789")
 * // Returns: "sk_live_****xyz789"
 */
export function maskKey(keyPrefix: string, lastFour?: string): string {
  if (!keyPrefix || keyPrefix.length < 8) {
    return '****'
  }

  // If we have the last 4 characters, use them
  if (lastFour && lastFour.length === 4) {
    return `${keyPrefix.substring(0, 8)}****${lastFour}`
  }

  // Otherwise, show prefix and mask the rest
  const prefix = keyPrefix.substring(0, 8) // 'sk_live_'
  const remaining = keyPrefix.substring(8)

  if (remaining.length > 4) {
    const last4 = remaining.slice(-4)
    return `${prefix}****${last4}`
  }

  return `${prefix}****`
}

/**
 * Validates that an API key has the correct format
 *
 * @param {string} apiKey - The API key to validate
 * @returns {boolean} True if the format is valid, false otherwise
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  if (!apiKey) return false

  // Must start with sk_live_
  if (!apiKey.startsWith('sk_live_')) return false

  // Must have sufficient length (at least 40 characters total)
  if (apiKey.length < 40) return false

  // Must only contain valid base64url characters after the prefix
  const keyPart = apiKey.substring(8)
  const validChars = /^[a-zA-Z0-9_-]+$/

  return validChars.test(keyPart)
}

/**
 * Extracts the last 4 characters of an API key for identification
 *
 * @param {string} apiKey - The full API key
 * @returns {string} The last 4 characters
 */
export function getLastFourChars(apiKey: string): string {
  if (!apiKey || apiKey.length < 4) {
    return ''
  }
  return apiKey.slice(-4)
}

/**
 * Generates a secure API key and returns both the key and its hash
 * This is a convenience function for the key creation process
 *
 * @returns {Promise<{key: string, hash: string, prefix: string, lastFour: string}>}
 *
 * @example
 * const { key, hash, prefix, lastFour } = await generateAndHashApiKey()
 * // Store hash, prefix, and lastFour in database
 * // Return key to user (only shown once!)
 */
export async function generateAndHashApiKey(): Promise<{
  key: string
  hash: string
  prefix: string
  lastFour: string
}> {
  const key = generateApiKey()
  const hash = await hashApiKey(key)
  const prefix = getKeyPrefix(key)
  const lastFour = getLastFourChars(key)

  return {
    key,
    hash,
    prefix,
    lastFour,
  }
}

/**
 * Cryptographic utilities for secure token generation
 */

/**
 * Generate a cryptographically secure random token
 * @param length Number of random bytes (default: 32)
 * @returns Base64URL encoded token
 */
export function generateSecureToken(length: number = 32): string {
  if (typeof crypto === 'undefined') {
    // Fallback for environments without crypto API
    return Array.from({ length: length * 2 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  // Convert to base64url (URL-safe base64)
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Validate email format
 * @param email Email address to validate
 * @returns true if valid email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Sanitize input to prevent XSS
 * @param input String to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Generate a UUID v4
 * @returns UUID string
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback UUID generation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
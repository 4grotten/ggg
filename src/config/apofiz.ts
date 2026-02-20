/**
 * Apofiz configuration
 * All environments now use production apofiz.com
 */

// Base URLs
export const APOFIZ_BASE_URL = 'https://apofiz.com';

export const APOFIZ_API_URL = `${APOFIZ_BASE_URL}/api/v1`;

export const APOFIZ_CDN_URL = 'https://cdn.apofiz.com';

// EasyCard app link (for sharing)
export const EASYCARD_APP_URL = 'https://ueasycard.com';

/**
 * Get Apofiz URL with optional token for SSO
 * Uses fragment (#) instead of query (?) for security:
 * - Fragment is not sent to server
 * - Fragment is not logged in access logs
 * - Fragment is not passed in Referer header
 */
export const getApofizUrl = (token?: string | null): string => {
  const ts = Date.now();
  if (token) {
    return `${APOFIZ_BASE_URL}/#token=${encodeURIComponent(token)}&ts=${ts}`;
  }
  return APOFIZ_BASE_URL;
};

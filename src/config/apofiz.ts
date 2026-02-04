/**
 * Apofiz configuration
 * Uses VITE_APP_ENV to determine production vs test URLs
 *
 * Environments:
 * - npm run dev         → development (test.apofiz.com)
 * - npm run build:test  → test (test.apofiz.com)
 * - npm run build       → production (apofiz.com)
 */

const isProduction = import.meta.env.VITE_APP_ENV === 'production';

// Base URLs
export const APOFIZ_BASE_URL = isProduction
  ? 'https://apofiz.com'
  : 'https://test.apofiz.com';

export const APOFIZ_API_URL = `${APOFIZ_BASE_URL}/api/v1`;

export const APOFIZ_CDN_URL = 'https://cdn.apofiz.com';

// EasyCard app link (for sharing)
export const EASYCARD_APP_URL = isProduction
  ? 'https://easycarduae.com'
  : `${APOFIZ_BASE_URL}/EasyCard/`;

/**
 * Get Apofiz URL with optional token for SSO
 */
export const getApofizUrl = (token?: string | null): string => {
  const ts = Date.now();
  if (token) {
    return `${APOFIZ_BASE_URL}/?token=${encodeURIComponent(token)}&ts=${ts}`;
  }
  return `${APOFIZ_BASE_URL}/?ts=${ts}`;
};

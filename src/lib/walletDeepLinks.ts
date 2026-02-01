/**
 * Utility functions for opening mobile wallet apps via deep links.
 *
 * Notes:
 * - Deep links often don't work in embedded iframes (like previews) due to browser restrictions.
 * - iPadOS can report as "Mac" in UA; we use touch points heuristic.
 */

export type Platform = 'ios' | 'android' | 'unknown';

export type WalletOpenResult = {
  success: boolean;
  platform: Platform;
  walletName: string;
  reason?: 'embedded' | 'unsupported_platform' | 'failed';
};

/**
 * Detect the user's platform
 */
export function detectPlatform(): Platform {
  const ua = navigator.userAgent || '';
  const uaLower = ua.toLowerCase();

  // Standard iOS detection
  if (/iphone|ipad|ipod/.test(uaLower)) return 'ios';

  // iPadOS 13+ may pretend to be Mac
  // https://developer.apple.com/forums/thread/119186
  if (
    navigator.platform === 'MacIntel' &&
    typeof navigator.maxTouchPoints === 'number' &&
    navigator.maxTouchPoints > 1
  ) {
    return 'ios';
  }

  if (/android/.test(uaLower)) return 'android';

  return 'unknown';
}

function isEmbeddedPreview(): boolean {
  try {
    return window.top !== window.self;
  } catch {
    // Cross-origin can throw; treat as embedded
    return true;
  }
}

function tryNavigate(url: string): void {
  // Must be called from a user gesture
  window.location.assign(url);
}

/**
 * Open Apple Wallet app
 * Uses the shoebox:// URL scheme for Apple Wallet
 */
export function openAppleWallet(): boolean {
  const platform = detectPlatform();
  
  if (platform !== 'ios') {
    return false;
  }
  
  // Try both schemes; some iOS versions behave differently.
  // NOTE: There is no universally guaranteed public URL scheme.
  tryNavigate('shoebox://');
  setTimeout(() => {
    try {
      tryNavigate('wallet://');
    } catch {
      // ignore
    }
  }, 400);
  
  return true;
}

/**
 * Open Google Pay app
 * Uses the googlepaywallet:// or intent:// URL scheme
 */
export function openGooglePay(): boolean {
  const platform = detectPlatform();
  
  if (platform !== 'android') {
    return false;
  }
  
  // Using intent:// for better Android compatibility.
  // Some devices may require an installed app; otherwise it will do nothing.
  const googlePayIntent =
    'intent://pay#Intent;scheme=googlepay;package=com.google.android.apps.walletnfcrel;end';

  tryNavigate(googlePayIntent);
  
  return true;
}

/**
 * Open the appropriate wallet based on platform
 * Returns info about what action was taken
 */
export function openWallet(): WalletOpenResult {
  if (isEmbeddedPreview()) {
    return {
      success: false,
      platform: detectPlatform(),
      walletName: getWalletName(),
      reason: 'embedded',
    };
  }

  const platform = detectPlatform();
  
  switch (platform) {
    case 'ios':
      openAppleWallet();
      return { success: true, platform, walletName: 'Apple Wallet' };
      
    case 'android':
      openGooglePay();
      return { success: true, platform, walletName: 'Google Pay' };
      
    default:
      return { success: false, platform, walletName: '', reason: 'unsupported_platform' };
  }
}

/**
 * Check if the current platform supports wallet deep links
 */
export function isWalletSupported(): boolean {
  const platform = detectPlatform();
  return platform === 'ios' || platform === 'android';
}

/**
 * Get the wallet name for the current platform
 */
export function getWalletName(): string {
  const platform = detectPlatform();
  
  switch (platform) {
    case 'ios':
      return 'Apple Pay';
    case 'android':
      return 'Google Pay';
    default:
      return 'Wallet';
  }
}

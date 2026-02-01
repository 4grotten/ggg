/**
 * Utility functions for opening mobile wallet apps via deep links
 */

type Platform = 'ios' | 'android' | 'unknown';

/**
 * Detect the user's platform
 */
export function detectPlatform(): Platform {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'ios';
  }
  
  if (/android/.test(userAgent)) {
    return 'android';
  }
  
  return 'unknown';
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
  
  // Apple Wallet deep link schemes
  // shoebox:// - Opens Wallet app
  // wallet:// - Alternative scheme
  window.location.href = 'shoebox://';
  
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
  
  // Try the Google Pay deep link
  // Using intent:// for better Android compatibility
  const googlePayIntent = 'intent://pay#Intent;scheme=googlepay;package=com.google.android.apps.walletnfcrel;end';
  
  window.location.href = googlePayIntent;
  
  return true;
}

/**
 * Open the appropriate wallet based on platform
 * Returns info about what action was taken
 */
export function openWallet(): { 
  success: boolean; 
  platform: Platform; 
  walletName: string;
} {
  const platform = detectPlatform();
  
  switch (platform) {
    case 'ios':
      openAppleWallet();
      return { success: true, platform, walletName: 'Apple Wallet' };
      
    case 'android':
      openGooglePay();
      return { success: true, platform, walletName: 'Google Pay' };
      
    default:
      return { success: false, platform, walletName: '' };
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

import { useState, useEffect, useCallback } from 'react';

const BIOMETRIC_CREDENTIAL_KEY = 'biometric_credential';
const BIOMETRIC_PHONE_KEY = 'biometric_phone';
const BIOMETRIC_PASSWORD_KEY = 'biometric_password';

interface StoredCredential {
  credentialId: string;
  phoneNumber: string;
}

// Simple XOR encryption for password storage (obfuscation layer)
const encryptPassword = (password: string, key: string): string => {
  let result = '';
  for (let i = 0; i < password.length; i++) {
    result += String.fromCharCode(password.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result);
};

const decryptPassword = (encrypted: string, key: string): string => {
  const decoded = atob(encrypted);
  let result = '';
  for (let i = 0; i < decoded.length; i++) {
    result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
};

// Check if WebAuthn is available
const isWebAuthnAvailable = (): boolean => {
  return !!(
    window.PublicKeyCredential &&
    typeof window.PublicKeyCredential === 'function'
  );
};

// Check if platform authenticator (Face ID, Touch ID, fingerprint) is available
const isPlatformAuthenticatorAvailable = async (): Promise<boolean> => {
  if (!isWebAuthnAvailable()) return false;
  
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
};

// Generate a random challenge
const generateChallenge = (): Uint8Array => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return array;
};

// Convert ArrayBuffer to base64 string
const bufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Convert base64 string to ArrayBuffer
const base64ToBuffer = (base64: string): ArrayBuffer => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

export const useBiometricAuth = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [storedPhone, setStoredPhone] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check availability on mount
  useEffect(() => {
    const checkAvailability = async () => {
      const available = await isPlatformAuthenticatorAvailable();
      setIsAvailable(available);
      
      // Check if credential is stored
      const stored = localStorage.getItem(BIOMETRIC_CREDENTIAL_KEY);
      const phone = localStorage.getItem(BIOMETRIC_PHONE_KEY);
      if (stored && phone) {
        setIsEnabled(true);
        setStoredPhone(phone);
      }
    };
    
    checkAvailability();
  }, []);

  // Register biometric credential with password
  const registerBiometric = useCallback(async (phoneNumber: string, password?: string): Promise<boolean> => {
    if (!isAvailable) return false;
    
    setIsLoading(true);
    
    try {
      const challenge = generateChallenge();
      const userId = new TextEncoder().encode(phoneNumber);
      
      // Create credential options
      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge: challenge as BufferSource,
        rp: {
          name: 'Easy Card',
          id: window.location.hostname,
        },
        user: {
          id: userId as BufferSource,
          name: phoneNumber,
          displayName: phoneNumber,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },   // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      }) as PublicKeyCredential;

      if (credential) {
        // Store credential ID
        const storedCredential: StoredCredential = {
          credentialId: bufferToBase64(credential.rawId),
          phoneNumber,
        };
        
        localStorage.setItem(BIOMETRIC_CREDENTIAL_KEY, JSON.stringify(storedCredential));
        localStorage.setItem(BIOMETRIC_PHONE_KEY, phoneNumber);
        
        // Store encrypted password if provided
        if (password) {
          const encryptionKey = bufferToBase64(credential.rawId);
          const encryptedPassword = encryptPassword(password, encryptionKey);
          localStorage.setItem(BIOMETRIC_PASSWORD_KEY, encryptedPassword);
        }
        
        setIsEnabled(true);
        setStoredPhone(phoneNumber);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Biometric registration failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isAvailable]);

  // Authenticate with biometric
  const authenticateWithBiometric = useCallback(async (): Promise<{ success: boolean; phoneNumber?: string; password?: string }> => {
    if (!isEnabled) return { success: false };
    
    setIsLoading(true);
    
    try {
      const storedData = localStorage.getItem(BIOMETRIC_CREDENTIAL_KEY);
      if (!storedData) return { success: false };
      
      const { credentialId, phoneNumber }: StoredCredential = JSON.parse(storedData);
      
      const challenge = generateChallenge();
      const credentialIdBuffer = base64ToBuffer(credentialId);
      
      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge: challenge as BufferSource,
        allowCredentials: [
          {
            id: credentialIdBuffer as BufferSource,
            type: 'public-key',
            transports: ['internal'],
          },
        ],
        userVerification: 'required',
        timeout: 60000,
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      }) as PublicKeyCredential;

      if (assertion) {
        // Decrypt stored password if available
        const encryptedPassword = localStorage.getItem(BIOMETRIC_PASSWORD_KEY);
        let password: string | undefined;
        
        if (encryptedPassword) {
          const encryptionKey = credentialId;
          password = decryptPassword(encryptedPassword, encryptionKey);
        }
        
        return { success: true, phoneNumber, password };
      }
      
      return { success: false };
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }, [isEnabled]);

  // Remove biometric credential
  const removeBiometric = useCallback(() => {
    localStorage.removeItem(BIOMETRIC_CREDENTIAL_KEY);
    localStorage.removeItem(BIOMETRIC_PHONE_KEY);
    localStorage.removeItem(BIOMETRIC_PASSWORD_KEY);
    setIsEnabled(false);
    setStoredPhone(null);
  }, []);

  // Get biometric type label
  const getBiometricLabel = useCallback((): string => {
    const ua = navigator.userAgent.toLowerCase();
    
    if (/iphone|ipad|ipod/.test(ua)) {
      // Check for Face ID capable devices (iPhone X and later)
      if (/iphone/.test(ua)) {
        return 'Face ID';
      }
      return 'Touch ID';
    }
    
    if (/android/.test(ua)) {
      return 'Biometric';
    }
    
    if (/mac/.test(ua)) {
      return 'Touch ID';
    }
    
    if (/windows/.test(ua)) {
      return 'Windows Hello';
    }
    
    return 'Biometric';
  }, []);

  return {
    isAvailable,
    isEnabled,
    storedPhone,
    isLoading,
    registerBiometric,
    authenticateWithBiometric,
    removeBiometric,
    getBiometricLabel,
  };
};

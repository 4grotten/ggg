/**
 * OTP API для WhatsApp верификации
 * Base URL: https://api.apofiz.com/api/v1
 * Без авторизации
 */

const OTP_BASE_URL = 'https://api.apofiz.com/api/v1';

// ============ Types ============

export interface OtpSendRequest {
  phone_number: string;
}

export interface OtpSendResponse {
  otp_id: string;
  phone_number: string;
  expires_at: string;
  sent: boolean;
}

export interface OtpVerifyRequest {
  phone_number: string;
  code: string;
}

export interface OtpVerifyResponse {
  is_valid: boolean;
  error: string | null;
}

export interface OtpResendResponse extends OtpSendResponse {}

export interface OtpCooldownError {
  error: string;
  seconds_remaining: number;
}

export interface OtpApiResult<T> {
  data: T | null;
  error: {
    message: string;
    status: number;
    secondsRemaining?: number;
  } | null;
}

// ============ Error Messages ============

const ERROR_MESSAGES: Record<string, string> = {
  'No active OTP found': 'otp.noActiveOtp',
  'OTP expired': 'otp.expired',
  'Max attempts exceeded': 'otp.maxAttempts',
};

// Extract attempts remaining from error message like "Invalid code. 2 attempts remaining"
export function parseAttemptsRemaining(error: string): number | null {
  const match = error.match(/(\d+) attempts? remaining/i);
  return match ? parseInt(match[1], 10) : null;
}

// ============ API Functions ============

/**
 * Send OTP code to phone number via WhatsApp
 * POST /otp/send/
 */
export async function sendOtp(phoneNumber: string): Promise<OtpApiResult<OtpSendResponse>> {
  try {
    const response = await fetch(`${OTP_BASE_URL}/otp/send/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: phoneNumber }),
    });

    if (response.status === 429) {
      const data = await response.json();
      return {
        data: null,
        error: {
          message: data.error || 'Rate limit exceeded',
          status: 429,
        },
      };
    }

    if (response.status === 400) {
      return {
        data: null,
        error: {
          message: 'Invalid phone number format',
          status: 400,
        },
      };
    }

    if (response.status === 503) {
      return {
        data: null,
        error: {
          message: 'Service temporarily unavailable',
          status: 503,
        },
      };
    }

    if (!response.ok) {
      return {
        data: null,
        error: {
          message: 'Failed to send OTP',
          status: response.status,
        },
      };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        message: 'Network error',
        status: 0,
      },
    };
  }
}

/**
 * Verify OTP code
 * POST /otp/verify/
 */
export async function verifyOtp(
  phoneNumber: string, 
  code: string
): Promise<OtpApiResult<OtpVerifyResponse>> {
  try {
    const response = await fetch(`${OTP_BASE_URL}/otp/verify/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: phoneNumber, code }),
    });

    if (!response.ok) {
      return {
        data: null,
        error: {
          message: 'Verification failed',
          status: response.status,
        },
      };
    }

    const data: OtpVerifyResponse = await response.json();
    
    // API returns 200 even for failures, check is_valid
    if (!data.is_valid && data.error) {
      return {
        data,
        error: {
          message: data.error,
          status: 200,
        },
      };
    }

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        message: 'Network error',
        status: 0,
      },
    };
  }
}

/**
 * Resend OTP code
 * POST /otp/resend/
 */
export async function resendOtp(phoneNumber: string): Promise<OtpApiResult<OtpSendResponse>> {
  try {
    const response = await fetch(`${OTP_BASE_URL}/otp/resend/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: phoneNumber }),
    });

    if (response.status === 429) {
      const data: OtpCooldownError = await response.json();
      return {
        data: null,
        error: {
          message: data.error,
          status: 429,
          secondsRemaining: data.seconds_remaining,
        },
      };
    }

    if (!response.ok) {
      return {
        data: null,
        error: {
          message: 'Failed to resend OTP',
          status: response.status,
        },
      };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        message: 'Network error',
        status: 0,
      },
    };
  }
}

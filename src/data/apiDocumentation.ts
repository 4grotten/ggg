// API Documentation data types and structure

export interface ApiParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  enum?: string[];
}

export interface ApiEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  title: string;
  titleKey?: string;
  description: string;
  descriptionKey?: string;
  category: string;
  authorization?: {
    type: 'Bearer' | 'API Key' | 'Token';
    description: string;
  };
  headers?: ApiParameter[];
  pathParams?: ApiParameter[];
  queryParams?: ApiParameter[];
  bodyParams?: ApiParameter[];
  requestExample?: {
    curl: string;
    json?: string;
  };
  responseExample?: {
    status: number;
    json: string;
  };
  responseParams?: ApiParameter[];
  notes?: string[];
}

export interface ApiCategory {
  id: string;
  title: string;
  titleKey: string;
  icon: string;
  endpoints: ApiEndpoint[];
}

// Base API URLs
export const API_BASE_URL = 'https://ueasycard.com/api/v1';
const ACCOUNTS_URL = `${API_BASE_URL}/accounts`;
const CARDS_URL = `${API_BASE_URL}/cards`;
const TRANSACTIONS_URL = `${API_BASE_URL}/transactions`;

// API Categories and Endpoints
export const apiCategories: ApiCategory[] = [
  // ============ AUTHENTICATION ============
  {
    id: 'authentication',
    title: 'Authentication',
    titleKey: 'api.categories.authentication',
    icon: '🔐',
    endpoints: [
      {
        id: 'otp-send',
        method: 'POST',
        path: '/accounts/otp/send/',
        title: 'Send OTP',
        description: 'Send a one-time password to the user\'s phone number via SMS or WhatsApp for verification.',
        category: 'authentication',
        bodyParams: [
          { name: 'phone_number', type: 'string', required: true, description: 'Phone number in international format (e.g., +971501234567)' },
          { name: 'type', type: 'enum', required: false, description: 'Delivery method for OTP', enum: ['sms', 'whatsapp'] }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${ACCOUNTS_URL}/otp/send/ \\
  --header 'Content-Type: application/json' \\
  --data '{
    "phone_number": "+971501234567",
    "type": "whatsapp"
  }'`,
          json: `{
  "phone_number": "+971501234567",
  "type": "whatsapp"
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "message": "OTP sent successfully"
}`
        },
        responseParams: [
          { name: 'message', type: 'string', required: true, description: 'Status message confirming OTP was sent' }
        ],
        notes: [
          'Default OTP type is "whatsapp" if not specified',
          'For Kyrgyzstan (+996) numbers, SMS is used by default',
          'OTP is valid for 5 minutes'
        ]
      },
      {
        id: 'otp-verify',
        method: 'POST',
        path: '/accounts/otp/verify/',
        title: 'Verify OTP',
        description: 'Verify the OTP code sent to the user\'s phone. Returns authentication token on success.',
        category: 'authentication',
        bodyParams: [
          { name: 'phone_number', type: 'string', required: true, description: 'Phone number in international format' },
          { name: 'code', type: 'string', required: true, description: '6-digit OTP code' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${ACCOUNTS_URL}/otp/verify/ \\
  --header 'Content-Type: application/json' \\
  --data '{
    "phone_number": "+971501234567",
    "code": "123456"
  }'`,
          json: `{
  "phone_number": "+971501234567",
  "code": "123456"
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "is_valid": true,
  "token": "abc123xyz789token",
  "is_new_user": false
}`
        },
        responseParams: [
          { name: 'is_valid', type: 'boolean', required: true, description: 'Whether the OTP code is valid' },
          { name: 'token', type: 'string', required: false, description: 'Authentication token (null for new users who need to complete registration)' },
          { name: 'is_new_user', type: 'boolean', required: false, description: 'Indicates if this is a new user requiring profile setup' },
          { name: 'error', type: 'string', required: false, description: 'Error message if verification failed' }
        ],
        notes: [
          'For existing users, token is returned immediately',
          'For new users, is_new_user will be true and token may be null until profile is initialized'
        ]
      },
      {
        id: 'register-auth',
        method: 'POST',
        path: '/accounts/register_auth/',
        title: 'Quick Register (Auto-login)',
        description: 'Request token without entering a code. Initiates registration via Apofiz first.',
        category: 'authentication',
        bodyParams: [
          { name: 'phone_number', type: 'string', required: true, description: 'Phone number in international format' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${ACCOUNTS_URL}/register_auth/ \\
  --header 'Content-Type: application/json' \\
  --data '{
    "phone_number": "+971501234567"
  }'`,
          json: `{
  "phone_number": "+971501234567"
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "token": "413e117173ba3f...",
  "user": {
    "id": 1,
    "phone": "+971501234567"
  }
}`
        },
        responseParams: [
          { name: 'token', type: 'string', required: false, description: 'Auth token (for existing users)' },
          { name: 'user', type: 'object', required: true, description: 'User object with id and phone' }
        ]
      },
      {
        id: 'verify-code',
        method: 'POST',
        path: '/accounts/verify_code/',
        title: 'Verify SMS Code',
        description: 'Verify the SMS code sent during registration. Returns token on success.',
        category: 'authentication',
        bodyParams: [
          { name: 'phone_number', type: 'string', required: true, description: 'Phone number in international format' },
          { name: 'code', type: 'number', required: true, description: '6-digit verification code as integer' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${ACCOUNTS_URL}/verify_code/ \\
  --header 'Content-Type: application/json' \\
  --data '{
    "phone_number": "+971501234567",
    "code": 123456
  }'`,
          json: `{
  "phone_number": "+971501234567",
  "code": 123456
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "token": "413e117173ba3f...",
  "user": { "id": 1, "phone": "+971501234567" }
}`
        },
        responseParams: [
          { name: 'token', type: 'string', required: true, description: 'Authentication token' },
          { name: 'user', type: 'object', required: true, description: 'User object' }
        ]
      },
      {
        id: 'resend-code',
        method: 'POST',
        path: '/accounts/resend_code/',
        title: 'Resend Code',
        description: 'Resend verification code to the user\'s phone number.',
        category: 'authentication',
        bodyParams: [
          { name: 'phone_number', type: 'string', required: true, description: 'Phone number in international format' },
          { name: 'type', type: 'enum', required: false, description: 'Resend method', enum: ['register_auth_type', 'whatsapp_auth_type', 'email_auth_type'] }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${ACCOUNTS_URL}/resend_code/ \\
  --header 'Content-Type: application/json' \\
  --data '{
    "phone_number": "+971501234567",
    "type": "whatsapp_auth_type"
  }'`,
          json: `{
  "phone_number": "+971501234567",
  "type": "whatsapp_auth_type"
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "message": "Code resent successfully"
}`
        },
        responseParams: [
          { name: 'message', type: 'string', required: true, description: 'Confirmation message' }
        ]
      },
      {
        id: 'login',
        method: 'POST',
        path: '/accounts/login/',
        title: 'Login with Password',
        description: 'Authenticate user with phone number and password.',
        category: 'authentication',
        bodyParams: [
          { name: 'phone_number', type: 'string', required: true, description: 'Phone number in international format' },
          { name: 'password', type: 'string', required: true, description: 'User password (minimum 6 characters)' },
          { name: 'location', type: 'string', required: false, description: 'User location for security logging' },
          { name: 'device', type: 'string', required: false, description: 'Device info for security logging' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${ACCOUNTS_URL}/login/ \\
  --header 'Content-Type: application/json' \\
  --data '{
    "phone_number": "+971501234567",
    "password": "securePassword123",
    "location": "Dubai, UAE",
    "device": "iPhone 15 Pro"
  }'`,
          json: `{
  "phone_number": "+971501234567",
  "password": "securePassword123",
  "location": "Dubai, UAE",
  "device": "iPhone 15 Pro"
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "message": "Login successful",
  "token": "abc123xyz789token",
  "user": {
    "id": 12345,
    "full_name": "John Doe",
    "phone_number": "+971501234567",
    "email": "john@example.com",
    "avatar": {
      "id": 1,
      "file": "https://cdn.apofiz.com/avatars/user123.jpg",
      "large": "https://cdn.apofiz.com/avatars/user123_large.jpg",
      "medium": "https://cdn.apofiz.com/avatars/user123_medium.jpg",
      "small": "https://cdn.apofiz.com/avatars/user123_small.jpg"
    },
    "username": "johndoe",
    "date_of_birth": "1990-05-15",
    "gender": "male",
    "has_empty_fields": false
  }
}`
        },
        responseParams: [
          { name: 'message', type: 'string', required: true, description: 'Success message' },
          { name: 'token', type: 'string', required: true, description: 'Authentication token for subsequent requests' },
          { name: 'user', type: 'object', required: true, description: 'User profile object' }
        ]
      },
      {
        id: 'logout',
        method: 'POST',
        path: '/accounts/logout/',
        title: 'Logout',
        description: 'Invalidate the current authentication token and end the session.',
        category: 'authentication',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        requestExample: {
          curl: `curl --request POST \\
  --url ${ACCOUNTS_URL}/logout/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `{
  "message": "Successfully logged out"
}`
        },
        responseParams: [
          { name: 'message', type: 'string', required: true, description: 'Logout confirmation' }
        ]
      }
    ]
  },
  // ============ PASSWORD MANAGEMENT ============
  {
    id: 'password',
    title: 'Password Management',
    titleKey: 'api.categories.password',
    icon: '🔑',
    endpoints: [
      {
        id: 'set-password',
        method: 'POST',
        path: '/accounts/set_password/',
        title: 'Set Password',
        description: 'Set password for a new user after registration.',
        category: 'password',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        bodyParams: [
          { name: 'password', type: 'string', required: true, description: 'New password (minimum 6 characters)' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${ACCOUNTS_URL}/set_password/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "password": "NewSecurePassword123!"
  }'`,
          json: `{
  "password": "NewSecurePassword123!"
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "message": "Password set successfully"
}`
        },
        responseParams: [
          { name: 'message', type: 'string', required: true, description: 'Success confirmation' }
        ]
      },
      {
        id: 'change-password',
        method: 'POST',
        path: '/accounts/users/doChangePassword/',
        title: 'Change Password',
        description: 'Change password for an authenticated user.',
        category: 'password',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        bodyParams: [
          { name: 'old_password', type: 'string', required: true, description: 'Current password' },
          { name: 'new_password', type: 'string', required: true, description: 'New password (minimum 6 characters)' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${ACCOUNTS_URL}/users/doChangePassword/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "old_password": "OldPassword123",
    "new_password": "NewSecurePassword123!"
  }'`,
          json: `{
  "old_password": "OldPassword123",
  "new_password": "NewSecurePassword123!"
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "message": "Password changed successfully"
}`
        },
        responseParams: [
          { name: 'message', type: 'string', required: true, description: 'Success confirmation' }
        ]
      },
      {
        id: 'forgot-password',
        method: 'POST',
        path: '/accounts/users/forgot_password/',
        title: 'Forgot Password',
        description: 'Request a password reset code to be sent via SMS, WhatsApp, or email.',
        category: 'password',
        bodyParams: [
          { name: 'phone_number', type: 'string', required: true, description: 'Phone number in international format' },
          { name: 'method', type: 'enum', required: false, description: 'Delivery method for reset code', enum: ['sms', 'whatsapp', 'email'] }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${ACCOUNTS_URL}/users/forgot_password/ \\
  --header 'Content-Type: application/json' \\
  --data '{
    "phone_number": "+971501234567",
    "method": "whatsapp"
  }'`,
          json: `{
  "phone_number": "+971501234567",
  "method": "whatsapp"
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "message": "Password reset instructions sent"
}`
        },
        responseParams: [
          { name: 'message', type: 'string', required: true, description: 'Status message' }
        ],
        notes: [
          'Email method is only available if user has email configured',
          'Default method is WhatsApp, except for +996 (Kyrgyzstan) which uses SMS'
        ]
      },
      {
        id: 'forgot-password-email',
        method: 'POST',
        path: '/accounts/users/forgot_password_email/',
        title: 'Forgot Password (Email)',
        description: 'Request a password reset code to be sent to the user\'s registered email.',
        category: 'password',
        authorization: {
          type: 'Token',
          description: 'Token authentication header (for logged in users who want to verify email)'
        },
        requestExample: {
          curl: `curl --request POST \\
  --url ${ACCOUNTS_URL}/users/forgot_password_email/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `{
  "message": "Reset code sent to email"
}`
        },
        responseParams: [
          { name: 'message', type: 'string', required: true, description: 'Confirmation message' }
        ]
      }
    ]
  },
  // ============ USER PROFILE ============
  {
    id: 'profile',
    title: 'User Profile',
    titleKey: 'api.categories.profile',
    icon: '👤',
    endpoints: [
      {
        id: 'get-current-user',
        method: 'GET',
        path: '/accounts/users/me/',
        title: 'Get Current User',
        description: 'Retrieve the profile of the currently authenticated user.',
        category: 'profile',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        requestExample: {
          curl: `curl --request GET \\
  --url ${ACCOUNTS_URL}/users/me/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `{
  "id": 1,
  "full_name": "John Doe",
  "email": "john@example.com",
  "username": "+971501234567",
  "avatar": null
}`
        },
        responseParams: [
          { name: 'id', type: 'number', required: true, description: 'Unique user ID' },
          { name: 'full_name', type: 'string', required: true, description: 'User\'s full name' },
          { name: 'email', type: 'string', required: false, description: 'User\'s email address (nullable)' },
          { name: 'username', type: 'string', required: true, description: 'Username (phone number)' },
          { name: 'avatar', type: 'object', required: false, description: 'Avatar image data (nullable)' }
        ]
      },
      {
        id: 'init-profile',
        method: 'POST',
        path: '/accounts/init_profile/',
        title: 'Initialize / Update Profile',
        description: 'Initialize profile for new users or update existing profile data.',
        category: 'profile',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        bodyParams: [
          { name: 'full_name', type: 'string', required: true, description: 'User\'s full name (minimum 2 characters)' },
          { name: 'email', type: 'string', required: false, description: 'Email address' },
          { name: 'gender', type: 'enum', required: false, description: 'User\'s gender', enum: ['male', 'female'] },
          { name: 'date_of_birth', type: 'string', required: false, description: 'Date of birth (YYYY-MM-DD format)' },
          { name: 'device_type', type: 'string', required: false, description: 'Device type (android, ios, web)' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${ACCOUNTS_URL}/init_profile/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "full_name": "John Doe",
    "email": "john@example.com",
    "gender": "male",
    "date_of_birth": "1990-01-01",
    "device_type": "android"
  }'`,
          json: `{
  "full_name": "John Doe",
  "email": "john@example.com",
  "gender": "male",
  "date_of_birth": "1990-01-01",
  "device_type": "android"
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "id": 12345,
  "full_name": "John Doe",
  "phone_number": "+971501234567",
  "email": "john@example.com",
  "username": "johndoe",
  "date_of_birth": "1990-01-01",
  "gender": "male",
  "has_empty_fields": false
}`
        },
        responseParams: [
          { name: 'id', type: 'number', required: true, description: 'User ID' },
          { name: 'full_name', type: 'string', required: true, description: 'Updated full name' },
          { name: 'has_empty_fields', type: 'boolean', required: true, description: 'Whether mandatory fields are still empty' }
        ],
        notes: [
          'This endpoint is used both for initial profile setup and subsequent updates',
          'Mandatory fields: full_name, email, date_of_birth, gender'
        ]
      },
      {
        id: 'get-user-email',
        method: 'GET',
        path: '/accounts/users/get_email/',
        title: 'Get User Email',
        description: 'Retrieve the email address associated with the current user.',
        category: 'profile',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        requestExample: {
          curl: `curl --request GET \\
  --url ${ACCOUNTS_URL}/users/get_email/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `{
  "email": "john@example.com"
}`
        },
        responseParams: [
          { name: 'email', type: 'string', required: false, description: 'User\'s email address (null if not set)' }
        ]
      },
      {
        id: 'deactivate-profile',
        method: 'POST',
        path: '/accounts/users/deactivate/',
        title: 'Deactivate Profile',
        description: 'Deactivate the user profile. This deactivates the entire account.',
        category: 'profile',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        requestExample: {
          curl: `curl --request POST \\
  --url ${ACCOUNTS_URL}/users/deactivate/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{}'`
        },
        responseExample: {
          status: 200,
          json: `{
  "message": "Profile deactivated"
}`
        },
        responseParams: [
          { name: 'message', type: 'string', required: true, description: 'Deactivation confirmation' }
        ],
        notes: [
          'WARNING: This deactivates the entire user account, not just a device session',
          'Account can be reactivated by logging in again'
        ]
      },
      {
        id: 'get-phone-numbers',
        method: 'GET',
        path: '/accounts/users/{user_id}/phone_numbers/',
        title: 'Get User Phone Numbers',
        description: 'Retrieve all phone numbers associated with a user account.',
        category: 'profile',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        pathParams: [
          { name: 'user_id', type: 'number', required: true, description: 'User ID to get phone numbers for' }
        ],
        requestExample: {
          curl: `curl --request GET \\
  --url ${ACCOUNTS_URL}/users/12345/phone_numbers/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `[
  "+971501234567",
  "+971509876543"
]`
        },
        responseParams: [
          { name: '[]', type: 'string', required: true, description: 'Array of phone numbers in international format' }
        ]
      },
      {
        id: 'update-phone-numbers',
        method: 'POST',
        path: '/accounts/users/phone_numbers/',
        title: 'Update User Phone Numbers',
        description: 'Set or update all phone numbers for the current user.',
        category: 'profile',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        bodyParams: [
          { name: 'phone_numbers', type: 'array', required: true, description: 'Array of phone numbers in international format' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${ACCOUNTS_URL}/users/phone_numbers/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "phone_numbers": ["+971501234567", "+971509876543"]
  }'`,
          json: `{
  "phone_numbers": ["+971501234567", "+971509876543"]
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "message": "Phone numbers updated"
}`
        },
        responseParams: [
          { name: 'message', type: 'string', required: true, description: 'Status message' }
        ]
      }
    ]
  },
  // ============ FILE UPLOADS ============
  {
    id: 'files',
    title: 'File Uploads',
    titleKey: 'api.categories.files',
    icon: '📁',
    endpoints: [
      {
        id: 'upload-avatar',
        method: 'POST',
        path: '/accounts/files/',
        title: 'Upload Avatar Image',
        description: 'Upload an avatar image for user profile. Uses multipart/form-data.',
        category: 'files',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        headers: [
          { name: 'Content-Type', type: 'string', required: true, description: 'Must be multipart/form-data' }
        ],
        bodyParams: [
          { name: 'file', type: 'file', required: true, description: 'Image file to upload (JPEG, PNG)' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${ACCOUNTS_URL}/files/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --form 'file=@/path/to/avatar.jpg'`
        },
        responseExample: {
          status: 200,
          json: `{
  "file": "https://apofiz.com/media/avatars/user_1.png"
}`
        },
        responseParams: [
          { name: 'file', type: 'string', required: true, description: 'URL of the uploaded avatar image' }
        ],
        notes: [
          'Maximum file size: 5MB',
          'Supported formats: JPEG, PNG'
        ]
      }
    ]
  },
  // ============ SOCIAL NETWORKS ============
  {
    id: 'social',
    title: 'Social Networks',
    titleKey: 'api.categories.social',
    icon: '🔗',
    endpoints: [
      {
        id: 'get-social-networks',
        method: 'GET',
        path: '/accounts/users/{user_id}/social_networks/',
        title: 'Get Social Networks',
        description: 'Retrieve social network links for a specific user.',
        category: 'social',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        pathParams: [
          { name: 'user_id', type: 'number', required: true, description: 'User ID to get social networks for' }
        ],
        requestExample: {
          curl: `curl --request GET \\
  --url ${ACCOUNTS_URL}/users/12345/social_networks/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `[
  {
    "id": 1,
    "url": "https://t.me/username"
  },
  {
    "id": 2,
    "url": "https://instagram.com/username"
  }
]`
        },
        responseParams: [
          { name: 'id', type: 'number', required: true, description: 'Social network entry ID' },
          { name: 'url', type: 'string', required: true, description: 'Full URL of the social network profile' }
        ]
      },
      {
        id: 'set-social-networks',
        method: 'POST',
        path: '/accounts/users/social_networks/',
        title: 'Set Social Networks',
        description: 'Set or replace all social network links for the current user.',
        category: 'social',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        bodyParams: [
          { name: 'networks', type: 'array', required: true, description: 'Array of social network URLs (replaces existing)' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${ACCOUNTS_URL}/users/social_networks/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "networks": [
      "https://t.me/username",
      "https://instagram.com/username"
    ]
  }'`,
          json: `{
  "networks": [
    "https://t.me/username",
    "https://instagram.com/username"
  ]
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "message": "Social networks updated"
}`
        },
        responseParams: [
          { name: 'message', type: 'string', required: true, description: 'Success message' }
        ]
      }
    ]
  },
  // ============ DEVICES & SESSIONS ============
  {
    id: 'devices',
    title: 'Devices & Sessions',
    titleKey: 'api.categories.devices',
    icon: '📱',
    endpoints: [
      {
        id: 'get-active-devices',
        method: 'GET',
        path: '/accounts/users/get_active_devices/',
        title: 'Get Active Devices',
        description: 'Retrieve a paginated list of all active devices/sessions for the current user.',
        category: 'devices',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        queryParams: [
          { name: 'page', type: 'number', required: false, description: 'Page number (default: 1)' },
          { name: 'limit', type: 'number', required: false, description: 'Items per page (default: 50)' }
        ],
        requestExample: {
          curl: `curl --request GET \\
  --url '${ACCOUNTS_URL}/users/get_active_devices/?page=1&limit=50' \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `{
  "list": [
    {
      "id": 123,
      "device": "iPhone 15 Pro",
      "ip_address": "192.168.1.1",
      "is_active": true
    }
  ],
  "total": 3
}`
        },
        responseParams: [
          { name: 'list', type: 'array', required: true, description: 'Array of active device objects' },
          { name: 'total', type: 'number', required: true, description: 'Total number of active devices' }
        ]
      },
      {
        id: 'get-authorization-history',
        method: 'GET',
        path: '/accounts/users/authorisation_history/',
        title: 'Get Authorization History',
        description: 'Retrieve a paginated list of all login attempts and session history.',
        category: 'devices',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        queryParams: [
          { name: 'page', type: 'number', required: false, description: 'Page number (default: 1)' },
          { name: 'limit', type: 'number', required: false, description: 'Items per page (default: 20)' }
        ],
        requestExample: {
          curl: `curl --request GET \\
  --url '${ACCOUNTS_URL}/users/authorisation_history/?page=1&limit=20' \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `{
  "list": [
    {
      "ip_address": "192.168.1.1",
      "date": "2023-10-01T12:00:00Z"
    }
  ],
  "total": 5
}`
        },
        responseParams: [
          { name: 'list', type: 'array', required: true, description: 'Array of authorization history entries' },
          { name: 'total', type: 'number', required: true, description: 'Total number of entries' }
        ]
      },
      {
        id: 'get-device-detail',
        method: 'GET',
        path: '/accounts/users/get_token_detail/{device_id}/',
        title: 'Get Device Detail',
        description: 'Retrieve detailed information about a specific device/session.',
        category: 'devices',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        pathParams: [
          { name: 'device_id', type: 'number', required: true, description: 'Device/token ID' }
        ],
        requestExample: {
          curl: `curl --request GET \\
  --url ${ACCOUNTS_URL}/users/get_token_detail/123/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `{
  "id": 123,
  "device": "iPhone 13",
  "ip_address": "192.168.1.1",
  "is_active": true
}`
        },
        responseParams: [
          { name: 'id', type: 'number', required: true, description: 'Device/token ID' },
          { name: 'device', type: 'string', required: false, description: 'Device name' },
          { name: 'ip_address', type: 'string', required: true, description: 'IP address' },
          { name: 'is_active', type: 'boolean', required: true, description: 'Session active status' }
        ]
      }
    ]
  },
  // ============ CONTACTS ============
  {
    id: 'contacts',
    title: 'Contacts',
    titleKey: 'api.categories.contacts',
    icon: '📇',
    endpoints: [
      {
        id: 'contacts-sync',
        method: 'GET',
        path: '/accounts/contacts/',
        title: 'Sync Contacts',
        description: 'Retrieve all saved contacts for the authenticated user.',
        category: 'contacts',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        requestExample: {
          curl: `curl --request GET \\
  --url ${ACCOUNTS_URL}/contacts/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `[
  {
    "id": 1,
    "apofiz_id": 50,
    "full_name": "John Doe",
    "phone": "+971501234567",
    "email": "john@example.com",
    "company": null,
    "position": null,
    "avatar_url": "https://...",
    "payment_methods": [],
    "social_links": []
  }
]`
        },
        responseParams: [
          { name: 'id', type: 'number', required: true, description: 'Contact ID' },
          { name: 'apofiz_id', type: 'number', required: false, description: 'Apofiz platform ID' },
          { name: 'full_name', type: 'string', required: true, description: 'Contact full name' },
          { name: 'phone', type: 'string', required: false, description: 'Phone number' },
          { name: 'email', type: 'string', required: false, description: 'Email address' },
          { name: 'avatar_url', type: 'string', required: false, description: 'Avatar URL' },
          { name: 'payment_methods', type: 'array', required: true, description: 'Payment methods' },
          { name: 'social_links', type: 'array', required: true, description: 'Social links' }
        ]
      }
    ]
  },
  // ============ CARDS & WALLETS ============
  {
    id: 'cards',
    title: 'Cards & Wallets',
    titleKey: 'api.categories.cards',
    icon: '💳',
    endpoints: [
      {
        id: 'get-balances',
        method: 'GET',
        path: '/cards/balances/',
        title: 'Get Balances (Legacy)',
        description: 'Retrieve balances for all user cards and total balance.',
        category: 'cards',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        requestExample: {
          curl: `curl --request GET \\
  --url ${CARDS_URL}/balances/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `{
  "user_id": "1",
  "total_balance_aed": "100000.00",
  "cards": [
    {
      "card_id": "uuid-1234",
      "type": "metal",
      "balance": "50000.00",
      "currency": "AED"
    }
  ]
}`
        },
        responseParams: [
          { name: 'user_id', type: 'string', required: true, description: 'User ID' },
          { name: 'total_balance_aed', type: 'string', required: true, description: 'Total balance in AED' },
          { name: 'cards', type: 'array', required: true, description: 'Array of card objects with balances' }
        ]
      },
      {
        id: 'get-iban-balance',
        method: 'GET',
        path: '/cards/accounts/IBAN_AED/',
        title: 'Get IBAN & Balance',
        description: 'Retrieve IBAN account details and balance.',
        category: 'cards',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        requestExample: {
          curl: `curl --request GET \\
  --url ${CARDS_URL}/accounts/IBAN_AED/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `{
  "iban": "AE070331234567890123456",
  "currency": "AED",
  "balance": "100000.00"
}`
        },
        responseParams: [
          { name: 'iban', type: 'string', required: true, description: 'IBAN account number' },
          { name: 'currency', type: 'string', required: true, description: 'Account currency' },
          { name: 'balance', type: 'string', required: true, description: 'Current balance' }
        ]
      },
      {
        id: 'get-user-cards',
        method: 'GET',
        path: '/cards/cards/',
        title: 'List User Cards',
        description: 'Retrieve all cards belonging to the authenticated user.',
        category: 'cards',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        requestExample: {
          curl: `curl --request GET \\
  --url ${CARDS_URL}/cards/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `{
  "cards": [
    {
      "type": "metal",
      "card_number": "4532112233123456",
      "currency": "AED",
      "balance": "50000.00"
    },
    {
      "type": "virtual",
      "card_number": "4532112244123456",
      "currency": "AED",
      "balance": "50000.00"
    }
  ]
}`
        },
        responseParams: [
          { name: 'cards', type: 'array', required: true, description: 'Array of card objects' },
          { name: 'cards[].type', type: 'string', required: true, description: 'Card type (metal, virtual)' },
          { name: 'cards[].card_number', type: 'string', required: true, description: '16-digit card number' },
          { name: 'cards[].currency', type: 'string', required: true, description: 'Card currency' },
          { name: 'cards[].balance', type: 'string', required: true, description: 'Current balance' }
        ]
      },
      {
        id: 'wallet-summary',
        method: 'GET',
        path: '/cards/wallet/summary/',
        title: 'Wallet Summary',
        description: 'Get combined summary of IBAN account and cards. Best for dashboard display.',
        category: 'cards',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        requestExample: {
          curl: `curl --request GET \\
  --url ${CARDS_URL}/wallet/summary/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `{
  "physical_account": {
    "iban": "AE070331234567890123456",
    "balance": "100000.00",
    "currency": "AED"
  },
  "cards": [
    {
      "id": "uuid-card",
      "type": "metal",
      "card_number": "4532112233123456",
      "currency": "AED",
      "balance": "50000.00"
    }
  ]
}`
        },
        responseParams: [
          { name: 'physical_account', type: 'object', required: true, description: 'IBAN account details' },
          { name: 'physical_account.iban', type: 'string', required: true, description: 'IBAN number' },
          { name: 'physical_account.balance', type: 'string', required: true, description: 'Account balance' },
          { name: 'cards', type: 'array', required: true, description: 'Array of user cards' }
        ],
        notes: [
          'Most convenient endpoint for the main dashboard page',
          'Combines IBAN account and all cards in a single response'
        ]
      }
    ]
  },
  // ============ TOPUPS ============
  {
    id: 'topups',
    title: 'Topups',
    titleKey: 'api.categories.topups',
    icon: '💰',
    endpoints: [
      {
        id: 'bank-topup',
        method: 'POST',
        path: '/transactions/topup/bank/',
        title: 'Bank Wire Topup',
        description: 'Initiate a bank wire topup. Returns bank details for transfer.',
        category: 'topups',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        bodyParams: [
          { name: 'transfer_rail', type: 'enum', required: true, description: 'Bank transfer type', enum: ['UAE_LOCAL_AED', 'SWIFT_INTL'] }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${TRANSACTIONS_URL}/topup/bank/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "transfer_rail": "UAE_LOCAL_AED"
  }'`,
          json: `{
  "transfer_rail": "UAE_LOCAL_AED"
}`
        },
        responseExample: {
          status: 201,
          json: `{
  "message": "Topup initiated",
  "transaction_id": "123e4567-e89b-12d3-a456-426614174000",
  "user_id": 12345,
  "instructions": {
    "bank_name": "Emirates NBD",
    "account_name": "EasyCard FZE",
    "iban": "AE070331234567890123456",
    "swift_code": "EABORAEAXXX",
    "reference": "EC-12345-TXN-123456"
  }
}`
        },
        responseParams: [
          { name: 'message', type: 'string', required: true, description: 'Status message' },
          { name: 'transaction_id', type: 'uuid', required: true, description: 'Transaction ID' },
          { name: 'instructions', type: 'object', required: true, description: 'Bank transfer instructions' }
        ],
        notes: [
          'UAE_LOCAL_AED — local UAE transfer (faster, cheaper)',
          'SWIFT_INTL — international SWIFT transfer',
          'Transaction is created in pending status until bank confirmation'
        ]
      },
      {
        id: 'crypto-topup',
        method: 'POST',
        path: '/transactions/topup/crypto/',
        title: 'Crypto Topup',
        description: 'Generate a unique crypto deposit address for card topup.',
        category: 'topups',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        bodyParams: [
          { name: 'card_id', type: 'uuid', required: true, description: 'Card ID to credit after conversion' },
          { name: 'token', type: 'enum', required: true, description: 'Stablecoin', enum: ['USDT', 'USDC'] },
          { name: 'network', type: 'enum', required: true, description: 'Blockchain network', enum: ['TRC20', 'ERC20', 'BEP20', 'SOL'] }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${TRANSACTIONS_URL}/topup/crypto/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "card_id": "550e8400-e29b-41d4-a716-446655440000",
    "token": "USDT",
    "network": "TRC20"
  }'`,
          json: `{
  "card_id": "550e8400-e29b-41d4-a716-446655440000",
  "token": "USDT",
  "network": "TRC20"
}`
        },
        responseExample: {
          status: 201,
          json: `{
  "message": "Crypto address generated",
  "deposit_address": "Txxxxxxxxx...",
  "qr_payload": "tron:Txxxxxxxxx...?amount=0&token=USDT"
}`
        },
        responseParams: [
          { name: 'message', type: 'string', required: true, description: 'Status message' },
          { name: 'deposit_address', type: 'string', required: true, description: 'Generated crypto address for deposit' },
          { name: 'qr_payload', type: 'string', required: true, description: 'String for QR code generation' }
        ],
        notes: [
          'Supported tokens: USDT, USDC',
          'Supported networks: TRC20 (Tron), ERC20 (Ethereum), BEP20 (BSC), SOL (Solana)'
        ]
      }
    ]
  },
  // ============ TRANSFERS ============
  {
    id: 'transfers',
    title: 'Transfers',
    titleKey: 'api.categories.transfers',
    icon: '🔄',
    endpoints: [
      {
        id: 'card-transfer',
        method: 'POST',
        path: '/transactions/transfer/card/',
        title: 'Card to Card Transfer',
        description: 'Instant transfer between cards within the platform.',
        category: 'transfers',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        bodyParams: [
          { name: 'sender_card_id', type: 'uuid', required: true, description: 'Sender card ID' },
          { name: 'receiver_card_number', type: 'string', required: true, description: '16-digit recipient card number' },
          { name: 'amount', type: 'string', required: true, description: 'Transfer amount' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${TRANSACTIONS_URL}/transfer/card/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "sender_card_id": "550e8400-e29b-41d4-a716-446655440000",
    "receiver_card_number": "4532112233123456",
    "amount": "100.00"
  }'`,
          json: `{
  "sender_card_id": "550e8400-e29b-41d4-a716-446655440000",
  "receiver_card_number": "4532112233123456",
  "amount": "100.00"
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "message": "Transfer successful",
  "transaction_id": "uuid-transaction",
  "amount": "100.00",
  "fee": "1.00"
}`
        },
        responseParams: [
          { name: 'message', type: 'string', required: true, description: 'Status message' },
          { name: 'transaction_id', type: 'uuid', required: true, description: 'Transaction ID' },
          { name: 'amount', type: 'string', required: true, description: 'Transfer amount' },
          { name: 'fee', type: 'string', required: true, description: 'Fee amount (1%)' }
        ]
      },
      {
        id: 'crypto-withdrawal',
        method: 'POST',
        path: '/transactions/withdrawal/crypto/',
        title: 'Card → External Crypto Wallet',
        description: 'Withdraw from card to an external crypto wallet address.',
        category: 'transfers',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        bodyParams: [
          { name: 'from_card_id', type: 'uuid', required: true, description: 'Source card ID' },
          { name: 'token', type: 'enum', required: true, description: 'Token type', enum: ['USDT', 'USDC'] },
          { name: 'network', type: 'enum', required: true, description: 'Blockchain network', enum: ['TRC20', 'ERC20', 'BEP20', 'SOL'] },
          { name: 'to_address', type: 'string', required: true, description: 'Destination crypto address' },
          { name: 'amount_crypto', type: 'string', required: true, description: 'Amount in crypto' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${TRANSACTIONS_URL}/withdrawal/crypto/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "from_card_id": "uuid-card",
    "token": "USDT",
    "network": "TRC20",
    "to_address": "Txxxxxxxxx...",
    "amount_crypto": "100.000000"
  }'`,
          json: `{
  "from_card_id": "uuid-card",
  "token": "USDT",
  "network": "TRC20",
  "to_address": "Txxxxxxxxx...",
  "amount_crypto": "100.000000"
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "message": "Withdrawal processing",
  "transaction_id": "uuid-transaction",
  "total_debit_crypto": "101.500000"
}`
        },
        responseParams: [
          { name: 'message', type: 'string', required: true, description: 'Status message' },
          { name: 'transaction_id', type: 'uuid', required: true, description: 'Transaction ID' },
          { name: 'total_debit_crypto', type: 'string', required: true, description: 'Total debit including fee' }
        ]
      },
      {
        id: 'bank-withdrawal',
        method: 'POST',
        path: '/transactions/withdrawal/bank/',
        title: 'Card → External Bank (Wire)',
        description: 'Withdraw from card/account to an external bank account.',
        category: 'transfers',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        bodyParams: [
          { name: 'receiver_card_number', type: 'string', required: true, description: 'Recipient card number' },
          { name: 'amount', type: 'string', required: true, description: 'Transfer amount' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${TRANSACTIONS_URL}/withdrawal/bank/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "receiver_card_number": "4532112233123456",
    "amount": "100.00"
  }'`,
          json: `{
  "receiver_card_number": "4532112233123456",
  "amount": "100.00"
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "message": "Transfer successful",
  "transaction_id": "uuid-transaction",
  "amount": "100.00"
}`
        },
        responseParams: [
          { name: 'message', type: 'string', required: true, description: 'Status message' },
          { name: 'transaction_id', type: 'uuid', required: true, description: 'Transaction ID' },
          { name: 'amount', type: 'string', required: true, description: 'Transfer amount' }
        ]
      },
      {
        id: 'card-to-crypto',
        method: 'POST',
        path: '/transactions/transfer/card-to-crypto/',
        title: 'Card → Crypto Wallet',
        description: 'Transfer from card balance to internal crypto wallet.',
        category: 'transfers',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        bodyParams: [
          { name: 'from_card_id', type: 'uuid', required: true, description: 'Source card ID' },
          { name: 'to_wallet_id', type: 'uuid', required: true, description: 'Destination crypto wallet ID' },
          { name: 'amount_aed', type: 'string', required: true, description: 'Amount in AED' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${TRANSACTIONS_URL}/transfer/card-to-crypto/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "from_card_id": "uuid-card",
    "to_wallet_id": "uuid-wallet",
    "amount_aed": "1000.00"
  }'`,
          json: `{
  "from_card_id": "uuid-card",
  "to_wallet_id": "uuid-wallet",
  "amount_aed": "1000.00"
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "message": "Transfer successful",
  "transaction_id": "uuid-transaction",
  "deducted_amount": "1000.00",
  "fee": "15.00",
  "credited_amount": "268.000000"
}`
        },
        responseParams: [
          { name: 'transaction_id', type: 'uuid', required: true, description: 'Transaction ID' },
          { name: 'deducted_amount', type: 'string', required: true, description: 'Amount deducted from card' },
          { name: 'fee', type: 'string', required: true, description: 'Fee amount' },
          { name: 'credited_amount', type: 'string', required: true, description: 'Amount credited to crypto wallet' }
        ]
      },
      {
        id: 'crypto-to-card',
        method: 'POST',
        path: '/transactions/transfer/crypto-to-card/',
        title: 'Crypto Wallet → Card',
        description: 'Transfer from internal crypto wallet to card balance.',
        category: 'transfers',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        bodyParams: [
          { name: 'from_wallet_id', type: 'uuid', required: true, description: 'Source crypto wallet ID' },
          { name: 'to_card_number', type: 'string', required: true, description: '16-digit card number' },
          { name: 'amount_usdt', type: 'string', required: true, description: 'Amount in USDT' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${TRANSACTIONS_URL}/transfer/crypto-to-card/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "from_wallet_id": "uuid-wallet",
    "to_card_number": "4532112233123456",
    "amount_usdt": "50.000000"
  }'`,
          json: `{
  "from_wallet_id": "uuid-wallet",
  "to_card_number": "4532112233123456",
  "amount_usdt": "50.000000"
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "message": "Transfer successful",
  "transaction_id": "uuid-transaction",
  "deducted_amount": "50.000000",
  "fee": "1.000000",
  "credited_amount": "180.050000"
}`
        },
        responseParams: [
          { name: 'transaction_id', type: 'uuid', required: true, description: 'Transaction ID' },
          { name: 'deducted_amount', type: 'string', required: true, description: 'Amount deducted from wallet' },
          { name: 'fee', type: 'string', required: true, description: 'Fee amount' },
          { name: 'credited_amount', type: 'string', required: true, description: 'Amount credited to card (AED)' }
        ]
      },
      {
        id: 'bank-to-crypto',
        method: 'POST',
        path: '/transactions/transfer/bank-to-crypto/',
        title: 'IBAN → Crypto Wallet',
        description: 'Transfer from IBAN bank account to internal crypto wallet.',
        category: 'transfers',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        bodyParams: [
          { name: 'from_bank_account_id', type: 'uuid', required: true, description: 'Source bank account ID' },
          { name: 'to_crypto_address', type: 'string', required: true, description: 'Destination crypto address' },
          { name: 'amount_aed', type: 'string', required: true, description: 'Amount in AED' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${TRANSACTIONS_URL}/transfer/bank-to-crypto/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "from_bank_account_id": "uuid-bank-account",
    "to_crypto_address": "Txxxxxx...",
    "amount_aed": "1000.00"
  }'`,
          json: `{
  "from_bank_account_id": "uuid-bank-account",
  "to_crypto_address": "Txxxxxx...",
  "amount_aed": "1000.00"
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "message": "Transfer successful",
  "transaction_id": "uuid-transaction",
  "deducted_amount": "1000.000000",
  "fee": "15.000000",
  "credited_amount": "268.000000"
}`
        },
        responseParams: [
          { name: 'transaction_id', type: 'uuid', required: true, description: 'Transaction ID' },
          { name: 'deducted_amount', type: 'string', required: true, description: 'Amount deducted' },
          { name: 'fee', type: 'string', required: true, description: 'Fee amount' },
          { name: 'credited_amount', type: 'string', required: true, description: 'Crypto amount credited' }
        ]
      },
      {
        id: 'crypto-to-bank',
        method: 'POST',
        path: '/transactions/transfer/crypto-to-bank/',
        title: 'Crypto Wallet → IBAN',
        description: 'Transfer from internal crypto wallet to IBAN bank account.',
        category: 'transfers',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        bodyParams: [
          { name: 'from_wallet_id', type: 'uuid', required: true, description: 'Source crypto wallet ID' },
          { name: 'to_iban', type: 'string', required: true, description: 'Destination IBAN' },
          { name: 'amount_usdt', type: 'string', required: true, description: 'Amount in USDT' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${TRANSACTIONS_URL}/transfer/crypto-to-bank/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "from_wallet_id": "uuid-wallet",
    "to_iban": "AE070331234567890123456",
    "amount_usdt": "100.000000"
  }'`,
          json: `{
  "from_wallet_id": "uuid-wallet",
  "to_iban": "AE070331234567890123456",
  "amount_usdt": "100.000000"
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "message": "Transfer successful",
  "transaction_id": "uuid-transaction",
  "deducted_amount": "100.000000",
  "fee": "2.000000",
  "credited_amount": "360.000000"
}`
        },
        responseParams: [
          { name: 'transaction_id', type: 'uuid', required: true, description: 'Transaction ID' },
          { name: 'deducted_amount', type: 'string', required: true, description: 'USDT deducted' },
          { name: 'fee', type: 'string', required: true, description: 'Fee amount' },
          { name: 'credited_amount', type: 'string', required: true, description: 'AED credited to IBAN' }
        ]
      },
      {
        id: 'card-to-bank',
        method: 'POST',
        path: '/transactions/transfer/card-to-bank/',
        title: 'Card → IBAN',
        description: 'Transfer from card balance to IBAN bank account.',
        category: 'transfers',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        bodyParams: [
          { name: 'from_card_id', type: 'uuid', required: true, description: 'Source card ID' },
          { name: 'to_iban', type: 'string', required: true, description: 'Destination IBAN' },
          { name: 'amount_aed', type: 'string', required: true, description: 'Amount in AED' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${TRANSACTIONS_URL}/transfer/card-to-bank/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "from_card_id": "uuid-card",
    "to_iban": "AE070331234567890123456",
    "amount_aed": "200.00"
  }'`,
          json: `{
  "from_card_id": "uuid-card",
  "to_iban": "AE070331234567890123456",
  "amount_aed": "200.00"
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "message": "Transfer successful",
  "transaction_id": "uuid-transaction",
  "deducted_amount": "200.000000",
  "fee": "4.000000",
  "credited_amount": "196.000000"
}`
        },
        responseParams: [
          { name: 'transaction_id', type: 'uuid', required: true, description: 'Transaction ID' },
          { name: 'deducted_amount', type: 'string', required: true, description: 'Amount deducted from card' },
          { name: 'fee', type: 'string', required: true, description: 'Fee amount' },
          { name: 'credited_amount', type: 'string', required: true, description: 'Amount credited to IBAN' }
        ]
      },
      {
        id: 'bank-to-card',
        method: 'POST',
        path: '/transactions/transfer/bank-to-card/',
        title: 'IBAN → Card',
        description: 'Transfer from IBAN bank account to card.',
        category: 'transfers',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        bodyParams: [
          { name: 'from_bank_account_id', type: 'uuid', required: true, description: 'Source IBAN account ID' },
          { name: 'receiver_card_number', type: 'string', required: true, description: 'Recipient card number' },
          { name: 'amount', type: 'string', required: true, description: 'Transfer amount' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${TRANSACTIONS_URL}/transfer/bank-to-card/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "from_bank_account_id": "uuid-bank-account",
    "receiver_card_number": "4532112233123456",
    "amount": "500.00"
  }'`,
          json: `{
  "from_bank_account_id": "uuid-bank-account",
  "receiver_card_number": "4532112233123456",
  "amount": "500.00"
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "message": "Transfer successful",
  "transaction_id": "uuid-transaction",
  "amount": "500.00",
  "fee": "10.00",
  "total_debit": "510.00"
}`
        },
        responseParams: [
          { name: 'transaction_id', type: 'uuid', required: true, description: 'Transaction ID' },
          { name: 'amount', type: 'string', required: true, description: 'Transfer amount' },
          { name: 'fee', type: 'string', required: true, description: 'Fee amount' },
          { name: 'total_debit', type: 'string', required: true, description: 'Total debit (amount + fee)' }
        ]
      }
    ]
  },
  // ============ TRANSACTION HISTORY ============
  {
    id: 'transaction-history',
    title: 'Transaction History',
    titleKey: 'api.categories.transactionHistory',
    icon: '📊',
    endpoints: [
      {
        id: 'transactions-all',
        method: 'GET',
        path: '/transactions/all/',
        title: 'All Transactions',
        description: 'Get all transactions for the authenticated user.',
        category: 'transaction-history',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        requestExample: {
          curl: `curl --request GET \\
  --url ${TRANSACTIONS_URL}/all/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `[
  {
    "id": "uuid-transaction",
    "type": "transfer",
    "direction": "outbound",
    "status": "completed",
    "amount": "100.00",
    "currency": "AED",
    "fee": "2.00",
    "exchange_rate": null,
    "original_amount": null,
    "original_currency": null,
    "merchant_name": null,
    "recipient_card": "4532112233123456",
    "sender_name": "John Doe",
    "created_at": "2023-10-01T15:30:00Z",
    "updated_at": "2023-10-01T15:30:05Z"
  }
]`
        },
        responseParams: [
          { name: 'id', type: 'uuid', required: true, description: 'Transaction ID' },
          { name: 'type', type: 'string', required: true, description: 'Transaction type' },
          { name: 'direction', type: 'enum', required: true, description: 'Direction', enum: ['inbound', 'outbound', 'internal'] },
          { name: 'status', type: 'string', required: true, description: 'Transaction status' },
          { name: 'amount', type: 'string', required: true, description: 'Amount' },
          { name: 'currency', type: 'string', required: true, description: 'Currency' },
          { name: 'fee', type: 'string', required: false, description: 'Fee amount' },
          { name: 'merchant_name', type: 'string', required: false, description: 'Merchant name (for card payments)' },
          { name: 'created_at', type: 'string', required: true, description: 'Creation timestamp' }
        ]
      },
      {
        id: 'transactions-iban',
        method: 'GET',
        path: '/transactions/iban/',
        title: 'Bank (IBAN) Transactions',
        description: 'Get bank-related transactions only.',
        category: 'transaction-history',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        requestExample: {
          curl: `curl --request GET \\
  --url ${TRANSACTIONS_URL}/iban/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `[
  {
    "id": "uuid-transaction",
    "type": "top_up",
    "direction": "inbound",
    "status": "completed",
    "amount": "5000.00",
    "currency": "AED",
    "created_at": "2023-10-01T15:30:00Z"
  }
]`
        },
        responseParams: [
          { name: '[]', type: 'array', required: true, description: 'Array of bank transactions (same format as all transactions)' }
        ]
      },
      {
        id: 'transactions-card',
        method: 'GET',
        path: '/transactions/card-transactions/',
        title: 'Card Transactions',
        description: 'Get card-related transactions only.',
        category: 'transaction-history',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        requestExample: {
          curl: `curl --request GET \\
  --url ${TRANSACTIONS_URL}/card-transactions/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `[
  {
    "id": "uuid-transaction",
    "type": "card_payment",
    "direction": "outbound",
    "status": "completed",
    "amount": "250.00",
    "currency": "AED",
    "merchant_name": "Amazon",
    "created_at": "2023-10-01T15:30:00Z"
  }
]`
        },
        responseParams: [
          { name: '[]', type: 'array', required: true, description: 'Array of card transactions' }
        ]
      },
      {
        id: 'transactions-crypto',
        method: 'GET',
        path: '/transactions/crypto/',
        title: 'Crypto Transactions',
        description: 'Get crypto-related transactions only.',
        category: 'transaction-history',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        requestExample: {
          curl: `curl --request GET \\
  --url ${TRANSACTIONS_URL}/crypto/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `[
  {
    "id": "uuid-transaction",
    "type": "top_up",
    "direction": "inbound",
    "status": "completed",
    "amount": "1000.000000",
    "currency": "USDT",
    "created_at": "2023-10-01T15:30:00Z"
  }
]`
        },
        responseParams: [
          { name: '[]', type: 'array', required: true, description: 'Array of crypto transactions' }
        ]
      },
      {
        id: 'recipient-info',
        method: 'GET',
        path: '/transactions/recipient-info/',
        title: 'Recipient Info',
        description: 'Look up recipient name by card number or IBAN.',
        category: 'transaction-history',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        queryParams: [
          { name: 'card_number', type: 'string', required: true, description: '16-digit card number to look up' }
        ],
        requestExample: {
          curl: `curl --request GET \\
  --url '${TRANSACTIONS_URL}/recipient-info/?card_number=4532112233123456' \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `{
  "recipient_name": "John Doe",
  "card_type": "metal",
  "avatar_url": "https://..."
}`
        },
        responseParams: [
          { name: 'recipient_name', type: 'string', required: true, description: 'Recipient full name' },
          { name: 'card_type', type: 'string', required: false, description: 'Card type (metal, virtual)' },
          { name: 'avatar_url', type: 'string', required: false, description: 'Recipient avatar URL' }
        ]
      }
    ]
  },
  // ============ BANK & CRYPTO ACCOUNTS ============
  {
    id: 'accounts-info',
    title: 'Bank & Crypto Accounts',
    titleKey: 'api.categories.accountsInfo',
    icon: '🏦',
    endpoints: [
      {
        id: 'bank-accounts',
        method: 'GET',
        path: '/transactions/bank-accounts/',
        title: 'My Bank Accounts (IBAN)',
        description: 'Retrieve all IBAN bank accounts for the current user.',
        category: 'accounts-info',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        requestExample: {
          curl: `curl --request GET \\
  --url ${TRANSACTIONS_URL}/bank-accounts/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `[
  {
    "id": "uuid-account",
    "iban": "AE070331234567890123456",
    "bank_name": "EasyCard Default Bank",
    "beneficiary": "John Doe",
    "balance": "200000.00",
    "is_active": true
  }
]`
        },
        responseParams: [
          { name: 'id', type: 'uuid', required: true, description: 'Account ID' },
          { name: 'iban', type: 'string', required: true, description: 'IBAN number' },
          { name: 'bank_name', type: 'string', required: true, description: 'Bank name' },
          { name: 'beneficiary', type: 'string', required: true, description: 'Account holder name' },
          { name: 'balance', type: 'string', required: true, description: 'Current balance' },
          { name: 'is_active', type: 'boolean', required: true, description: 'Account status' }
        ]
      },
      {
        id: 'crypto-wallets',
        method: 'GET',
        path: '/transactions/crypto-wallets/',
        title: 'My Crypto Wallets',
        description: 'Retrieve all crypto wallets for the current user.',
        category: 'accounts-info',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        requestExample: {
          curl: `curl --request GET \\
  --url ${TRANSACTIONS_URL}/crypto-wallets/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `[
  {
    "id": "uuid-wallet",
    "network": "TRC20",
    "token": "USDT",
    "address": "Txxxxxx...",
    "balance": "200000.000000",
    "is_active": true
  }
]`
        },
        responseParams: [
          { name: 'id', type: 'uuid', required: true, description: 'Wallet ID' },
          { name: 'network', type: 'string', required: true, description: 'Blockchain network' },
          { name: 'token', type: 'string', required: true, description: 'Token type' },
          { name: 'address', type: 'string', required: true, description: 'Wallet address' },
          { name: 'balance', type: 'string', required: true, description: 'Current balance' },
          { name: 'is_active', type: 'boolean', required: true, description: 'Wallet status' }
        ]
      }
    ]
  },
  // ============ RECEIPTS ============
  {
    id: 'receipts',
    title: 'Receipts',
    titleKey: 'api.categories.receipts',
    icon: '🧾',
    endpoints: [
      {
        id: 'transaction-receipt',
        method: 'GET',
        path: '/transactions/{transaction_id}/receipt/',
        title: 'Get Transaction Receipt',
        description: 'Get structured receipt for a specific transaction. Response format adapts to transaction type.',
        category: 'receipts',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        pathParams: [
          { name: 'transaction_id', type: 'uuid', required: true, description: 'Transaction ID' }
        ],
        requestExample: {
          curl: `curl --request GET \\
  --url ${TRANSACTIONS_URL}/123e4567-e89b-12d3-a456-426614174000/receipt/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `{
  "transaction_id": "uuid...",
  "date": "2023-10-01T15:30:00Z",
  "amount": "100.00",
  "currency": "AED",
  "fee": "2.00",
  "status": "completed",
  "sender": "John Doe",
  "receiver": "Jane Smith",
  "description": "Transfer"
}`
        },
        responseParams: [
          { name: 'transaction_id', type: 'uuid', required: true, description: 'Transaction ID' },
          { name: 'date', type: 'string', required: true, description: 'Transaction date (ISO 8601)' },
          { name: 'amount', type: 'string', required: true, description: 'Transaction amount' },
          { name: 'currency', type: 'string', required: true, description: 'Currency' },
          { name: 'fee', type: 'string', required: false, description: 'Fee amount (if applicable)' },
          { name: 'status', type: 'string', required: true, description: 'Status: pending, completed, failed, cancelled' },
          { name: 'sender', type: 'string', required: false, description: 'Sender name' },
          { name: 'receiver', type: 'string', required: false, description: 'Receiver name' }
        ],
        notes: [
          'Response format varies by transaction type',
          'Card transfers include sender/receiver card masks',
          'Crypto transactions include token, network, and address',
          'Bank transfers include IBAN and bank details'
        ]
      }
    ]
  }
];

// Helper function to get all endpoints
export const getAllEndpoints = (): ApiEndpoint[] => {
  return apiCategories.flatMap(category => category.endpoints);
};

// Helper function to get endpoint by ID
export const getEndpointById = (id: string): ApiEndpoint | undefined => {
  return getAllEndpoints().find(endpoint => endpoint.id === id);
};

// Helper function to get category by ID
export const getCategoryById = (id: string): ApiCategory | undefined => {
  return apiCategories.find(category => category.id === id);
};

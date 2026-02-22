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

// Base API URL
export const API_BASE_URL = 'https://apofiz.com/api/v1';

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
        path: '/otp/send/',
        title: 'Send OTP',
        description: 'Send a one-time password to the user\'s phone number via SMS or WhatsApp for verification.',
        category: 'authentication',
        bodyParams: [
          { name: 'phone_number', type: 'string', required: true, description: 'Phone number in international format (e.g., +971501234567)' },
          { name: 'type', type: 'enum', required: false, description: 'Delivery method for OTP', enum: ['sms', 'whatsapp'] }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${API_BASE_URL}/otp/send/ \\
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
        path: '/otp/verify/',
        title: 'Verify OTP',
        description: 'Verify the OTP code sent to the user\'s phone. Returns authentication token on success.',
        category: 'authentication',
        bodyParams: [
          { name: 'phone_number', type: 'string', required: true, description: 'Phone number in international format' },
          { name: 'code', type: 'string', required: true, description: '6-digit OTP code' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${API_BASE_URL}/otp/verify/ \\
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
        path: '/register_auth/',
        title: 'Register / Check Phone',
        description: 'Check if a phone number is registered and initiate the registration process if not.',
        category: 'authentication',
        bodyParams: [
          { name: 'phone_number', type: 'string', required: true, description: 'Phone number in international format' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${API_BASE_URL}/register_auth/ \\
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
  "message": "Verification code sent",
  "is_new_user": true,
  "token": null,
  "temporary_code_enabled": false,
  "email": false
}`
        },
        responseParams: [
          { name: 'message', type: 'string', required: true, description: 'Status message' },
          { name: 'is_new_user', type: 'boolean', required: true, description: 'Whether this is a new registration' },
          { name: 'token', type: 'string', required: false, description: 'Auth token (for existing users)' },
          { name: 'temporary_code_enabled', type: 'boolean', required: false, description: 'If temporary codes are enabled for testing' },
          { name: 'email', type: 'boolean', required: false, description: 'Whether user has email configured' }
        ]
      },
      {
        id: 'verify-code',
        method: 'POST',
        path: '/verify_code/',
        title: 'Verify SMS Code',
        description: 'Verify the SMS code sent during registration.',
        category: 'authentication',
        bodyParams: [
          { name: 'phone_number', type: 'string', required: true, description: 'Phone number in international format' },
          { name: 'code', type: 'number', required: true, description: '6-digit verification code as integer' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${API_BASE_URL}/verify_code/ \\
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
  "message": "Code verified successfully",
  "token": "abc123xyz789token",
  "is_new_user": true
}`
        },
        responseParams: [
          { name: 'message', type: 'string', required: true, description: 'Success message' },
          { name: 'token', type: 'string', required: true, description: 'Authentication token' },
          { name: 'is_new_user', type: 'boolean', required: true, description: 'Whether user needs to complete profile setup' }
        ]
      },
      {
        id: 'resend-code',
        method: 'POST',
        path: '/resend_code/',
        title: 'Resend Code',
        description: 'Resend verification code to the user\'s phone number.',
        category: 'authentication',
        bodyParams: [
          { name: 'phone_number', type: 'string', required: true, description: 'Phone number in international format' },
          { name: 'type', type: 'enum', required: false, description: 'Resend method', enum: ['register_auth_type', 'whatsapp_auth_type', 'email_auth_type'] }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${API_BASE_URL}/resend_code/ \\
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
        path: '/login/',
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
  --url ${API_BASE_URL}/login/ \\
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
        path: '/logout/',
        title: 'Logout',
        description: 'Invalidate the current authentication token and end the session.',
        category: 'authentication',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        requestExample: {
          curl: `curl --request POST \\
  --url ${API_BASE_URL}/logout/ \\
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
        path: '/set_password/',
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
  --url ${API_BASE_URL}/set_password/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "password": "securePassword123"
  }'`,
          json: `{
  "password": "securePassword123"
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
        path: '/users/doChangePassword/',
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
  --url ${API_BASE_URL}/users/doChangePassword/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "old_password": "oldPassword123",
    "new_password": "newPassword456"
  }'`,
          json: `{
  "old_password": "oldPassword123",
  "new_password": "newPassword456"
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
        path: '/users/forgot_password/',
        title: 'Forgot Password',
        description: 'Request a password reset code to be sent via SMS, WhatsApp, or email.',
        category: 'password',
        bodyParams: [
          { name: 'phone_number', type: 'string', required: true, description: 'Phone number in international format' },
          { name: 'method', type: 'enum', required: false, description: 'Delivery method for reset code', enum: ['sms', 'whatsapp', 'email'] }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${API_BASE_URL}/users/forgot_password/ \\
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
  "message": "Reset code sent",
  "method": "whatsapp",
  "available_methods": ["sms", "whatsapp", "email"]
}`
        },
        responseParams: [
          { name: 'message', type: 'string', required: true, description: 'Status message' },
          { name: 'method', type: 'string', required: true, description: 'Method used to send the code' },
          { name: 'available_methods', type: 'array', required: true, description: 'List of available recovery methods' }
        ],
        notes: [
          'Email method is only available if user has email configured',
          'Default method is WhatsApp, except for +996 (Kyrgyzstan) which uses SMS'
        ]
      },
      {
        id: 'forgot-password-email',
        method: 'POST',
        path: '/users/forgot_password_email/',
        title: 'Forgot Password (Email)',
        description: 'Request a password reset code to be sent to the user\'s registered email.',
        category: 'password',
        authorization: {
          type: 'Token',
          description: 'Token authentication header (for logged in users who want to verify email)'
        },
        requestExample: {
          curl: `curl --request POST \\
  --url ${API_BASE_URL}/users/forgot_password_email/ \\
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
        path: '/users/me/',
        title: 'Get Current User',
        description: 'Retrieve the profile of the currently authenticated user.',
        category: 'profile',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        requestExample: {
          curl: `curl --request GET \\
  --url ${API_BASE_URL}/users/me/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `{
  "id": 12345,
  "full_name": "John Doe",
  "phone_number": "+971501234567",
  "email": "john@example.com",
  "avatar": {
    "id": 1,
    "file": "https://cdn.apofiz.com/avatars/user123.jpg",
    "name": "avatar.jpg",
    "large": "https://cdn.apofiz.com/avatars/user123_large.jpg",
    "medium": "https://cdn.apofiz.com/avatars/user123_medium.jpg",
    "small": "https://cdn.apofiz.com/avatars/user123_small.jpg"
  },
  "username": "johndoe",
  "date_of_birth": "1990-05-15",
  "gender": "male",
  "has_empty_fields": false
}`
        },
        responseParams: [
          { name: 'id', type: 'number', required: true, description: 'Unique user ID' },
          { name: 'full_name', type: 'string', required: true, description: 'User\'s full name' },
          { name: 'phone_number', type: 'string', required: true, description: 'User\'s phone number' },
          { name: 'email', type: 'string', required: false, description: 'User\'s email address (nullable)' },
          { name: 'avatar', type: 'object', required: false, description: 'Avatar image data with multiple sizes' },
          { name: 'username', type: 'string', required: false, description: 'Unique username' },
          { name: 'date_of_birth', type: 'string', required: false, description: 'Date of birth (YYYY-MM-DD format)' },
          { name: 'gender', type: 'enum', required: false, description: 'User\'s gender', enum: ['male', 'female'] },
          { name: 'has_empty_fields', type: 'boolean', required: true, description: 'Indicates if profile has incomplete fields' }
        ]
      },
      {
        id: 'init-profile',
        method: 'POST',
        path: '/init_profile/',
        title: 'Initialize / Update Profile',
        description: 'Initialize profile for new users or update existing profile data.',
        category: 'profile',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        bodyParams: [
          { name: 'full_name', type: 'string', required: true, description: 'User\'s full name (minimum 2 characters)' },
          { name: 'avatar_id', type: 'number', required: false, description: 'ID of uploaded avatar file' },
          { name: 'email', type: 'string', required: false, description: 'Email address' },
          { name: 'gender', type: 'enum', required: false, description: 'User\'s gender', enum: ['male', 'female'] },
          { name: 'date_of_birth', type: 'string', required: false, description: 'Date of birth (YYYY-MM-DD format)' },
          { name: 'username', type: 'string', required: false, description: 'Unique username (minimum 3 characters)' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${API_BASE_URL}/init_profile/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "full_name": "John Doe",
    "email": "john@example.com",
    "username": "johndoe",
    "gender": "male",
    "date_of_birth": "1990-05-15",
    "avatar_id": 123
  }'`,
          json: `{
  "full_name": "John Doe",
  "email": "john@example.com",
  "username": "johndoe",
  "gender": "male",
  "date_of_birth": "1990-05-15",
  "avatar_id": 123
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "id": 12345,
  "full_name": "John Doe",
  "phone_number": "+971501234567",
  "email": "john@example.com",
  "avatar": {
    "id": 123,
    "file": "https://cdn.apofiz.com/avatars/user123.jpg",
    "large": "https://cdn.apofiz.com/avatars/user123_large.jpg",
    "medium": "https://cdn.apofiz.com/avatars/user123_medium.jpg",
    "small": "https://cdn.apofiz.com/avatars/user123_small.jpg"
  },
  "username": "johndoe",
  "date_of_birth": "1990-05-15",
  "gender": "male",
  "has_empty_fields": false
}`
        },
        responseParams: [
          { name: 'id', type: 'number', required: true, description: 'User ID' },
          { name: 'full_name', type: 'string', required: true, description: 'Updated full name' },
          { name: 'email', type: 'string', required: false, description: 'Updated email' },
          { name: 'username', type: 'string', required: false, description: 'Updated username' },
          { name: 'gender', type: 'enum', required: false, description: 'Updated gender' },
          { name: 'date_of_birth', type: 'string', required: false, description: 'Updated date of birth' },
          { name: 'has_empty_fields', type: 'boolean', required: true, description: 'Whether mandatory fields are still empty' }
        ],
        notes: [
          'This endpoint is used both for initial profile setup and subsequent updates',
          'Mandatory fields: full_name, username, email, date_of_birth, gender',
          'Username must be unique across all users'
        ]
      },
      {
        id: 'get-user-email',
        method: 'GET',
        path: '/users/get_email/',
        title: 'Get User Email',
        description: 'Retrieve the email address associated with the current user.',
        category: 'profile',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        requestExample: {
          curl: `curl --request GET \\
  --url ${API_BASE_URL}/users/get_email/ \\
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
        path: '/users/deactivate/',
        title: 'Deactivate Profile',
        description: 'Deactivate the user profile. This is NOT for device logout - it deactivates the entire account.',
        category: 'profile',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        requestExample: {
          curl: `curl --request POST \\
  --url ${API_BASE_URL}/users/deactivate/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `{
  "success": true
}`
        },
        responseParams: [
          { name: 'success', type: 'boolean', required: true, description: 'Whether the deactivation was successful' }
        ],
        notes: [
          'WARNING: This deactivates the entire user account, not just a device session',
          'Account can be reactivated by logging in again',
          'All active sessions will be terminated'
        ]
      },
      {
        id: 'get-phone-numbers',
        method: 'GET',
        path: '/users/{user_id}/phone_numbers/',
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
  --url ${API_BASE_URL}/users/12345/phone_numbers/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json'`
        },
        responseExample: {
          status: 200,
          json: `[
  {
    "id": 58,
    "phone_number": "+996777123123"
  },
  {
    "id": 59,
    "phone_number": "+996312700002"
  }
]`
        },
        responseParams: [
          { name: 'id', type: 'number', required: true, description: 'Phone number record ID' },
          { name: 'phone_number', type: 'string', required: true, description: 'Phone number in international format' }
        ],
        notes: [
          'Returns an array of phone numbers associated with the user',
          'Each phone number has a unique ID for update/delete operations',
          'User can only retrieve their own phone numbers'
        ]
      },
      {
        id: 'update-phone-numbers',
        method: 'POST',
        path: '/users/phone_numbers/',
        title: 'Update User Phone Numbers',
        description: 'Set or update all phone numbers for the current user. Replaces the existing list with the new one.',
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
  --url ${API_BASE_URL}/users/phone_numbers/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{
  "phone_numbers": [
    "+996777123123",
    "+996312700001"
  ]
}'`,
          json: `{
  "phone_numbers": [
    "+996777123123",
    "+996312700001"
  ]
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "message": "Successfully updated",
  "numbers": [
    {
      "phone_number": "+996777123123"
    },
    {
      "phone_number": "+996312700002"
    }
  ]
}`
        },
        responseParams: [
          { name: 'message', type: 'string', required: true, description: 'Status message' },
          { name: 'numbers', type: 'array', required: true, description: 'Array of saved phone numbers' }
        ],
        notes: [
          'This endpoint replaces all existing phone numbers with the new list',
          'Phone numbers must be in international format (starting with +)',
          'Returns 406 if phone_numbers field is missing or contains invalid values'
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
        path: '/files/',
        title: 'Upload Avatar Image',
        description: 'Upload an avatar image for user profile. Returns file data with multiple size variants (large, medium, small).',
        category: 'files',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        headers: [
          { name: 'Content-Type', type: 'string', required: true, description: 'Must be multipart/form-data (set automatically by browser)' }
        ],
        bodyParams: [
          { name: 'file', type: 'file', required: true, description: 'Image file to upload (JPEG, PNG)' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${API_BASE_URL}/files/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --form 'file=@/path/to/avatar.jpg'`
        },
        responseExample: {
          status: 200,
          json: `{
  "id": 123,
  "file": "https://cdn.apofiz.com/uploads/image123.jpg",
  "name": "avatar.jpg",
  "large": "https://cdn.apofiz.com/uploads/image123_large.jpg",
  "medium": "https://cdn.apofiz.com/uploads/image123_medium.jpg",
  "small": "https://cdn.apofiz.com/uploads/image123_small.jpg"
}`
        },
        responseParams: [
          { name: 'id', type: 'number', required: true, description: 'Unique file ID (use this for avatar_id in profile update)' },
          { name: 'file', type: 'string', required: true, description: 'Original file URL' },
          { name: 'name', type: 'string', required: false, description: 'Original filename' },
          { name: 'large', type: 'string', required: false, description: 'Large variant URL (for high-res displays)' },
          { name: 'medium', type: 'string', required: false, description: 'Medium variant URL (for standard displays)' },
          { name: 'small', type: 'string', required: false, description: 'Small variant URL (for thumbnails)' }
        ],
        notes: [
          'Maximum file size: 5MB',
          'Supported formats: JPEG, PNG',
          'Images are automatically resized to large, medium, and small variants',
          'Use the returned "id" in the init_profile endpoint to set as avatar'
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
        path: '/users/{user_id}/social_networks/',
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
  --url ${API_BASE_URL}/users/12345/social_networks/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `[
  {
    "id": 1,
    "url": "https://instagram.com/johndoe"
  },
  {
    "id": 2,
    "url": "https://twitter.com/johndoe"
  },
  {
    "id": 3,
    "url": "https://linkedin.com/in/johndoe"
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
        path: '/users/social_networks/',
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
  --url ${API_BASE_URL}/users/social_networks/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "networks": [
      "https://instagram.com/johndoe",
      "https://twitter.com/johndoe",
      "https://linkedin.com/in/johndoe"
    ]
  }'`,
          json: `{
  "networks": [
    "https://instagram.com/johndoe",
    "https://twitter.com/johndoe",
    "https://linkedin.com/in/johndoe"
  ]
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "message": "Social networks updated",
  "networks": [
    {
      "id": 1,
      "url": "https://instagram.com/johndoe"
    },
    {
      "id": 2,
      "url": "https://twitter.com/johndoe"
    },
    {
      "id": 3,
      "url": "https://linkedin.com/in/johndoe"
    }
  ]
}`
        },
        responseParams: [
          { name: 'message', type: 'string', required: true, description: 'Success message' },
          { name: 'networks', type: 'array', required: true, description: 'Updated list of social networks' }
        ],
        notes: [
          'This endpoint replaces all existing social networks',
          'Send an empty array to remove all social networks',
          'Supported platforms: Instagram, Twitter/X, LinkedIn, Facebook, Telegram, etc.'
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
        path: '/users/get_active_devices/',
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
  --url '${API_BASE_URL}/users/get_active_devices/?page=1&limit=50' \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `{
  "total_count": 3,
  "total_pages": 1,
  "list": [
    {
      "id": 1234,
      "key": "token_key_abc123",
      "user": 12345,
      "location": "Dubai, UAE",
      "device": "iPhone 15 Pro",
      "ip": "192.168.1.100",
      "log_time": "2024-01-20T15:30:00Z",
      "version_app": "1.2.0",
      "is_active": true,
      "operating_system": "iOS 17.2",
      "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2...)",
      "last_active": "2024-01-20T16:45:00Z",
      "expired_time_choice": 30,
      "expired_time": "2024-02-19T15:30:00Z"
    }
  ]
}`
        },
        responseParams: [
          { name: 'total_count', type: 'number', required: true, description: 'Total number of active devices' },
          { name: 'total_pages', type: 'number', required: true, description: 'Total number of pages' },
          { name: 'list', type: 'array', required: true, description: 'Array of active device objects' },
          { name: 'list[].id', type: 'number', required: true, description: 'Unique device/token ID' },
          { name: 'list[].key', type: 'string', required: true, description: 'Token key (partial)' },
          { name: 'list[].location', type: 'string', required: false, description: 'Geographic location of login' },
          { name: 'list[].device', type: 'string', required: false, description: 'Device name/model' },
          { name: 'list[].ip', type: 'string', required: true, description: 'IP address' },
          { name: 'list[].is_active', type: 'boolean', required: true, description: 'Whether session is currently active' },
          { name: 'list[].operating_system', type: 'string', required: false, description: 'OS name and version' },
          { name: 'list[].last_active', type: 'string', required: false, description: 'Last activity timestamp (ISO 8601)' },
          { name: 'list[].expired_time_choice', type: 'number', required: false, description: 'Token expiration setting in days', enum: ['7', '30', '90', '180'] },
          { name: 'list[].expired_time', type: 'string', required: false, description: 'Token expiration datetime (ISO 8601)' }
        ]
      },
      {
        id: 'get-authorization-history',
        method: 'GET',
        path: '/users/authorisation_history/',
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
  --url '${API_BASE_URL}/users/authorisation_history/?page=1&limit=20' \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `{
  "total_count": 45,
  "total_pages": 3,
  "list": [
    {
      "id": 5678,
      "key": "token_key_xyz789",
      "user": 12345,
      "location": "Abu Dhabi, UAE",
      "device": "MacBook Pro",
      "ip": "10.0.0.50",
      "log_time": "2024-01-18T10:15:00Z",
      "version_app": "1.1.5",
      "is_active": false,
      "operating_system": "macOS 14.2",
      "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7...)",
      "last_active": "2024-01-18T14:30:00Z",
      "expired_time_choice": null,
      "expired_time": null
    }
  ]
}`
        },
        responseParams: [
          { name: 'total_count', type: 'number', required: true, description: 'Total number of history entries' },
          { name: 'total_pages', type: 'number', required: true, description: 'Total number of pages' },
          { name: 'list', type: 'array', required: true, description: 'Array of authorization history entries' }
        ],
        notes: [
          'History includes both active and expired sessions',
          'Entries are sorted by log_time descending (newest first)',
          'is_active=false indicates expired or terminated sessions'
        ]
      },
      {
        id: 'get-device-detail',
        method: 'GET',
        path: '/users/get_token_detail/{device_id}/',
        title: 'Get Device Detail',
        description: 'Retrieve detailed information about a specific device/session.',
        category: 'devices',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        pathParams: [
          { name: 'device_id', type: 'number', required: true, description: 'Device/token ID to get details for' }
        ],
        requestExample: {
          curl: `curl --request GET \\
  --url ${API_BASE_URL}/users/get_token_detail/1234/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `{
  "id": 1234,
  "key": "token_key_abc123",
  "user": 12345,
  "location": "Dubai, UAE",
  "device": "iPhone 15 Pro",
  "ip": "192.168.1.100",
  "log_time": "2024-01-20T15:30:00Z",
  "version_app": "1.2.0",
  "is_active": true,
  "operating_system": "iOS 17.2",
  "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15",
  "last_active": "2024-01-20T16:45:00Z",
  "expired_time_choice": 30,
  "expired_time": "2024-02-19T15:30:00Z"
}`
        },
        responseParams: [
          { name: 'id', type: 'number', required: true, description: 'Device/token ID' },
          { name: 'key', type: 'string', required: true, description: 'Token key' },
          { name: 'user', type: 'number', required: true, description: 'User ID' },
          { name: 'location', type: 'string', required: false, description: 'Login location' },
          { name: 'device', type: 'string', required: false, description: 'Device name' },
          { name: 'ip', type: 'string', required: true, description: 'IP address' },
          { name: 'log_time', type: 'string', required: true, description: 'Login timestamp' },
          { name: 'version_app', type: 'string', required: false, description: 'App version' },
          { name: 'is_active', type: 'boolean', required: true, description: 'Session active status' },
          { name: 'operating_system', type: 'string', required: false, description: 'Operating system' },
          { name: 'user_agent', type: 'string', required: false, description: 'Full user agent string' },
          { name: 'last_active', type: 'string', required: false, description: 'Last activity time' },
          { name: 'expired_time_choice', type: 'number', required: false, description: 'Expiration setting (days)' },
          { name: 'expired_time', type: 'string', required: false, description: 'Expiration datetime' }
        ]
      },
      {
        id: 'change-token-expiration',
        method: 'POST',
        path: '/users/change_token_expired_time/{token_id}/',
        title: 'Change Token Expiration',
        description: 'Change the expiration time for a specific device/session token. Can be used to extend session duration or terminate a session by setting minimum expiration.',
        category: 'devices',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        pathParams: [
          { name: 'token_id', type: 'number', required: true, description: 'Device/token ID to modify' }
        ],
        bodyParams: [
          { name: 'expired_time_choice', type: 'enum', required: true, description: 'New expiration time in days', enum: ['7', '30', '90', '180'] }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${API_BASE_URL}/users/change_token_expired_time/1234/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "expired_time_choice": 30
  }'`,
          json: `{
  "expired_time_choice": 30
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "success": true
}`
        },
        responseParams: [
          { name: 'success', type: 'boolean', required: true, description: 'Whether the operation was successful' }
        ],
        notes: [
          'Use 7 days as minimum to effectively terminate a session',
          'Users can only modify their own device sessions',
          'The current device token cannot be terminated',
          'Available options: 7, 30, 90, or 180 days'
        ]
      },
      {
        id: 'terminate-device-session',
        method: 'DELETE',
        path: '/users/get_or_deactivate_token/{token_id}/',
        title: 'Terminate Device Session',
        description: 'Immediately terminate a specific device session by deactivating its token. This logs the user out from that device.',
        category: 'devices',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        pathParams: [
          { name: 'token_id', type: 'number', required: true, description: 'Device/token ID to terminate' }
        ],
        requestExample: {
          curl: `curl --request DELETE \\
  --url ${API_BASE_URL}/users/get_or_deactivate_token/2689/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `{
  "success": true
}`
        },
        responseParams: [
          { name: 'success', type: 'boolean', required: true, description: 'Whether the session was successfully terminated' }
        ],
        notes: [
          'This immediately invalidates the device session',
          'The logged out device will need to authenticate again',
          'Cannot terminate the current device session (the one making the request)',
          'Use GET method on same endpoint to retrieve token details instead'
        ]
      }
    ]
  },
  // ============ TOPUPS (ПОПОЛНЕНИЯ) ============
  {
    id: 'topups',
    title: 'Topups (Пополнения)',
    titleKey: 'api.categories.topups',
    icon: '💰',
    endpoints: [
      {
        id: 'bank-topup',
        method: 'POST',
        path: '/transactions/topup/bank/',
        title: 'Bank Wire Topup',
        description: 'Инициирует заявку на банковское пополнение в статусе pending. Возвращает реквизиты компании для осуществления перевода. Завершение транзакции происходит асинхронно после Webhook от банка.',
        category: 'topups',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        bodyParams: [
          { name: 'transfer_rail', type: 'enum', required: true, description: 'Тип банковского перевода', enum: ['UAE_LOCAL_AED', 'SWIFT_INTL'] }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${API_BASE_URL}/transactions/topup/bank/ \\
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
          { name: 'message', type: 'string', required: true, description: 'Сообщение об успешном создании заявки' },
          { name: 'transaction_id', type: 'uuid', required: true, description: 'ID созданной транзакции пополнения' },
          { name: 'user_id', type: 'number', required: true, description: 'Числовой ID пользователя — обязательно указывается в назначении банковского перевода' },
          { name: 'instructions', type: 'object', required: true, description: 'Банковские реквизиты для перевода (IBAN, SWIFT, наименование банка, reference с user_id)' }
        ],
        notes: [
          'user_id извлекается из токена авторизации и привязывает транзакцию к конкретному пользователю',
          '⚠️ ОБЯЗАТЕЛЬНО укажите user_id в назначении платежа (reference) при банковском переводе — без этого средства не будут идентифицированы',
          'UAE_LOCAL_AED — локальный перевод внутри ОАЭ (быстрее, дешевле)',
          'SWIFT_INTL — международный SWIFT-перевод (для клиентов за пределами ОАЭ)',
          'Транзакция создаётся в статусе pending до подтверждения банком',
          'Квитанция содержит: transaction_id, user_id, status, дату, тип операции, реквизиты банка, reference'
        ]
      },
      {
        id: 'crypto-topup',
        method: 'POST',
        path: '/transactions/topup/crypto/',
        title: 'Crypto Topup',
        description: 'Генерирует уникальный криптографический адрес для пополнения баланса карты в выбранной сети и токене. На текущем этапе адрес эмулируется.',
        category: 'topups',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        bodyParams: [
          { name: 'card_id', type: 'uuid', required: true, description: 'ID карты, на которую зачислятся средства после конвертации' },
          { name: 'token', type: 'enum', required: true, description: 'Стейблкоин для пополнения', enum: ['USDT', 'USDC'] },
          { name: 'network', type: 'enum', required: true, description: 'Блокчейн-сеть для получения средств', enum: ['TRC20', 'ERC20', 'BEP20', 'SOL'] }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${API_BASE_URL}/transactions/topup/crypto/ \\
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
  "user_id": 12345,
  "deposit_address": "TXqH5gN2Y8k9m3LpWv7rJf4sKz6eCdAb1R",
  "qr_payload": "tron:TXqH5gN2Y8k9m3LpWv7rJf4sKz6eCdAb1R?amount=0&token=USDT"
}`
        },
        responseParams: [
          { name: 'message', type: 'string', required: true, description: 'Сообщение об успешной генерации адреса' },
          { name: 'user_id', type: 'number', required: true, description: 'Числовой ID пользователя, к которому привязан депозитный адрес' },
          { name: 'deposit_address', type: 'string', required: true, description: 'Сгенерированный крипто-адрес для депозита' },
          { name: 'qr_payload', type: 'string', required: true, description: 'Строка для генерации QR-кода на фронтенде' }
        ],
        notes: [
          'user_id извлекается из токена авторизации — привязывает адрес к конкретному пользователю и его карте',
          'Адрес уникален для каждого запроса',
          'Поддерживаемые токены: USDT, USDC',
          'Поддерживаемые сети: TRC20 (Tron), ERC20 (Ethereum), BEP20 (BSC), SOL (Solana)',
          'Квитанция содержит: transaction_id, user_id, status, дату, токен, сеть, deposit_address, сумму зачисления'
        ]
      }
    ]
  },
  // ============ TRANSFERS (ПЕРЕВОДЫ) ============
  {
    id: 'transfers',
    title: 'Transfers (Переводы)',
    titleKey: 'api.categories.transfers',
    icon: '🔄',
    endpoints: [
      {
        id: 'card-transfer',
        method: 'POST',
        path: '/transactions/transfer/card/',
        title: 'Card to Card Transfer',
        description: 'Моментальный перевод средств между расчётными счетами внутри закрытого контура платформы. Применяется строгая транзакционная блокировка (select_for_update) для исключения race condition.',
        category: 'transfers',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        bodyParams: [
          { name: 'sender_card_id', type: 'uuid', required: true, description: 'ID карты отправителя (ваша карта)' },
          { name: 'receiver_card_number', type: 'string', required: true, description: '16-значный номер карты получателя' },
          { name: 'amount', type: 'decimal', required: true, description: 'Сумма перевода в AED (минимум 1.00)' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${API_BASE_URL}/transactions/transfer/card/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "sender_card_id": "550e8400-e29b-41d4-a716-446655440000",
    "receiver_card_number": "4111111111111234",
    "amount": 100.00
  }'`,
          json: `{
  "sender_card_id": "550e8400-e29b-41d4-a716-446655440000",
  "receiver_card_number": "4111111111111234",
  "amount": 100.00
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "message": "Transfer successful",
  "transaction_id": "123e4567-e89b-12d3-a456-426614174000",
  "user_id": 12345,
  "sender_user_id": 12345,
  "receiver_user_id": 67890,
  "amount": "100.00"
}`
        },
        responseParams: [
          { name: 'message', type: 'string', required: true, description: 'Сообщение об успешном переводе' },
          { name: 'transaction_id', type: 'uuid', required: true, description: 'ID выполненной транзакции' },
          { name: 'user_id', type: 'number', required: true, description: 'ID пользователя-инициатора (отправитель)' },
          { name: 'sender_user_id', type: 'number', required: true, description: 'ID пользователя-отправителя (владелец sender_card_id)' },
          { name: 'receiver_user_id', type: 'number', required: true, description: 'ID пользователя-получателя (владелец receiver_card_number)' },
          { name: 'amount', type: 'decimal', required: true, description: 'Фактически переведённая сумма в AED' }
        ],
        notes: [
          'user_id, sender_user_id, receiver_user_id — идентифицируют участников перевода; карты привязаны к конкретным пользователям',
          'Перевод моментальный, средства зачисляются мгновенно',
          'Комиссия: 1% от суммы перевода',
          'Минимальная сумма: 1.00 AED',
          'Квитанция содержит: transaction_id, user_id, sender_user_id, receiver_user_id, status, дату, сумму, комиссию, маску карты отправителя (**** 1234), маску карты получателя (**** 5678), имя получателя'
        ]
      }
    ]
  },
  // ============ WITHDRAWALS (ВЫВОДЫ) ============
  {
    id: 'withdrawals',
    title: 'Withdrawals (Выводы)',
    titleKey: 'api.categories.withdrawals',
    icon: '📤',
    endpoints: [
      {
        id: 'crypto-withdrawal',
        method: 'POST',
        path: '/transactions/withdrawal/crypto/',
        title: 'Crypto Withdrawal',
        description: 'Регистрирует дебетовую операцию по фиатному счёту (AED) и инициирует заявку на отправку эквивалента в цифровых активах на внешний кошелёк. Передача в блокчейн делегируется асинхронным процессам.',
        category: 'withdrawals',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        bodyParams: [
          { name: 'from_card_id', type: 'uuid', required: true, description: 'ID карты, с которой спишутся AED' },
          { name: 'token', type: 'enum', required: true, description: 'Токен для вывода', enum: ['USDT', 'USDC'] },
          { name: 'network', type: 'enum', required: true, description: 'Сеть получателя', enum: ['TRC20', 'ERC20', 'BEP20', 'SOL'] },
          { name: 'to_address', type: 'string', required: true, description: 'Крипто-адрес получателя' },
          { name: 'amount_crypto', type: 'decimal', required: true, description: 'Сумма к получению в крипте (минимум 1.00)' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${API_BASE_URL}/transactions/withdrawal/crypto/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "from_card_id": "550e8400-e29b-41d4-a716-446655440000",
    "token": "USDT",
    "network": "TRC20",
    "to_address": "TXqH5gN2Y8k9m3LpWv7rJf4sKz6eCdAb1R",
    "amount_crypto": 50.00
  }'`,
          json: `{
  "from_card_id": "550e8400-e29b-41d4-a716-446655440000",
  "token": "USDT",
  "network": "TRC20",
  "to_address": "TXqH5gN2Y8k9m3LpWv7rJf4sKz6eCdAb1R",
  "amount_crypto": 50.00
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "message": "Withdrawal processing",
  "transaction_id": "123e4567-e89b-12d3-a456-426614174000",
  "user_id": 12345,
  "total_debit_crypto": "50.500000"
}`
        },
        responseParams: [
          { name: 'message', type: 'string', required: true, description: 'Статус обработки вывода' },
          { name: 'transaction_id', type: 'uuid', required: true, description: 'ID транзакции списания' },
          { name: 'user_id', type: 'number', required: true, description: 'ID пользователя, инициировавшего вывод (владелец карты)' },
          { name: 'total_debit_crypto', type: 'decimal', required: true, description: 'Общая сумма списания в крипте (включая network fee)' }
        ],
        notes: [
          'user_id привязывает вывод к конкретному пользователю и его карте (from_card_id)',
          'Комиссия сети (network fee) включена в total_debit_crypto',
          'Комиссия платформы: 1% от суммы',
          'Фактическая отправка в блокчейн происходит асинхронно',
          'Квитанция содержит: transaction_id, user_id, status, дату, токен, сеть, адрес получателя, сумму отправки, network fee, общее списание, курс конвертации AED → крипто'
        ]
      },
      {
        id: 'bank-withdrawal',
        method: 'POST',
        path: '/transactions/withdrawal/bank/',
        title: 'Bank Wire Withdrawal',
        description: 'Формирует поручение на банковский перевод (SWIFT или локальный клиринг) с удержанием средств с баланса карты. Маршрутизация платёжных поручений находится в стадии интеграции.',
        category: 'withdrawals',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        bodyParams: [
          { name: 'from_card_id', type: 'uuid', required: true, description: 'ID карты для списания средств' },
          { name: 'iban', type: 'string', required: true, description: 'IBAN номер счёта в ОАЭ (начинается с AE, 23 символа)' },
          { name: 'beneficiary_name', type: 'string', required: true, description: 'Полное имя получателя' },
          { name: 'bank_name', type: 'string', required: true, description: 'Название банка получателя' },
          { name: 'amount_aed', type: 'decimal', required: true, description: 'Сумма перевода в AED (минимум 1.00)' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${API_BASE_URL}/transactions/withdrawal/bank/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "from_card_id": "550e8400-e29b-41d4-a716-446655440000",
    "iban": "AE070331234567890123456",
    "beneficiary_name": "John Doe",
    "bank_name": "Emirates NBD",
    "amount_aed": 500.00
  }'`,
          json: `{
  "from_card_id": "550e8400-e29b-41d4-a716-446655440000",
  "iban": "AE070331234567890123456",
  "beneficiary_name": "John Doe",
  "bank_name": "Emirates NBD",
  "amount_aed": 500.00
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "message": "Bank wire processing",
  "transaction_id": "123e4567-e89b-12d3-a456-426614174000",
  "user_id": 12345,
  "fee_amount": "10.00",
  "total_debit_aed": "510.00"
}`
        },
        responseParams: [
          { name: 'message', type: 'string', required: true, description: 'Статус обработки перевода' },
          { name: 'transaction_id', type: 'uuid', required: true, description: 'ID транзакции' },
          { name: 'user_id', type: 'number', required: true, description: 'ID пользователя-отправителя (владелец карты from_card_id)' },
          { name: 'fee_amount', type: 'decimal', required: true, description: 'Комиссия за перевод (2%)' },
          { name: 'total_debit_aed', type: 'decimal', required: true, description: 'Общая сумма списания (сумма + комиссия)' }
        ],
        notes: [
          'user_id привязывает банковский перевод к конкретному пользователю и его карте',
          'IBAN должен начинаться с AE и содержать 23 символа',
          'Комиссия: 2% от суммы перевода',
          'Обработка занимает 1–3 рабочих дня',
          'Квитанция содержит: transaction_id, user_id, status, дату, сумму перевода, комиссию (2%), общее списание, IBAN получателя, имя получателя, название банка, reference'
        ]
      }
    ]
  },
  // ============ RECEIPTS (КВИТАНЦИИ) ============
  {
    id: 'receipts',
    title: 'Receipts (Квитанции)',
    titleKey: 'api.categories.receipts',
    icon: '🧾',
    endpoints: [
      {
        id: 'transaction-receipt',
        method: 'GET',
        path: '/transactions/{transaction_id}/receipt/',
        title: 'Get Transaction Receipt',
        description: 'Возвращает структурированный отчёт (квитанцию) по конкретной транзакции. Формат ответа адаптируется под тип операции. Проверяет права доступа пользователя.',
        category: 'receipts',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        pathParams: [
          { name: 'transaction_id', type: 'uuid', required: true, description: 'ID транзакции для получения квитанции' }
        ],
        requestExample: {
          curl: `curl --request GET \\
  --url ${API_BASE_URL}/transactions/123e4567-e89b-12d3-a456-426614174000/receipt/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `{
  "transaction_id": "123e4567-e89b-12d3-a456-426614174000",
  "user_id": 12345,
  "status": "completed",
  "date_time": "2026-02-20T12:00:00Z",
  "operation": "Internal Card Transfer",
  "amount": "100.00",
  "fee": "1.00",
  "sender_user_id": 12345,
  "sender_card_mask": "**** 1234",
  "receiver_user_id": 67890,
  "receiver_card_mask": "**** 5678",
  "recipient_name": "EasyCard User"
}`
        },
        responseParams: [
          { name: 'transaction_id', type: 'uuid', required: true, description: 'ID транзакции' },
          { name: 'user_id', type: 'number', required: true, description: 'ID пользователя-владельца транзакции' },
          { name: 'status', type: 'string', required: true, description: 'Статус: pending, processing, completed, failed, cancelled' },
          { name: 'date_time', type: 'string', required: true, description: 'Дата и время операции (ISO 8601)' },
          { name: 'operation', type: 'string', required: true, description: 'Тип операции (человекочитаемый)' },
          { name: 'amount', type: 'decimal', required: true, description: 'Сумма операции' },
          { name: 'fee', type: 'decimal', required: false, description: 'Комиссия (если применимо)' },
          { name: 'sender_user_id', type: 'number', required: false, description: 'ID отправителя (для переводов)' },
          { name: 'receiver_user_id', type: 'number', required: false, description: 'ID получателя (для переводов)' }
        ],
        notes: [
          'user_id присутствует во ВСЕХ квитанциях — определяет владельца транзакции',
          '**Bank Topup** (top_up) — квитанция: transaction_id, user_id, status, date_time, operation ("Bank Wire Topup"), transfer_rail, bank_instructions (IBAN, SWIFT, bank_name, account_name, reference с user_id)',
          '**Crypto Topup** (top_up) — квитанция: transaction_id, user_id, status, date_time, operation ("Crypto Topup"), token, network, deposit_address, qr_payload, amount_received, exchange_rate, fee_amount',
          '**Card Transfer** (transfer_out / transfer_in) — квитанция: transaction_id, user_id, sender_user_id, receiver_user_id, status, date_time, operation ("Internal Card Transfer"), amount, fee, sender_card_mask, receiver_card_mask, recipient_name',
          '**Crypto Withdrawal** (withdrawal) — квитанция: transaction_id, user_id, status, date_time, operation ("Crypto Withdrawal"), token, network, to_address_mask, amount_crypto, fee, tx_hash',
          '**Bank Withdrawal** (withdrawal) — квитанция: transaction_id, user_id, status, date_time, operation ("Bank Wire Withdrawal"), amount_aed, fee_amount (2%), total_debit, iban_mask, beneficiary_name, bank_name, from_card_mask',
          '**Card Activation** (card_activation) — квитанция: transaction_id, user_id, status, date_time, operation ("Card Activation"), card_type (virtual/metal), card_mask (**** XXXX), annual_fee (183 AED), activated_at',
          '**Card Payment** (card_payment) — квитанция: transaction_id, user_id, status, date_time, operation ("Card Payment"), merchant_name, merchant_category, amount, currency, card_mask, exchange_rate (если конвертация), original_amount, original_currency',
          '**Fee** (fee) — квитанция: transaction_id, user_id, status, date_time, operation ("Service Fee"), fee_type (annual_fee / replacement_fee / account_opening_fee), amount, card_id, description',
          '**Refund** (refund) — квитанция: transaction_id, user_id, status, date_time, operation ("Refund"), original_transaction_id, amount, merchant_name, card_mask, refund_reason',
          '**Cashback** (cashback) — квитанция: transaction_id, user_id, status, date_time, operation ("Cashback"), original_transaction_id, cashback_amount, cashback_percent, merchant_name, credited_card_mask'
        ]
      }
    ]
  },
  // ============ SAVED CONTACTS ============
  {
    id: 'contacts',
    title: 'Saved Contacts',
    titleKey: 'api.categories.contacts',
    icon: '📇',
    endpoints: [
      {
        id: 'contacts-list',
        method: 'GET',
        path: '/accounts/contacts/',
        title: 'List Contacts',
        description: 'Get paginated list of saved contacts for the authenticated user.',
        category: 'contacts',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        queryParams: [
          { name: 'page', type: 'integer', required: false, description: 'Page number (default: 1)' },
          { name: 'limit', type: 'integer', required: false, description: 'Items per page (default: 100)' }
        ],
        requestExample: {
          curl: `curl --request GET \\
  --url '${API_BASE_URL}/accounts/contacts/?page=1&limit=100' \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `{
  "total_count": 2,
  "total_pages": 1,
  "list": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "user_id": "u1234",
      "full_name": "John Doe",
      "phone": "+971501234567",
      "email": "john@example.com",
      "company": "Acme Corp",
      "position": "CEO",
      "avatar_url": "https://cdn.apofiz.com/avatars/contact1.jpg",
      "notes": "Business partner",
      "payment_methods": [
        {
          "id": "pm1",
          "type": "card",
          "label": "Visa *4242",
          "value": "4242424242424242"
        }
      ],
      "social_links": [
        {
          "id": "sl1",
          "networkId": "telegram",
          "networkName": "Telegram",
          "url": "https://t.me/johndoe"
        }
      ],
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z"
    }
  ]
}`
        },
        responseParams: [
          { name: 'total_count', type: 'integer', required: true, description: 'Total number of contacts' },
          { name: 'total_pages', type: 'integer', required: true, description: 'Total number of pages' },
          { name: 'list', type: 'array', required: true, description: 'Array of contact objects' }
        ]
      },
      {
        id: 'contacts-create',
        method: 'POST',
        path: '/accounts/contacts/',
        title: 'Create Contact',
        description: 'Create a new saved contact with optional payment methods and social links.',
        category: 'contacts',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        bodyParams: [
          { name: 'full_name', type: 'string', required: true, description: 'Full name of the contact' },
          { name: 'phone', type: 'string', required: false, description: 'Phone number' },
          { name: 'email', type: 'string', required: false, description: 'Email address' },
          { name: 'company', type: 'string', required: false, description: 'Company name' },
          { name: 'position', type: 'string', required: false, description: 'Job title / position' },
          { name: 'notes', type: 'string', required: false, description: 'Free-text notes' },
          { name: 'payment_methods', type: 'array', required: false, description: 'Array of payment method objects (type, label, value, network)' },
          { name: 'social_links', type: 'array', required: false, description: 'Array of social link objects (networkId, networkName, url)' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${API_BASE_URL}/accounts/contacts/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "full_name": "Jane Smith",
    "phone": "+971509876543",
    "email": "jane@example.com",
    "company": "Tech LLC",
    "payment_methods": [
      {
        "type": "iban",
        "label": "Main IBAN",
        "value": "AE070331234567890123456"
      }
    ]
  }'`,
          json: `{
  "full_name": "Jane Smith",
  "phone": "+971509876543",
  "email": "jane@example.com",
  "company": "Tech LLC",
  "payment_methods": [
    {
      "type": "iban",
      "label": "Main IBAN",
      "value": "AE070331234567890123456"
    }
  ]
}`
        },
        responseExample: {
          status: 201,
          json: `{
  "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "user_id": "u1234",
  "full_name": "Jane Smith",
  "phone": "+971509876543",
  "email": "jane@example.com",
  "company": "Tech LLC",
  "position": null,
  "avatar_url": null,
  "notes": null,
  "payment_methods": [
    {
      "id": "pm2",
      "type": "iban",
      "label": "Main IBAN",
      "value": "AE070331234567890123456"
    }
  ],
  "social_links": [],
  "created_at": "2025-02-20T14:00:00Z",
  "updated_at": "2025-02-20T14:00:00Z"
}`
        },
        responseParams: [
          { name: 'id', type: 'uuid', required: true, description: 'Unique contact ID' },
          { name: 'full_name', type: 'string', required: true, description: 'Contact full name' },
          { name: 'payment_methods', type: 'array', required: true, description: 'Saved payment methods' },
          { name: 'social_links', type: 'array', required: true, description: 'Saved social links' }
        ]
      },
      {
        id: 'contacts-get',
        method: 'GET',
        path: '/accounts/contacts/{id}/',
        title: 'Get Contact',
        description: 'Get a single saved contact by ID.',
        category: 'contacts',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        pathParams: [
          { name: 'id', type: 'uuid', required: true, description: 'Contact ID' }
        ],
        requestExample: {
          curl: `curl --request GET \\
  --url ${API_BASE_URL}/accounts/contacts/a1b2c3d4-e5f6-7890-abcd-ef1234567890/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "user_id": "u1234",
  "full_name": "John Doe",
  "phone": "+971501234567",
  "email": "john@example.com",
  "company": "Acme Corp",
  "position": "CEO",
  "avatar_url": "https://cdn.apofiz.com/avatars/contact1.jpg",
  "notes": "Business partner",
  "payment_methods": [],
  "social_links": [],
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}`
        },
        responseParams: [
          { name: 'id', type: 'uuid', required: true, description: 'Unique contact ID' },
          { name: 'full_name', type: 'string', required: true, description: 'Contact full name' },
          { name: 'phone', type: 'string', required: false, description: 'Phone number' },
          { name: 'email', type: 'string', required: false, description: 'Email address' },
          { name: 'avatar_url', type: 'string', required: false, description: 'Avatar image URL' }
        ]
      },
      {
        id: 'contacts-update',
        method: 'PATCH',
        path: '/accounts/contacts/{id}/',
        title: 'Update Contact',
        description: 'Partially update a saved contact. Only provided fields are changed.',
        category: 'contacts',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        pathParams: [
          { name: 'id', type: 'uuid', required: true, description: 'Contact ID' }
        ],
        bodyParams: [
          { name: 'full_name', type: 'string', required: false, description: 'Full name' },
          { name: 'phone', type: 'string', required: false, description: 'Phone number' },
          { name: 'email', type: 'string', required: false, description: 'Email address' },
          { name: 'company', type: 'string', required: false, description: 'Company name' },
          { name: 'position', type: 'string', required: false, description: 'Job title' },
          { name: 'notes', type: 'string', required: false, description: 'Notes' },
          { name: 'payment_methods', type: 'array', required: false, description: 'Payment methods (replaces entire array)' },
          { name: 'social_links', type: 'array', required: false, description: 'Social links (replaces entire array)' }
        ],
        requestExample: {
          curl: `curl --request PATCH \\
  --url ${API_BASE_URL}/accounts/contacts/a1b2c3d4-e5f6-7890-abcd-ef1234567890/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "company": "New Company Inc",
    "position": "CTO"
  }'`,
          json: `{
  "company": "New Company Inc",
  "position": "CTO"
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "user_id": "u1234",
  "full_name": "John Doe",
  "phone": "+971501234567",
  "email": "john@example.com",
  "company": "New Company Inc",
  "position": "CTO",
  "avatar_url": "https://cdn.apofiz.com/avatars/contact1.jpg",
  "notes": "Business partner",
  "payment_methods": [],
  "social_links": [],
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-02-20T15:00:00Z"
}`
        },
        responseParams: [
          { name: 'id', type: 'uuid', required: true, description: 'Contact ID' },
          { name: 'full_name', type: 'string', required: true, description: 'Updated full name' },
          { name: 'updated_at', type: 'datetime', required: true, description: 'Last update timestamp' }
        ],
        notes: [
          'Only fields included in the request body are updated',
          'payment_methods and social_links replace the entire array when provided'
        ]
      },
      {
        id: 'contacts-delete',
        method: 'DELETE',
        path: '/accounts/contacts/{id}/',
        title: 'Delete Contact',
        description: 'Permanently delete a saved contact.',
        category: 'contacts',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        pathParams: [
          { name: 'id', type: 'uuid', required: true, description: 'Contact ID' }
        ],
        requestExample: {
          curl: `curl --request DELETE \\
  --url ${API_BASE_URL}/accounts/contacts/a1b2c3d4-e5f6-7890-abcd-ef1234567890/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 204,
          json: `// No content`
        },
        notes: [
          'Returns 204 No Content on success',
          'Deletion is permanent and cannot be undone'
        ]
      },
      {
        id: 'contacts-avatar-upload',
        method: 'POST',
        path: '/accounts/contacts/{id}/avatar/',
        title: 'Upload Avatar',
        description: 'Upload or replace the avatar image for a contact. Accepts multipart/form-data.',
        category: 'contacts',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        pathParams: [
          { name: 'id', type: 'uuid', required: true, description: 'Contact ID' }
        ],
        bodyParams: [
          { name: 'file', type: 'file', required: true, description: 'Image file (JPEG, PNG, WebP; max 5 MB)' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${API_BASE_URL}/accounts/contacts/a1b2c3d4-e5f6-7890-abcd-ef1234567890/avatar/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --form 'file=@/path/to/avatar.jpg'`
        },
        responseExample: {
          status: 200,
          json: `{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "avatar_url": "https://cdn.apofiz.com/contacts/avatars/a1b2c3d4.jpg",
  "full_name": "John Doe"
}`
        },
        responseParams: [
          { name: 'id', type: 'uuid', required: true, description: 'Contact ID' },
          { name: 'avatar_url', type: 'string', required: true, description: 'URL of the uploaded avatar' },
          { name: 'full_name', type: 'string', required: true, description: 'Contact name' }
        ],
        notes: [
          'Content-Type must be multipart/form-data',
          'Supported formats: JPEG, PNG, WebP',
          'Maximum file size: 5 MB',
          'Previous avatar is automatically replaced'
        ]
      },
      {
        id: 'contacts-avatar-delete',
        method: 'DELETE',
        path: '/accounts/contacts/{id}/avatar/',
        title: 'Delete Avatar',
        description: 'Remove the avatar image from a contact.',
        category: 'contacts',
        authorization: {
          type: 'Token',
          description: 'Token authentication header of the form `Token <token>`'
        },
        pathParams: [
          { name: 'id', type: 'uuid', required: true, description: 'Contact ID' }
        ],
        requestExample: {
          curl: `curl --request DELETE \\
  --url ${API_BASE_URL}/accounts/contacts/a1b2c3d4-e5f6-7890-abcd-ef1234567890/avatar/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "avatar_url": null,
  "full_name": "John Doe"
}`
        },
        responseParams: [
          { name: 'id', type: 'uuid', required: true, description: 'Contact ID' },
          { name: 'avatar_url', type: 'null', required: true, description: 'Null after deletion' }
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

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
  description: string;
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
  titleRu: string;
  icon: string;
  endpoints: ApiEndpoint[];
}

// Base API URL
export const API_BASE_URL = 'https://test.apofiz.com/api/v1';

// API Categories and Endpoints
export const apiCategories: ApiCategory[] = [
  // ============ AUTHENTICATION ============
  {
    id: 'authentication',
    title: 'Authentication',
    titleRu: 'Аутентификация',
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
    titleRu: 'Управление паролем',
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
    titleRu: 'Профиль пользователя',
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
      }
    ]
  },
  // ============ FILE UPLOADS ============
  {
    id: 'files',
    title: 'File Uploads',
    titleRu: 'Загрузка файлов',
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
    titleRu: 'Социальные сети',
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

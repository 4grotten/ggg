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
    type: 'Bearer' | 'API Key';
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
export const API_BASE_URL = 'https://api.easycard.ae/v1';

// API Categories and Endpoints
export const apiCategories: ApiCategory[] = [
  {
    id: 'account',
    title: 'Account',
    titleRu: 'Аккаунт',
    icon: '👤',
    endpoints: [
      {
        id: 'get-account',
        method: 'GET',
        path: '/account',
        title: 'Get Account',
        description: 'Retrieve current user account information including balance, status and profile details.',
        category: 'account',
        authorization: {
          type: 'Bearer',
          description: 'Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.'
        },
        requestExample: {
          curl: `curl --request GET \\
  --url ${API_BASE_URL}/account \\
  --header 'Authorization: Bearer <token>'`
        },
        responseExample: {
          status: 200,
          json: `{
  "account_id": "acc_abc123xyz",
  "account_type": "personal",
  "status": "active",
  "username": "john_doe",
  "display_name": "John Doe",
  "email": "john@example.com",
  "phone": "+971501234567",
  "avatar_url": "https://cdn.easycard.ae/avatars/abc123.jpg",
  "kyc_status": "verified",
  "created_at": "2024-01-15T10:30:00Z"
}`
        },
        responseParams: [
          { name: 'account_id', type: 'string', required: true, description: 'Unique identifier for the account' },
          { name: 'account_type', type: 'enum', required: true, description: 'Type of the account', enum: ['personal', 'business'] },
          { name: 'status', type: 'enum', required: true, description: 'Current status of the account', enum: ['active', 'pending', 'suspended', 'closed'] },
          { name: 'username', type: 'string', required: true, description: 'Unique username for the account' },
          { name: 'display_name', type: 'string', required: true, description: 'Display name of the account holder' },
          { name: 'kyc_status', type: 'enum', required: true, description: 'KYC verification status', enum: ['pending', 'in_review', 'verified', 'rejected'] }
        ]
      },
      {
        id: 'update-account',
        method: 'PUT',
        path: '/account',
        title: 'Update Account',
        description: 'Update user account information such as display name and profile settings.',
        category: 'account',
        authorization: {
          type: 'Bearer',
          description: 'Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.'
        },
        bodyParams: [
          { name: 'display_name', type: 'string', required: false, description: 'New display name for the account' },
          { name: 'avatar_url', type: 'string', required: false, description: 'URL of the new avatar image' },
          { name: 'language', type: 'string', required: false, description: 'Preferred language code (en, ru, ar, etc.)' }
        ],
        requestExample: {
          curl: `curl --request PUT \\
  --url ${API_BASE_URL}/account \\
  --header 'Authorization: Bearer <token>' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "display_name": "John Smith",
    "language": "en"
  }'`,
          json: `{
  "display_name": "John Smith",
  "language": "en"
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "success": true,
  "message": "Account updated successfully",
  "account": {
    "account_id": "acc_abc123xyz",
    "display_name": "John Smith",
    "language": "en"
  }
}`
        }
      }
    ]
  },
  {
    id: 'balance',
    title: 'Balance',
    titleRu: 'Баланс',
    icon: '💰',
    endpoints: [
      {
        id: 'get-balance',
        method: 'GET',
        path: '/balance',
        title: 'Get Balance',
        description: 'Retrieve current account balance and available funds in all currencies.',
        category: 'balance',
        authorization: {
          type: 'Bearer',
          description: 'Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.'
        },
        requestExample: {
          curl: `curl --request GET \\
  --url ${API_BASE_URL}/balance \\
  --header 'Authorization: Bearer <token>'`
        },
        responseExample: {
          status: 200,
          json: `{
  "success": true,
  "data": {
    "total_balance": 15250.50,
    "available_balance": 15000.00,
    "pending_balance": 250.50,
    "currency": "AED",
    "wallets": [
      {
        "currency": "AED",
        "balance": 15250.50,
        "available": 15000.00
      },
      {
        "currency": "USD",
        "balance": 500.00,
        "available": 500.00
      }
    ]
  }
}`
        },
        responseParams: [
          { name: 'total_balance', type: 'number', required: true, description: 'Total balance across all funds' },
          { name: 'available_balance', type: 'number', required: true, description: 'Available balance for transactions' },
          { name: 'pending_balance', type: 'number', required: true, description: 'Balance pending clearance' },
          { name: 'currency', type: 'string', required: true, description: 'Primary currency code (ISO 4217)' },
          { name: 'wallets', type: 'array', required: true, description: 'Array of wallet balances by currency' }
        ]
      }
    ]
  },
  {
    id: 'cards',
    title: 'Cards',
    titleRu: 'Карты',
    icon: '💳',
    endpoints: [
      {
        id: 'list-cards',
        method: 'GET',
        path: '/cards',
        title: 'List Cards',
        description: 'Retrieve all cards associated with the account.',
        category: 'cards',
        authorization: {
          type: 'Bearer',
          description: 'Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.'
        },
        queryParams: [
          { name: 'status', type: 'string', required: false, description: 'Filter by card status (active, frozen, closed)' },
          { name: 'type', type: 'string', required: false, description: 'Filter by card type (virtual, physical)' }
        ],
        requestExample: {
          curl: `curl --request GET \\
  --url '${API_BASE_URL}/cards?status=active' \\
  --header 'Authorization: Bearer <token>'`
        },
        responseExample: {
          status: 200,
          json: `{
  "success": true,
  "data": [
    {
      "id": "card_abc123",
      "type": "virtual",
      "brand": "visa",
      "last4": "4242",
      "exp_month": 12,
      "exp_year": 2027,
      "status": "active",
      "balance": 5000.00,
      "currency": "AED",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total_count": 1
}`
        },
        responseParams: [
          { name: 'id', type: 'string', required: true, description: 'Unique card identifier' },
          { name: 'type', type: 'enum', required: true, description: 'Type of card', enum: ['virtual', 'physical'] },
          { name: 'brand', type: 'enum', required: true, description: 'Card brand', enum: ['visa', 'mastercard'] },
          { name: 'last4', type: 'string', required: true, description: 'Last 4 digits of card number' },
          { name: 'status', type: 'enum', required: true, description: 'Card status', enum: ['active', 'frozen', 'closed', 'pending'] }
        ]
      },
      {
        id: 'get-card',
        method: 'GET',
        path: '/cards/{card_id}',
        title: 'Get Card',
        description: 'Retrieve details of a specific card.',
        category: 'cards',
        authorization: {
          type: 'Bearer',
          description: 'Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.'
        },
        pathParams: [
          { name: 'card_id', type: 'string', required: true, description: 'The unique identifier of the card' }
        ],
        requestExample: {
          curl: `curl --request GET \\
  --url ${API_BASE_URL}/cards/card_abc123 \\
  --header 'Authorization: Bearer <token>'`
        },
        responseExample: {
          status: 200,
          json: `{
  "success": true,
  "data": {
    "id": "card_abc123",
    "type": "virtual",
    "brand": "visa",
    "last4": "4242",
    "exp_month": 12,
    "exp_year": 2027,
    "status": "active",
    "balance": 5000.00,
    "currency": "AED",
    "spending_limit": 10000.00,
    "daily_limit": 5000.00,
    "created_at": "2024-01-15T10:30:00Z"
  }
}`
        }
      },
      {
        id: 'create-card',
        method: 'POST',
        path: '/cards',
        title: 'Create Card',
        description: 'Create a new virtual or physical card.',
        category: 'cards',
        authorization: {
          type: 'Bearer',
          description: 'Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.'
        },
        bodyParams: [
          { name: 'type', type: 'enum', required: true, description: 'Type of card to create', enum: ['virtual', 'physical'] },
          { name: 'currency', type: 'string', required: true, description: 'Currency code for the card (AED, USD, EUR)' },
          { name: 'spending_limit', type: 'number', required: false, description: 'Monthly spending limit' },
          { name: 'label', type: 'string', required: false, description: 'Custom label for the card' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${API_BASE_URL}/cards \\
  --header 'Authorization: Bearer <token>' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "type": "virtual",
    "currency": "AED",
    "spending_limit": 10000,
    "label": "Shopping Card"
  }'`,
          json: `{
  "type": "virtual",
  "currency": "AED",
  "spending_limit": 10000,
  "label": "Shopping Card"
}`
        },
        responseExample: {
          status: 201,
          json: `{
  "success": true,
  "data": {
    "id": "card_xyz789",
    "type": "virtual",
    "brand": "visa",
    "last4": "1234",
    "exp_month": 1,
    "exp_year": 2028,
    "status": "active",
    "balance": 0,
    "currency": "AED",
    "label": "Shopping Card",
    "created_at": "2024-01-20T14:00:00Z"
  }
}`
        }
      }
    ]
  },
  {
    id: 'transactions',
    title: 'Transactions',
    titleRu: 'Транзакции',
    icon: '📊',
    endpoints: [
      {
        id: 'list-transactions',
        method: 'GET',
        path: '/transactions',
        title: 'List Transactions',
        description: 'Retrieve transaction history with optional filters.',
        category: 'transactions',
        authorization: {
          type: 'Bearer',
          description: 'Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.'
        },
        queryParams: [
          { name: 'card_id', type: 'string', required: false, description: 'Filter by card ID' },
          { name: 'type', type: 'string', required: false, description: 'Filter by transaction type' },
          { name: 'status', type: 'string', required: false, description: 'Filter by status' },
          { name: 'from_date', type: 'string', required: false, description: 'Start date (ISO 8601)' },
          { name: 'to_date', type: 'string', required: false, description: 'End date (ISO 8601)' },
          { name: 'limit', type: 'number', required: false, description: 'Number of results (default: 20, max: 100)' },
          { name: 'offset', type: 'number', required: false, description: 'Pagination offset' }
        ],
        requestExample: {
          curl: `curl --request GET \\
  --url '${API_BASE_URL}/transactions?limit=10&status=completed' \\
  --header 'Authorization: Bearer <token>'`
        },
        responseExample: {
          status: 200,
          json: `{
  "success": true,
  "data": [
    {
      "id": "txn_abc123",
      "type": "card_payment",
      "amount": -150.00,
      "currency": "AED",
      "status": "completed",
      "merchant_name": "Amazon UAE",
      "merchant_category": "shopping",
      "card_id": "card_abc123",
      "created_at": "2024-01-20T15:30:00Z"
    }
  ],
  "total_count": 156,
  "has_more": true
}`
        },
        responseParams: [
          { name: 'id', type: 'string', required: true, description: 'Unique transaction identifier' },
          { name: 'type', type: 'enum', required: true, description: 'Transaction type', enum: ['card_payment', 'top_up', 'transfer', 'withdrawal', 'refund', 'fee'] },
          { name: 'amount', type: 'number', required: true, description: 'Transaction amount (negative for debits)' },
          { name: 'status', type: 'enum', required: true, description: 'Transaction status', enum: ['pending', 'completed', 'failed', 'cancelled'] }
        ]
      },
      {
        id: 'get-transaction',
        method: 'GET',
        path: '/transactions/{transaction_id}',
        title: 'Get Transaction',
        description: 'Retrieve details of a specific transaction.',
        category: 'transactions',
        authorization: {
          type: 'Bearer',
          description: 'Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.'
        },
        pathParams: [
          { name: 'transaction_id', type: 'string', required: true, description: 'The unique identifier of the transaction' }
        ],
        requestExample: {
          curl: `curl --request GET \\
  --url ${API_BASE_URL}/transactions/txn_abc123 \\
  --header 'Authorization: Bearer <token>'`
        },
        responseExample: {
          status: 200,
          json: `{
  "success": true,
  "data": {
    "id": "txn_abc123",
    "type": "card_payment",
    "amount": -150.00,
    "currency": "AED",
    "status": "completed",
    "merchant_name": "Amazon UAE",
    "merchant_category": "shopping",
    "merchant_country": "AE",
    "card_id": "card_abc123",
    "card_last4": "4242",
    "fee_amount": 0,
    "exchange_rate": null,
    "original_amount": null,
    "original_currency": null,
    "created_at": "2024-01-20T15:30:00Z",
    "completed_at": "2024-01-20T15:30:05Z"
  }
}`
        }
      }
    ]
  },
  {
    id: 'transfers',
    title: 'Transfers',
    titleRu: 'Переводы',
    icon: '💸',
    endpoints: [
      {
        id: 'create-transfer',
        method: 'POST',
        path: '/transfers',
        title: 'Create Transfer',
        description: 'Initiate a transfer to another user or external account.',
        category: 'transfers',
        authorization: {
          type: 'Bearer',
          description: 'Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.'
        },
        bodyParams: [
          { name: 'amount', type: 'number', required: true, description: 'Transfer amount in base currency units (e.g., 1050 for 10.50 AED)' },
          { name: 'currency', type: 'string', required: true, description: 'Currency code (ISO 4217)' },
          { name: 'recipient_type', type: 'enum', required: true, description: 'Type of recipient', enum: ['username', 'phone', 'card', 'bank'] },
          { name: 'recipient', type: 'string', required: true, description: 'Recipient identifier (username, phone, card number, or IBAN)' },
          { name: 'description', type: 'string', required: false, description: 'Transfer description or note' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${API_BASE_URL}/transfers \\
  --header 'Authorization: Bearer <token>' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "amount": 10000,
    "currency": "AED",
    "recipient_type": "username",
    "recipient": "john_doe",
    "description": "Dinner payment"
  }'`,
          json: `{
  "amount": 10000,
  "currency": "AED",
  "recipient_type": "username",
  "recipient": "john_doe",
  "description": "Dinner payment"
}`
        },
        responseExample: {
          status: 201,
          json: `{
  "success": true,
  "data": {
    "id": "tfr_xyz789",
    "status": "completed",
    "amount": 100.00,
    "currency": "AED",
    "fee_amount": 0.50,
    "recipient": {
      "type": "username",
      "identifier": "john_doe",
      "display_name": "John Doe"
    },
    "description": "Dinner payment",
    "created_at": "2024-01-20T16:00:00Z"
  }
}`
        },
        notes: [
          'Amount should be passed in base currency units (fils for AED). For example, 10.50 AED = 1050.',
          'Transfers to usernames and phone numbers are instant and free.',
          'Bank transfers may take 1-3 business days and incur fees.'
        ]
      }
    ]
  },
  {
    id: 'webhooks',
    title: 'Webhooks',
    titleRu: 'Вебхуки',
    icon: '🔔',
    endpoints: [
      {
        id: 'list-webhooks',
        method: 'GET',
        path: '/webhooks',
        title: 'List Webhooks',
        description: 'Retrieve all configured webhook endpoints.',
        category: 'webhooks',
        authorization: {
          type: 'Bearer',
          description: 'Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.'
        },
        requestExample: {
          curl: `curl --request GET \\
  --url ${API_BASE_URL}/webhooks \\
  --header 'Authorization: Bearer <token>'`
        },
        responseExample: {
          status: 200,
          json: `{
  "success": true,
  "data": [
    {
      "id": "wh_abc123",
      "url": "https://example.com/webhook",
      "events": ["transaction.completed", "card.created"],
      "status": "active",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}`
        }
      },
      {
        id: 'create-webhook',
        method: 'POST',
        path: '/webhooks',
        title: 'Create Webhook',
        description: 'Register a new webhook endpoint to receive event notifications.',
        category: 'webhooks',
        authorization: {
          type: 'Bearer',
          description: 'Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.'
        },
        bodyParams: [
          { name: 'url', type: 'string', required: true, description: 'HTTPS URL to receive webhook events' },
          { name: 'events', type: 'array', required: true, description: 'List of event types to subscribe to' },
          { name: 'secret', type: 'string', required: false, description: 'Secret key for webhook signature verification' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${API_BASE_URL}/webhooks \\
  --header 'Authorization: Bearer <token>' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "url": "https://example.com/webhook",
    "events": ["transaction.completed", "card.created", "transfer.completed"]
  }'`,
          json: `{
  "url": "https://example.com/webhook",
  "events": ["transaction.completed", "card.created", "transfer.completed"]
}`
        },
        responseExample: {
          status: 201,
          json: `{
  "success": true,
  "data": {
    "id": "wh_xyz789",
    "url": "https://example.com/webhook",
    "events": ["transaction.completed", "card.created", "transfer.completed"],
    "status": "active",
    "signing_secret": "whsec_abc123xyz...",
    "created_at": "2024-01-20T16:30:00Z"
  }
}`
        },
        notes: [
          'Webhook URLs must use HTTPS.',
          'Use the signing_secret to verify webhook signatures.',
          'Available events: transaction.completed, transaction.failed, card.created, card.frozen, transfer.completed, balance.updated'
        ]
      }
    ]
  }
];

// Get all endpoints as flat array
export const getAllEndpoints = (): ApiEndpoint[] => {
  return apiCategories.flatMap(cat => cat.endpoints);
};

// Get endpoint by ID
export const getEndpointById = (id: string): ApiEndpoint | undefined => {
  return getAllEndpoints().find(ep => ep.id === id);
};

// Get category by ID
export const getCategoryById = (id: string): ApiCategory | undefined => {
  return apiCategories.find(cat => cat.id === id);
};

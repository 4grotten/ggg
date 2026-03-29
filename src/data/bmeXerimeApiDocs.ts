// BME & Xerime API Documentation data
// Based on the official API_BME_и_Xerime.docx document

import { ApiEndpoint, ApiCategory } from "./apiDocumentation";

export const BME_API_BASE_URL = "https://<host>/xerimeAPI/api/v2";

const BEARER_AUTH = {
  type: "Bearer" as const,
  description: "Authorization: Bearer <JWT token>",
};

export const bmeXerimeCategories: ApiCategory[] = [
  // ============ AUTH ============
  {
    id: "bme-auth",
    title: "Аутентификация",
    titleKey: "api.bme.categories.auth",
    icon: "🔐",
    endpoints: [
      {
        id: "bme-login",
        method: "POST",
        path: "/api/v2/login",
        title: "Login",
        description:
          "Получение JWT токена для аутентификации. Токен действителен 24 часа.",
        category: "bme-auth",
        bodyParams: [
          { name: "username", type: "string", required: true, description: "Имя пользователя" },
          { name: "password", type: "string", required: true, description: "Пароль" },
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${BME_API_BASE_URL}/login \\
  --header 'Content-Type: application/json' \\
  --data '{
    "username": "your_username",
    "password": "your_password"
  }'`,
          json: `{
  "username": "your_username",
  "password": "your_password"
}`,
        },
        responseExample: {
          status: 200,
          json: `{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 86400,
  "company_info": {
    "username": "your_username",
    "company_name": "Apofiz",
    "is_admin": false,
    "authorized_merchants": ["apofiz-test-0"]
  }
}`,
        },
        responseParams: [
          { name: "access_token", type: "string", required: true, description: "JWT токен для Authorization header" },
          { name: "token_type", type: "string", required: true, description: "Тип токена (bearer)" },
          { name: "expires_in", type: "number", required: true, description: "Время жизни токена в секундах (86400 = 24ч)" },
          { name: "company_info", type: "object", required: true, description: "Информация о компании и доступных мерчантах" },
        ],
        notes: ["Токен действителен 24 часа", "Обновите токен до истечения срока действия"],
      },
    ],
  },

  // ============ MERCHANT WALLETS ============
  {
    id: "bme-wallets",
    title: "Кошельки мерчантов",
    titleKey: "api.bme.categories.wallets",
    icon: "👛",
    endpoints: [
      {
        id: "bme-merchant-wallets",
        method: "GET",
        path: "/api/v2/merchant-wallets/{merchant_id}",
        title: "Получить кошельки мерчанта",
        description:
          "Возвращает адреса кошельков мерчанта для приёма крипто-депозитов.",
        category: "bme-wallets",
        authorization: BEARER_AUTH,
        pathParams: [
          { name: "merchant_id", type: "string", required: true, description: "Уникальный идентификатор мерчанта" },
        ],
        queryParams: [
          {
            name: "chains",
            type: "string",
            required: false,
            description:
              "Фильтр по сетям (tron, ethereum). Можно указать несколько раз. Если не указан — возвращаются все разрешённые сети.",
          },
        ],
        requestExample: {
          curl: `curl --request GET \\
  --url '${BME_API_BASE_URL}/merchant-wallets/apofiz-test-0?chains=tron&chains=ethereum' \\
  --header 'Authorization: Bearer <token>'`,
        },
        responseExample: {
          status: 200,
          json: `{
  "merchant_id": "apofiz-test-0",
  "wallet_addresses": [
    {
      "network": "tron",
      "address": "TPBy4bgSe13xajspqhFTmBvfVo5CvDG7Xj",
      "qr_code_data": "data:image/png;base64,iVB..."
    },
    {
      "network": "ethereum",
      "address": "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B",
      "qr_code_data": "data:image/png;base64,iVB..."
    }
  ]
}`,
        },
        responseParams: [
          { name: "merchant_id", type: "string", required: true, description: "ID мерчанта" },
          { name: "wallet_addresses", type: "array", required: true, description: "Массив адресов кошельков с QR-кодами" },
        ],
        notes: [
          "chains должен быть подмножеством разрешённых сетей компании",
          "Если chains не указан — возвращаются все разрешённые сети",
        ],
      },
      {
        id: "bme-merchant-balances",
        method: "GET",
        path: "/api/v2/merchant-balances/{merchant_id}",
        title: "Получить балансы мерчанта",
        description:
          "Возвращает нетто-балансы мерчанта по всем валютам.",
        category: "bme-wallets",
        authorization: BEARER_AUTH,
        pathParams: [
          { name: "merchant_id", type: "string", required: true, description: "Уникальный идентификатор мерчанта" },
        ],
        requestExample: {
          curl: `curl --request GET \\
  --url '${BME_API_BASE_URL}/merchant-balances/apofiz-test-0' \\
  --header 'Authorization: Bearer <token>'`,
        },
        responseExample: {
          status: 200,
          json: `{
  "merchant_id": "apofiz-test-0",
  "balances": {
    "AED": "3500.00",
    "USDT": "750.000000000000000000"
  }
}`,
        },
        responseParams: [
          { name: "merchant_id", type: "string", required: true, description: "ID мерчанта" },
          { name: "balances", type: "object", required: true, description: "Объект с балансами по валютам" },
        ],
        notes: [
          "Только валюты с ненулевым балансом",
          "Фиат-депозиты считаются только со статусом DEPOSITED",
          "Крипто-депозиты считаются только со статусом pending_threshold",
          "Активные выводы (pending, processing, completed) вычитаются из баланса",
        ],
      },
    ],
  },

  // ============ CRYPTO DEPOSITS ============
  {
    id: "bme-crypto-deposits",
    title: "Крипто-депозиты",
    titleKey: "api.bme.categories.cryptoDeposits",
    icon: "💎",
    endpoints: [
      {
        id: "bme-crypto-deposit",
        method: "POST",
        path: "/api/v2/crypto-deposit",
        title: "Регистрация крипто-депозита",
        description:
          "Регистрирует крипто-депозит без конвертации. Депозит остаётся в той же валюте. Курс всегда 1.0.",
        category: "bme-crypto-deposits",
        authorization: BEARER_AUTH,
        bodyParams: [
          { name: "crypto_amount", type: "number", required: true, description: "Сумма в крипто" },
          { name: "crypto_currency", type: "string", required: true, description: "Криптовалюта (USDT, USDC и др.)" },
          { name: "blockchain_tx_hash", type: "string", required: true, description: "Хеш транзакции в блокчейне" },
          { name: "network", type: "string", required: true, description: "Сеть (tron, ethereum)" },
          { name: "wallet", type: "string", required: true, description: "Адрес кошелька получателя" },
          { name: "merchant_id", type: "string", required: true, description: "ID мерчанта" },
          { name: "merchant_name", type: "string", required: true, description: "Имя мерчанта" },
          { name: "email", type: "string", required: true, description: "Email мерчанта" },
          { name: "review_id", type: "string", required: true, description: "Уникальный ID ревью/заказа" },
          { name: "merchant_phone", type: "string", required: false, description: "Телефон мерчанта" },
          { name: "category_name", type: "string", required: false, description: "Категория транзакции" },
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${BME_API_BASE_URL}/crypto-deposit \\
  --header 'Authorization: Bearer <token>' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "network": "ethereum",
    "crypto_amount": 500.0,
    "crypto_currency": "USDT",
    "blockchain_tx_hash": "abc123def456...",
    "wallet": "TPBy4bgSe13xajspqhFTmBvfVo5CvDG7Xj",
    "merchant_id": "apofiz-test-0",
    "merchant_name": "John Doe",
    "email": "john@example.com",
    "review_id": "R12345"
  }'`,
          json: `{
  "network": "ethereum",
  "crypto_amount": 500.0,
  "crypto_currency": "USDT",
  "blockchain_tx_hash": "abc123def456...",
  "wallet": "TPBy4bgSe13xajspqhFTmBvfVo5CvDG7Xj",
  "merchant_id": "apofiz-test-0",
  "merchant_name": "John Doe",
  "email": "john@example.com",
  "review_id": "R12345"
}`,
        },
        responseExample: {
          status: 200,
          json: `{
  "reference_id": "DUS0324FBDDE420",
  "wallet_addresses": [
    {
      "network": "tron",
      "address": "TPBy4bgSe13xajspqhFTmBvfVo5CvDG7Xj",
      "qr_code_data": "data:image/png;base64,iVB..."
    }
  ]
}`,
        },
        notes: [
          "Дубликат blockchain_tx_hash + network → HTTP 409",
          "Курс всегда 1.0 (без конвертации)",
        ],
      },
      {
        id: "bme-rub-to-crypto",
        method: "POST",
        path: "/api/v2/rub-to-crypto",
        title: "RUB → Crypto депозит",
        description:
          "Создаёт депозит RUB → Crypto через DoverkaPay SBP. Курс и крипто-сумма рассчитываются автоматически. Возвращает SBP-ссылку для оплаты.",
        category: "bme-crypto-deposits",
        authorization: BEARER_AUTH,
        bodyParams: [
          { name: "rub_amount", type: "number", required: true, description: "Сумма в рублях (> 0)" },
          { name: "crypto_currency", type: "string", required: true, description: "Целевая криптовалюта (USDT)" },
          { name: "merchant_id", type: "string", required: true, description: "ID мерчанта" },
          { name: "review_id", type: "string", required: true, description: "Уникальный ID ревью/заказа" },
          { name: "merchant_name", type: "string", required: false, description: "Отображаемое имя мерчанта" },
          { name: "email", type: "string", required: false, description: "Email мерчанта" },
          { name: "webhook_url", type: "string", required: false, description: "URL для webhook-уведомлений при терминальном статусе (paid, expired, cancelled, failed)" },
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${BME_API_BASE_URL}/rub-to-crypto \\
  --header 'Authorization: Bearer <token>' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "rub_amount": 10000.0,
    "crypto_currency": "USDT",
    "merchant_id": "apofiz-test-0",
    "review_id": "R12345"
  }'`,
          json: `{
  "rub_amount": 10000.0,
  "crypto_currency": "USDT",
  "merchant_id": "apofiz-test-0",
  "review_id": "R12345"
}`,
        },
        responseExample: {
          status: 200,
          json: `{
  "reference_id": "RUS0324A1B2C3D4",
  "status": "processing",
  "sbp_link": "https://qr.nspk.ru/...",
  "public_link": "https://pay.doverkapay.com/...",
  "rub_amount": 10000.0,
  "crypto_currency": "USDT",
  "crypto_amount": 105.26,
  "rate": 95.0,
  "expires_at": "2026-03-24T11:22:51"
}`,
        },
        notes: [
          "crypto_amount и rate определяются автоматически",
          "Webhook отправляется при статусах: paid, expired, cancelled, failed",
          "Retry policy: 3 попытки с задержками 2s → 4s → 8s",
          "Любой 2xx статус считается успешным ответом на webhook",
        ],
      },
    ],
  },

  // ============ CRYPTO WITHDRAWALS ============
  {
    id: "bme-crypto-withdrawals",
    title: "Крипто-выводы",
    titleKey: "api.bme.categories.cryptoWithdrawals",
    icon: "📤",
    endpoints: [
      {
        id: "bme-create-crypto-withdrawal",
        method: "POST",
        path: "/api/v2/crypto-withdrawal",
        title: "Создать крипто-вывод",
        description:
          "Создаёт запрос на вывод криптовалюты. Возвращается сразу со статусом pending. Используйте GET /crypto-withdrawals/{reference_id} для получения финального статуса.",
        category: "bme-crypto-withdrawals",
        authorization: BEARER_AUTH,
        bodyParams: [
          { name: "merchant_id", type: "string", required: true, description: "ID мерчанта" },
          { name: "crypto_currency", type: "string", required: true, description: "Актив: USDT, USDC, DAI, BUSD, USDP, TUSD, GUSD, FRAX" },
          { name: "crypto_amount", type: "number", required: true, description: "Сумма (> 0)" },
          { name: "destination_address", type: "string", required: true, description: "Адрес назначения в блокчейне" },
          { name: "network", type: "string", required: true, description: "Сеть: tron, ethereum" },
          { name: "external_reference", type: "string", required: true, description: "Уникальный идентификатор (1–255 символов)" },
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${BME_API_BASE_URL}/crypto-withdrawal \\
  --header 'Authorization: Bearer <token>' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "merchant_id": "apofiz-test-0",
    "crypto_currency": "USDT",
    "crypto_amount": 100.0,
    "destination_address": "TLkep2jMKSCpX2sM4gFoGmi4xRvMEP32vS",
    "network": "tron",
    "external_reference": "payout-0042"
  }'`,
          json: `{
  "merchant_id": "apofiz-test-0",
  "crypto_currency": "USDT",
  "crypto_amount": 100.0,
  "destination_address": "TLkep2jMKSCpX2sM4gFoGmi4xRvMEP32vS",
  "network": "tron",
  "external_reference": "payout-0042"
}`,
        },
        responseExample: {
          status: 202,
          json: `{
  "reference_id": "WD-A1B2C3D4E5F6",
  "company_name": "Apofiz",
  "merchant_id": "apofiz-test-0",
  "crypto_currency": "USDT",
  "crypto_amount": "100.0",
  "destination_address": "TLkep2jMKSCpX2sM4gFoGmi4xRvMEP32vS",
  "network": "tron",
  "status": "pending",
  "external_reference": "payout-0042",
  "created_at": "2026-03-25T14:30:00.000000",
  "updated_at": "2026-03-25T14:30:00.000000",
  "tx_hash": null
}`,
        },
        notes: [
          "Система проверяет баланс мерчанта перед выводом",
          "Недостаточный баланс → HTTP 422",
          "Дубликат merchant_id + external_reference → HTTP 409",
          "Статусы: pending → processing → completed_unverified → completed",
        ],
      },
      {
        id: "bme-list-crypto-withdrawals",
        method: "GET",
        path: "/api/v2/crypto-withdrawals",
        title: "Список крипто-выводов",
        description: "Возвращает список запросов на вывод криптовалюты.",
        category: "bme-crypto-withdrawals",
        authorization: BEARER_AUTH,
        queryParams: [
          { name: "status", type: "string", required: false, description: "Фильтр по статусу (pending, completed)" },
          { name: "merchant_id", type: "string", required: false, description: "Фильтр по мерчанту" },
          { name: "limit", type: "number", required: false, description: "Лимит 1–200 (по умолчанию 50)" },
          { name: "offset", type: "number", required: false, description: "Смещение (по умолчанию 0)" },
        ],
        requestExample: {
          curl: `curl --request GET \\
  --url '${BME_API_BASE_URL}/crypto-withdrawals?merchant_id=apofiz-test-0&status=completed&limit=10' \\
  --header 'Authorization: Bearer <token>'`,
        },
        responseExample: {
          status: 200,
          json: `[
  {
    "reference_id": "WD-A1B2C3D4E5F6",
    "company_name": "Apofiz",
    "merchant_id": "apofiz-test-0",
    "crypto_currency": "USDT",
    "crypto_amount": "100.0",
    "destination_address": "TLkep2jMKSCpX2sM4gFoGmi4xRvMEP32vS"
  }
]`,
        },
      },
      {
        id: "bme-get-crypto-withdrawal",
        method: "GET",
        path: "/api/v2/crypto-withdrawals/{reference_id}",
        title: "Детали крипто-вывода",
        description: "Возвращает детальную информацию о конкретном выводе криптовалюты.",
        category: "bme-crypto-withdrawals",
        authorization: BEARER_AUTH,
        pathParams: [
          { name: "reference_id", type: "string", required: true, description: "ID вывода (e.g. WD-A1B2C3D4E5F6)" },
        ],
        requestExample: {
          curl: `curl --request GET \\
  --url '${BME_API_BASE_URL}/crypto-withdrawals/WD-A1B2C3D4E5F6' \\
  --header 'Authorization: Bearer <token>'`,
        },
        responseExample: {
          status: 200,
          json: `{
  "reference_id": "WD-A1B2C3D4E5F6",
  "company_name": "Apofiz",
  "merchant_id": "apofiz-test-0",
  "crypto_currency": "USDT",
  "crypto_amount": "100.0",
  "destination_address": "TLkep2jMKSCpX2sM4gFoGmi4xRvMEP32vS",
  "network": "tron",
  "status": "completed",
  "external_reference": "payout-0042",
  "created_at": "2026-03-25T14:30:00.000000",
  "updated_at": "2026-03-25T14:35:12.000000",
  "tx_hash": "a1b2c3d4e5f6...",
  "onchain_status": "confirmed",
  "onchain_verified_at": "2026-03-25T14:35:12.000000"
}`,
        },
      },
    ],
  },

  // ============ TRANSACTIONS ============
  {
    id: "bme-transactions",
    title: "Транзакции",
    titleKey: "api.bme.categories.transactions",
    icon: "📋",
    endpoints: [
      {
        id: "bme-list-transactions",
        method: "GET",
        path: "/api/v2/transactions",
        title: "Список транзакций",
        description: "Возвращает список всех транзакций компании.",
        category: "bme-transactions",
        authorization: BEARER_AUTH,
        queryParams: [
          { name: "status", type: "string", required: false, description: "Фильтр по статусу (not_verified, processing, paid). Можно указать несколько раз." },
          { name: "merchant_id", type: "string", required: false, description: "Фильтр по мерчанту" },
          { name: "start_date", type: "string", required: false, description: "Дата начала (ISO 8601)" },
          { name: "end_date", type: "string", required: false, description: "Дата окончания (ISO 8601)" },
        ],
        requestExample: {
          curl: `curl --request GET \\
  --url '${BME_API_BASE_URL}/transactions?merchant_id=apofiz-test-0&status=not_verified' \\
  --header 'Authorization: Bearer <token>'`,
        },
        responseExample: {
          status: 200,
          json: `{
  "transactions": [
    {
      "transaction_type": "Deposit_USDT",
      "status": "Not Verified",
      "created_at": "2026-03-24T10:09:53",
      "updated_at": "2026-03-24T10:12:27",
      "crypto_currency": "USDT",
      "crypto_amount": 500.0,
      "rate": 1.0,
      "reference_id": "DUS0324B887BEF5",
      "company_name": "Apofiz",
      "blockchain_tx_hash": "abc123def456",
      "network": "tron",
      "merchant_id": "apofiz-test-0"
    }
  ]
}`,
        },
      },
      {
        id: "bme-get-transaction",
        method: "GET",
        path: "/api/v2/transactions/{reference_id}",
        title: "Детали транзакции",
        description: "Возвращает детальную информацию о транзакции по reference_id.",
        category: "bme-transactions",
        authorization: BEARER_AUTH,
        pathParams: [
          { name: "reference_id", type: "string", required: true, description: "Reference ID транзакции (e.g. DUS0324B887BEF5)" },
        ],
        requestExample: {
          curl: `curl --request GET \\
  --url '${BME_API_BASE_URL}/transactions/DUS0324B887BEF5' \\
  --header 'Authorization: Bearer <token>'`,
        },
        responseExample: {
          status: 200,
          json: `{
  "transaction_type": "Deposit_USDT",
  "status": "Not Verified",
  "created_at": "2026-03-24T10:09:53",
  "updated_at": "2026-03-24T10:12:27",
  "crypto_currency": "USDT",
  "crypto_amount": 500.0,
  "rate": 1.0,
  "reference_id": "DUS0324B887BEF5",
  "company_name": "Apofiz",
  "blockchain_tx_hash": "abc123def456",
  "network": "tron",
  "review_id": "R12345"
}`,
        },
      },
    ],
  },

  // ============ EXCHANGE RATES ============
  {
    id: "bme-rates",
    title: "Курсы валют",
    titleKey: "api.bme.categories.rates",
    icon: "💱",
    endpoints: [
      {
        id: "bme-get-rate",
        method: "GET",
        path: "/api/v2/rates/{from_currency}/{to_currency}",
        title: "Получить курс обмена",
        description: "Возвращает текущий курс обмена для валютной пары.",
        category: "bme-rates",
        authorization: BEARER_AUTH,
        pathParams: [
          { name: "from_currency", type: "string", required: true, description: "Исходная валюта (RUB, AED, USDT)" },
          { name: "to_currency", type: "string", required: true, description: "Целевая валюта (USDT, AED)" },
        ],
        requestExample: {
          curl: `curl --request GET \\
  --url '${BME_API_BASE_URL}/rates/RUB/USDT' \\
  --header 'Authorization: Bearer <token>'`,
        },
        responseExample: {
          status: 200,
          json: `{
  "from_currency": "RUB",
  "to_currency": "USDT",
  "rate": 95.0,
  "company": "Apofiz"
}`,
        },
      },
    ],
  },

  // ============ FIAT OPERATIONS ============
  {
    id: "bme-fiat",
    title: "Фиатные операции",
    titleKey: "api.bme.categories.fiat",
    icon: "🏦",
    endpoints: [
      {
        id: "bme-aed-recipients",
        method: "POST",
        path: "/api/v2/aed-recipients",
        title: "Регистрация AED получателя",
        description:
          "Регистрирует банковский счёт (IBAN) мерчанта для вывода AED. Необходимо выполнить перед фиат-выводами.",
        category: "bme-fiat",
        authorization: BEARER_AUTH,
        bodyParams: [
          { name: "merchant_id", type: "string", required: true, description: "ID мерчанта" },
          { name: "business_name", type: "string", required: true, description: "Юридическое наименование получателя" },
          { name: "iban", type: "string", required: true, description: "IBAN в ОАЭ (23 символа, начинается с AE)" },
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${BME_API_BASE_URL}/aed-recipients \\
  --header 'Authorization: Bearer <token>' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "merchant_id": "apofiz-test-0",
    "business_name": "Merchant Company Name",
    "iban": "AE310960000410010000008"
  }'`,
          json: `{
  "merchant_id": "apofiz-test-0",
  "business_name": "Merchant Company Name",
  "iban": "AE310960000410010000008"
}`,
        },
        responseExample: {
          status: 201,
          json: `{
  "status": "created",
  "message": "AED recipient registered successfully"
}`,
        },
        notes: [
          "Идемпотентный — повторный запрос с тем же merchant_id + IBAN вернёт HTTP 200",
        ],
      },
      {
        id: "bme-fiat-deposit",
        method: "POST",
        path: "/api/v2/fiat-deposit",
        title: "Создать фиат-депозит",
        description:
          "Уведомляет систему о входящем банковском переводе. После вызова сделайте перевод с тем же deposit_reference в комментарии.",
        category: "bme-fiat",
        authorization: BEARER_AUTH,
        bodyParams: [
          { name: "merchant_id", type: "string", required: true, description: "ID мерчанта" },
          { name: "fiat_amount", type: "number", required: true, description: "Сумма депозита (> 0)" },
          { name: "fiat_currency", type: "string", required: true, description: "Валюта (пока только AED)" },
          { name: "deposit_reference", type: "string", required: true, description: "Уникальная ссылка (1–64 символа). Должна быть указана в комментарии банковского перевода." },
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${BME_API_BASE_URL}/fiat-deposit \\
  --header 'Authorization: Bearer <token>' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "merchant_id": "apofiz-test-0",
    "fiat_amount": 5000.00,
    "fiat_currency": "AED",
    "deposit_reference": "APFZ-123"
  }'`,
          json: `{
  "merchant_id": "apofiz-test-0",
  "fiat_amount": 5000.00,
  "fiat_currency": "AED",
  "deposit_reference": "APFZ-123"
}`,
        },
        responseExample: {
          status: 201,
          json: `{
  "reference_id": "FD..."
}`,
        },
        notes: [
          "Статусы: PENDING_DEPOSIT → DEPOSITED",
          "Система автоматически матчит перевод по reference + сумме",
        ],
      },
      {
        id: "bme-fiat-withdrawal",
        method: "POST",
        path: "/api/v2/fiat-withdrawal",
        title: "Создать фиат-вывод",
        description:
          "Выводит AED с баланса мерчанта на предварительно зарегистрированный IBAN.",
        category: "bme-fiat",
        authorization: BEARER_AUTH,
        bodyParams: [
          { name: "merchant_id", type: "string", required: true, description: "ID мерчанта" },
          { name: "fiat_amount", type: "number", required: true, description: "Сумма в AED (> 0)" },
          { name: "fiat_currency", type: "string", required: true, description: "Валюта (AED)" },
          { name: "iban", type: "string", required: true, description: "IBAN назначения (должен быть зарегистрирован)" },
          { name: "external_reference", type: "string", required: true, description: "Уникальный идентификатор (1–255 символов)" },
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${BME_API_BASE_URL}/fiat-withdrawal \\
  --header 'Authorization: Bearer <token>' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "merchant_id": "apofiz-test-0",
    "fiat_amount": 3000.00,
    "fiat_currency": "AED",
    "iban": "AE310960000410010000008",
    "external_reference": "withdrawal-001"
  }'`,
          json: `{
  "merchant_id": "apofiz-test-0",
  "fiat_amount": 3000.00,
  "fiat_currency": "AED",
  "iban": "AE310960000410010000008",
  "external_reference": "withdrawal-001"
}`,
        },
        responseExample: {
          status: 202,
          json: `{
  "reference_id": "FW-A1B2C3D4E5F6",
  "company_name": "Apofiz",
  "merchant_id": "apofiz-test-0",
  "fiat_currency": "AED",
  "fiat_amount": 3000.00,
  "iban": "AE310960000410010000008",
  "recipient_name": "Merchant Company Name",
  "status": "pending",
  "external_reference": "withdrawal-001",
  "usdt_amount": 817.44,
  "rate": "3.67",
  "fee": "5.00",
  "created_at": "2026-03-28T14:30:00.000000",
  "updated_at": "2026-03-28T14:30:00.000000"
}`,
        },
        notes: [
          "IBAN должен быть зарегистрирован через POST /api/v2/aed-recipients",
          "Проверяется баланс мерчанта (только DEPOSITED депозиты)",
          "Дубликат merchant_id + external_reference → возвращает существующий вывод",
          "Статусы: pending → processing → completed",
        ],
      },
      {
        id: "bme-list-fiat-withdrawals",
        method: "GET",
        path: "/api/v2/fiat-withdrawals",
        title: "Список фиат-выводов",
        description: "Возвращает список запросов на вывод фиатных средств.",
        category: "bme-fiat",
        authorization: BEARER_AUTH,
        queryParams: [
          { name: "status", type: "string", required: false, description: "Фильтр по статусу" },
          { name: "merchant_id", type: "string", required: false, description: "Фильтр по мерчанту" },
        ],
        requestExample: {
          curl: `curl --request GET \\
  --url '${BME_API_BASE_URL}/fiat-withdrawals?merchant_id=apofiz-test-0&status=completed' \\
  --header 'Authorization: Bearer <token>'`,
        },
        responseExample: {
          status: 200,
          json: `[
  {
    "reference_id": "FW-A1B2C3D4E5F6",
    "company_name": "Apofiz",
    "merchant_id": "apofiz-test-0",
    "fiat_currency": "AED",
    "fiat_amount": 3000.00,
    "iban": "AE310960000410010000008",
    "recipient_name": "Merchant Company Name",
    "status": "completed",
    "external_reference": "withdrawal-001",
    "usdt_amount": 817.44,
    "rate": "3.67"
  }
]`,
        },
      },
      {
        id: "bme-get-fiat-withdrawal",
        method: "GET",
        path: "/api/v2/fiat-withdrawals/{reference_id}",
        title: "Детали фиат-вывода",
        description: "Возвращает детальную информацию о фиат-выводе.",
        category: "bme-fiat",
        authorization: BEARER_AUTH,
        pathParams: [
          { name: "reference_id", type: "string", required: true, description: "ID вывода (e.g. FW-A1B2C3D4E5F6)" },
        ],
        requestExample: {
          curl: `curl --request GET \\
  --url '${BME_API_BASE_URL}/fiat-withdrawals/FW-A1B2C3D4E5F6' \\
  --header 'Authorization: Bearer <token>'`,
        },
        responseExample: {
          status: 200,
          json: `{
  "reference_id": "FW-A1B2C3D4E5F6",
  "company_name": "Apofiz",
  "merchant_id": "apofiz-test-0",
  "fiat_currency": "AED",
  "fiat_amount": 3000.00,
  "iban": "AE310960000410010000008",
  "recipient_name": "Merchant Company Name",
  "status": "completed",
  "external_reference": "withdrawal-001",
  "usdt_amount": 817.44,
  "rate": "3.67",
  "fee": "5.00",
  "arp_transaction_id": "arp-tx-123",
  "created_at": "2026-03-28T14:30:00.000000",
  "updated_at": "2026-03-28T15:12:00.000000"
}`,
        },
      },
    ],
  },

  // ============ HEALTH ============
  {
    id: "bme-health",
    title: "Системные",
    titleKey: "api.bme.categories.health",
    icon: "🔧",
    endpoints: [
      {
        id: "bme-health-check",
        method: "GET",
        path: "/health",
        title: "Health Check",
        description: "Проверка доступности API. Аутентификация не требуется.",
        category: "bme-health",
        requestExample: {
          curl: `curl --request GET \\
  --url ${BME_API_BASE_URL.replace('/api/v2', '')}/health`,
        },
        responseExample: {
          status: 200,
          json: `{
  "status": "ok",
  "timestamp": "2026-02-19T12:00:00.000000"
}`,
        },
      },
    ],
  },
];

export const getBmeEndpointById = (id: string): ApiEndpoint | undefined => {
  for (const category of bmeXerimeCategories) {
    const endpoint = category.endpoints.find((e) => e.id === id);
    if (endpoint) return endpoint;
  }
  return undefined;
};

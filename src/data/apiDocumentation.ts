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

const TOKEN_AUTH = {
  type: 'Token' as const,
  description: 'Authorization: Token <ваш_токен>'
};

// API Categories and Endpoints
export const apiCategories: ApiCategory[] = [
  // ============ РАЗДЕЛ 1: АВТОРИЗАЦИЯ И РЕГИСТРАЦИЯ ============
  {
    id: 'authentication',
    title: 'Авторизация и Регистрация',
    titleKey: 'api.categories.authentication',
    icon: '🔐',
    endpoints: [
      // 1. Отправка OTP
      {
        id: 'otp-send',
        method: 'POST',
        path: '/accounts/otp/send/',
        title: 'Отправка OTP кода',
        description: 'Отправляет OTP код на телефон пользователя через SMS или WhatsApp.',
        category: 'authentication',
        bodyParams: [
          { name: 'phone_number', type: 'string', required: true, description: 'Номер телефона в международном формате (например, +971501234567)' },
          { name: 'type', type: 'enum', required: false, description: 'Канал отправки кода', enum: ['sms', 'whatsapp'] }
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
  "status": "success",
  "message": "OTP sent successfully"
}`
        },
        responseParams: [
          { name: 'status', type: 'string', required: true, description: 'Статус выполнения запроса' },
          { name: 'message', type: 'string', required: true, description: 'Текстовое пояснение' }
        ],
        notes: [
          'По умолчанию тип "whatsapp", если не указан',
          'Для номеров +996 (Кыргызстан) используется SMS',
          'OTP действителен 5 минут'
        ]
      },
      // 2. Проверка OTP (Вход/Регистрация)
      {
        id: 'otp-verify',
        method: 'POST',
        path: '/accounts/otp/verify/',
        title: 'Проверка OTP кода',
        description: 'Подтверждение кода. Если пользователь новый, система автоматически создает ему счета и карты.',
        category: 'authentication',
        bodyParams: [
          { name: 'phone_number', type: 'string', required: true, description: 'Номер телефона в международном формате' },
          { name: 'code', type: 'string', required: true, description: '6-значный OTP код из сообщения' }
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
  "token": "a1b2c3d4e5f6g7h8i9j0",
  "user": {
    "id": 1234,
    "username": "+971501234567"
  }
}`
        },
        responseParams: [
          { name: 'token', type: 'string', required: true, description: 'Токен доступа для заголовка Authorization' },
          { name: 'user', type: 'object', required: true, description: 'Объект пользователя' },
          { name: 'user.id', type: 'number', required: true, description: 'Уникальный ID пользователя в базе' },
          { name: 'user.username', type: 'string', required: true, description: 'Логин (совпадает с номером телефона)' }
        ]
      },
      // 3. Быстрая регистрация (Apofiz)
      {
        id: 'register-auth',
        method: 'POST',
        path: '/accounts/register_auth/',
        title: 'Быстрая регистрация (Apofiz)',
        description: 'Быстрая авторизация по номеру телефона (специальный флоу Apofiz).',
        category: 'authentication',
        bodyParams: [
          { name: 'phone_number', type: 'string', required: true, description: 'Номер телефона для авторизации' }
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
  "token": "a1b2c3d4e5f6g7h8i9j0"
}`
        },
        responseParams: [
          { name: 'token', type: 'string', required: true, description: 'Токен сессии' }
        ]
      },
      // 4. Проверка кода регистрации (Apofiz)
      {
        id: 'verify-code',
        method: 'POST',
        path: '/accounts/verify_code/',
        title: 'Проверка кода регистрации (Apofiz)',
        description: 'Альтернативный метод проверки кода для Apofiz.',
        category: 'authentication',
        bodyParams: [
          { name: 'phone_number', type: 'string', required: true, description: 'Номер телефона' },
          { name: 'code', type: 'number', required: true, description: '6-значный код (передается как число)' }
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
  "token": "a1b2c3d4e5f6g7h8i9j0",
  "user": {
    "id": 1234,
    "username": "+971501234567"
  }
}`
        },
        responseParams: [
          { name: 'token', type: 'string', required: true, description: 'Выданный токен' },
          { name: 'user', type: 'object', required: true, description: 'Объект пользователя' }
        ]
      },
      // 5. Повторная отправка кода
      {
        id: 'resend-code',
        method: 'POST',
        path: '/accounts/resend_code/',
        title: 'Повторная отправка кода',
        description: 'Запрос повторной отправки проверочного кода.',
        category: 'authentication',
        bodyParams: [
          { name: 'phone_number', type: 'string', required: true, description: 'Номер телефона' },
          { name: 'type', type: 'enum', required: false, description: 'Тип канала отправки', enum: ['register_auth_type', 'whatsapp_auth_type', 'email_auth_type'] }
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
  "status": "success",
  "message": "Code resent"
}`
        },
        responseParams: [
          { name: 'status', type: 'string', required: true, description: 'Успешный статус' },
          { name: 'message', type: 'string', required: true, description: 'Сообщение об успешной повторной отправке' }
        ]
      },
      // 6. Вход по паролю
      {
        id: 'login',
        method: 'POST',
        path: '/accounts/login/',
        title: 'Вход по паролю',
        description: 'Классический вход по паролю (если пользователь его установил).',
        category: 'authentication',
        bodyParams: [
          { name: 'phone_number', type: 'string', required: true, description: 'Номер телефона' },
          { name: 'password', type: 'string', required: true, description: 'Установленный пароль' },
          { name: 'location', type: 'string', required: false, description: 'Город/Локация входа для истории безопасности' },
          { name: 'device', type: 'string', required: false, description: 'Имя устройства' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${ACCOUNTS_URL}/login/ \\
  --header 'Content-Type: application/json' \\
  --data '{
    "phone_number": "+971501234567",
    "password": "my_password_123",
    "location": "Dubai, UAE",
    "device": "iPhone 15 Pro"
  }'`,
          json: `{
  "phone_number": "+971501234567",
  "password": "my_password_123",
  "location": "Dubai, UAE",
  "device": "iPhone 15 Pro"
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "token": "a1b2c3d4e5f6g7h8i9j0",
  "user": {
    "id": 1234,
    "username": "+971501234567"
  }
}`
        },
        responseParams: [
          { name: 'token', type: 'string', required: true, description: 'Токен сессии' },
          { name: 'user', type: 'object', required: true, description: 'Объект пользователя с id и username' }
        ]
      },
      // 7. Выход из системы
      {
        id: 'logout',
        method: 'POST',
        path: '/accounts/logout/',
        title: 'Выход из системы',
        description: 'Уничтожает токен сессии на сервере.',
        category: 'authentication',
        authorization: TOKEN_AUTH,
        requestExample: {
          curl: `curl --request POST \\
  --url ${ACCOUNTS_URL}/logout/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{}'`,
          json: `{}`
        },
        responseExample: {
          status: 200,
          json: `{
  "status": "success"
}`
        },
        responseParams: [
          { name: 'status', type: 'string', required: true, description: 'Подтверждение выхода' }
        ]
      }
    ]
  },
  // ============ РАЗДЕЛ: ПАРОЛИ И ВОССТАНОВЛЕНИЕ ============
  {
    id: 'password',
    title: 'Пароли и восстановление',
    titleKey: 'api.categories.password',
    icon: '🔑',
    endpoints: [
      // 8. Установить пароль
      {
        id: 'set-password',
        method: 'POST',
        path: '/accounts/set_password/',
        title: 'Установить пароль (первый раз)',
        description: 'Позволяет пользователю задать постоянный пароль для входа.',
        category: 'password',
        authorization: TOKEN_AUTH,
        bodyParams: [
          { name: 'password', type: 'string', required: true, description: 'Новый пароль' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${ACCOUNTS_URL}/set_password/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "password": "new_secure_password"
  }'`,
          json: `{
  "password": "new_secure_password"
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "status": "success"
}`
        },
        responseParams: [
          { name: 'status', type: 'string', required: true, description: 'Подтверждение установки' }
        ]
      },
      // 9. Изменить пароль
      {
        id: 'change-password',
        method: 'POST',
        path: '/accounts/users/doChangePassword/',
        title: 'Изменить пароль',
        description: 'Изменение пароля для авторизованного пользователя.',
        category: 'password',
        authorization: TOKEN_AUTH,
        bodyParams: [
          { name: 'old_password', type: 'string', required: true, description: 'Текущий пароль' },
          { name: 'new_password', type: 'string', required: true, description: 'Новый пароль' }
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
  "status": "success"
}`
        },
        responseParams: [
          { name: 'status', type: 'string', required: true, description: 'Подтверждение изменения' }
        ]
      },
      // 10. Забыл пароль (по телефону)
      {
        id: 'forgot-password',
        method: 'POST',
        path: '/accounts/users/forgot_password/',
        title: 'Забыл пароль (по телефону)',
        description: 'Инициирует сброс пароля через SMS или WhatsApp.',
        category: 'password',
        bodyParams: [
          { name: 'phone_number', type: 'string', required: true, description: 'Номер телефона для восстановления' },
          { name: 'method', type: 'enum', required: false, description: 'Канал получения инструкции', enum: ['sms', 'whatsapp'] }
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
  "status": "success"
}`
        },
        responseParams: [
          { name: 'status', type: 'string', required: true, description: 'Инструкции отправлены' }
        ]
      },
      // 11. Забыл пароль (по email)
      {
        id: 'forgot-password-email',
        method: 'POST',
        path: '/accounts/users/forgot_password_email/',
        title: 'Забыл пароль (по Email)',
        description: 'Инициирует сброс пароля через электронную почту.',
        category: 'password',
        bodyParams: [
          { name: 'email', type: 'string', required: true, description: 'Email для восстановления' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${ACCOUNTS_URL}/users/forgot_password_email/ \\
  --header 'Content-Type: application/json' \\
  --data '{
    "email": "user@example.com"
  }'`,
          json: `{
  "email": "user@example.com"
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "status": "success"
}`
        },
        responseParams: [
          { name: 'status', type: 'string', required: true, description: 'Ссылка отправлена' }
        ]
      }
    ]
  },
  // ============ РАЗДЕЛ 2: УПРАВЛЕНИЕ ПРОФИЛЕМ ============
  {
    id: 'profile',
    title: 'Управление профилем',
    titleKey: 'api.categories.profile',
    icon: '👤',
    endpoints: [
      // 12. Получить данные текущего пользователя
      {
        id: 'get-current-user',
        method: 'GET',
        path: '/accounts/users/me/',
        title: 'Получить данные текущего пользователя',
        description: 'Получение полной информации о профиле. Запрашивается при загрузке приложения.',
        category: 'profile',
        authorization: TOKEN_AUTH,
        requestExample: {
          curl: `curl --request GET \\
  --url ${ACCOUNTS_URL}/users/me/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `{
  "id": 1234,
  "username": "+971501234567",
  "email": "test@mail.com",
  "first_name": "Барсбек",
  "last_name": "Альманбеков",
  "profile": {
    "gender": "male",
    "date_of_birth": "1990-05-15",
    "avatar_url": "https://link_to_avatar.jpg",
    "phone": "+971501234567"
  }
}`
        },
        responseParams: [
          { name: 'id', type: 'number', required: true, description: 'ID пользователя в системе (Django User)' },
          { name: 'username', type: 'string', required: true, description: 'Логин пользователя' },
          { name: 'email', type: 'string', required: false, description: 'Привязанная электронная почта' },
          { name: 'first_name', type: 'string', required: false, description: 'Имя (может быть пустым)' },
          { name: 'last_name', type: 'string', required: false, description: 'Фамилия (может быть пустым)' },
          { name: 'profile', type: 'object', required: true, description: 'Объект профиля с дополнительными данными' },
          { name: 'profile.gender', type: 'string', required: false, description: 'Пол пользователя (male/female/null)' },
          { name: 'profile.date_of_birth', type: 'string', required: false, description: 'Дата рождения (YYYY-MM-DD)' },
          { name: 'profile.avatar_url', type: 'string', required: false, description: 'Ссылка на фотографию профиля' },
          { name: 'profile.phone', type: 'string', required: false, description: 'Основной контактный телефон' }
        ]
      },
      // 13. Инициализация / Обновление профиля
      {
        id: 'init-profile',
        method: 'POST',
        path: '/accounts/init_profile/',
        title: 'Инициализация / Обновление профиля',
        description: 'Сохранение или изменение личных данных (имя, пол, дата рождения).',
        category: 'profile',
        authorization: TOKEN_AUTH,
        bodyParams: [
          { name: 'full_name', type: 'string', required: true, description: 'Полное ФИО' },
          { name: 'email', type: 'string', required: false, description: 'Электронная почта' },
          { name: 'gender', type: 'enum', required: false, description: 'Пол', enum: ['male', 'female'] },
          { name: 'date_of_birth', type: 'string', required: false, description: 'Дата рождения (YYYY-MM-DD)' },
          { name: 'device_type', type: 'string', required: false, description: 'Платформа устройства (android, ios, web)' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${ACCOUNTS_URL}/init_profile/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "full_name": "Барсбек Альманбеков",
    "email": "test@mail.com",
    "gender": "male",
    "date_of_birth": "1990-05-15",
    "device_type": "android"
  }'`,
          json: `{
  "full_name": "Барсбек Альманбеков",
  "email": "test@mail.com",
  "gender": "male",
  "date_of_birth": "1990-05-15",
  "device_type": "android"
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "id": 1234,
  "username": "+971501234567",
  "email": "test@mail.com",
  "first_name": "Барсбек",
  "last_name": "Альманбеков",
  "profile": {
    "gender": "male",
    "date_of_birth": "1990-05-15",
    "avatar_url": null,
    "phone": "+971501234567"
  }
}`
        },
        responseParams: [
          { name: 'id', type: 'number', required: true, description: 'ID пользователя' },
          { name: 'profile', type: 'object', required: true, description: 'Обновленный объект профиля (аналогично /users/me/)' }
        ],
        notes: [
          'Используется как для первичной настройки, так и для обновления профиля',
          'Возвращает полностью обновленный объект пользователя'
        ]
      },
      // 14. Получить Email
      {
        id: 'get-user-email',
        method: 'GET',
        path: '/accounts/users/get_email/',
        title: 'Получить Email',
        description: 'Возвращает привязанный к аккаунту email.',
        category: 'profile',
        authorization: TOKEN_AUTH,
        requestExample: {
          curl: `curl --request GET \\
  --url ${ACCOUNTS_URL}/users/get_email/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `{
  "email": "test@mail.com"
}`
        },
        responseParams: [
          { name: 'email', type: 'string', required: false, description: 'Адрес электронной почты' }
        ]
      },
      // 15. Деактивировать профиль
      {
        id: 'deactivate-profile',
        method: 'POST',
        path: '/accounts/users/deactivate/',
        title: 'Деактивировать профиль',
        description: 'Отключает аккаунт пользователя (Soft Delete).',
        category: 'profile',
        authorization: TOKEN_AUTH,
        requestExample: {
          curl: `curl --request POST \\
  --url ${ACCOUNTS_URL}/users/deactivate/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{}'`,
          json: `{}`
        },
        responseExample: {
          status: 200,
          json: `{
  "status": "success",
  "message": "Account deactivated"
}`
        },
        responseParams: [
          { name: 'status', type: 'string', required: true, description: 'Успешный статус деактивации' },
          { name: 'message', type: 'string', required: true, description: 'Сообщение' }
        ],
        notes: [
          'ВНИМАНИЕ: Деактивирует весь аккаунт пользователя, а не только сессию',
          'Аккаунт можно реактивировать повторным входом'
        ]
      },
      // 16. Получить номера телефонов
      {
        id: 'get-phone-numbers',
        method: 'GET',
        path: '/accounts/users/{user_id}/phone_numbers/',
        title: 'Получить номера телефонов',
        description: 'Список всех привязанных к профилю телефонов.',
        category: 'profile',
        authorization: TOKEN_AUTH,
        pathParams: [
          { name: 'user_id', type: 'number', required: true, description: 'ID пользователя' }
        ],
        requestExample: {
          curl: `curl --request GET \\
  --url ${ACCOUNTS_URL}/users/12345/phone_numbers/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `{
  "phone_numbers": [
    "+971501234567"
  ]
}`
        },
        responseParams: [
          { name: 'phone_numbers', type: 'array', required: true, description: 'Массив строк с номерами' }
        ]
      },
      // 17. Обновить номера телефонов
      {
        id: 'update-phone-numbers',
        method: 'POST',
        path: '/accounts/users/phone_numbers/',
        title: 'Обновить номера телефонов',
        description: 'Перезаписывает список дополнительных номеров.',
        category: 'profile',
        authorization: TOKEN_AUTH,
        bodyParams: [
          { name: 'phone_numbers', type: 'array', required: true, description: 'Массив новых номеров' }
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
  "status": "success"
}`
        },
        responseParams: [
          { name: 'status', type: 'string', required: true, description: 'Статус' }
        ]
      }
    ]
  },
  // ============ ФАЙЛЫ И СОЦСЕТИ ============
  {
    id: 'files',
    title: 'Файлы и Соцсети',
    titleKey: 'api.categories.files',
    icon: '📁',
    endpoints: [
      // 18. Загрузить аватар
      {
        id: 'upload-avatar',
        method: 'POST',
        path: '/accounts/files/',
        title: 'Загрузить аватар',
        description: 'Отправка картинки для профиля пользователя.',
        category: 'files',
        authorization: TOKEN_AUTH,
        headers: [
          { name: 'Content-Type', type: 'string', required: true, description: 'multipart/form-data' }
        ],
        bodyParams: [
          { name: 'file', type: 'file', required: true, description: 'Файл изображения (.jpg/.png)' }
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
  "file": "https://ссылка_на_картинку.jpg"
}`
        },
        responseParams: [
          { name: 'file', type: 'string', required: true, description: 'Итоговая публичная ссылка на загруженный файл' }
        ],
        notes: [
          'Максимальный размер: 5МБ',
          'Поддерживаемые форматы: JPEG, PNG'
        ]
      },
      // 19. Получить соцсети
      {
        id: 'get-social-networks',
        method: 'GET',
        path: '/accounts/users/{user_id}/social_networks/',
        title: 'Получить соцсети',
        description: 'Список привязанных ссылок на соцсети пользователя.',
        category: 'files',
        authorization: TOKEN_AUTH,
        pathParams: [
          { name: 'user_id', type: 'number', required: true, description: 'ID пользователя' }
        ],
        requestExample: {
          curl: `curl --request GET \\
  --url ${ACCOUNTS_URL}/users/12345/social_networks/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `{
  "social_networks": [
    "instagram",
    "telegram"
  ]
}`
        },
        responseParams: [
          { name: 'social_networks', type: 'array', required: true, description: 'Массив ссылок или идентификаторов соцсетей' }
        ]
      },
      // 20. Установить соцсети
      {
        id: 'set-social-networks',
        method: 'POST',
        path: '/accounts/users/social_networks/',
        title: 'Установить соцсети',
        description: 'Перезаписывает список социальных сетей.',
        category: 'files',
        authorization: TOKEN_AUTH,
        bodyParams: [
          { name: 'networks', type: 'array', required: true, description: 'Массив строк с линками' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${ACCOUNTS_URL}/users/social_networks/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "networks": ["instagram", "telegram"]
  }'`,
          json: `{
  "networks": ["instagram", "telegram"]
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "status": "success"
}`
        },
        responseParams: [
          { name: 'status', type: 'string', required: true, description: 'Успех' }
        ]
      }
    ]
  },
  // ============ УСТРОЙСТВА И СЕССИИ ============
  {
    id: 'devices',
    title: 'Устройства и Сессии',
    titleKey: 'api.categories.devices',
    icon: '📱',
    endpoints: [
      // 21. Активные устройства
      {
        id: 'get-active-devices',
        method: 'GET',
        path: '/accounts/users/get_active_devices/',
        title: 'Активные устройства (сессии)',
        description: 'Список устройств, с которых сейчас выполнен вход в аккаунт.',
        category: 'devices',
        authorization: TOKEN_AUTH,
        queryParams: [
          { name: 'page', type: 'number', required: false, description: 'Номер страницы (по умолчанию: 1)' },
          { name: 'limit', type: 'number', required: false, description: 'Элементов на страницу (по умолчанию: 50)' }
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
          { name: 'list', type: 'array', required: true, description: 'Массив активных устройств' },
          { name: 'total', type: 'number', required: true, description: 'Общее количество активных устройств' }
        ]
      },
      // 22. История авторизаций
      {
        id: 'get-authorization-history',
        method: 'GET',
        path: '/accounts/users/authorisation_history/',
        title: 'История авторизаций',
        description: 'Полный лог всех попыток входа в систему (для безопасности).',
        category: 'devices',
        authorization: TOKEN_AUTH,
        queryParams: [
          { name: 'page', type: 'number', required: false, description: 'Номер страницы (по умолчанию: 1)' },
          { name: 'limit', type: 'number', required: false, description: 'Элементов на страницу (по умолчанию: 20)' }
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
      "date": "2026-02-24T12:00:00Z",
      "device": "Android",
      "ip": "1.1.1.1"
    }
  ],
  "total": 15
}`
        },
        responseParams: [
          { name: 'list', type: 'array', required: true, description: 'Массив записей истории авторизаций' },
          { name: 'total', type: 'number', required: true, description: 'Всего записей в истории' }
        ]
      },
      // 23. Детали сессии (устройства)
      {
        id: 'get-device-detail',
        method: 'GET',
        path: '/accounts/users/get_token_detail/{device_id}/',
        title: 'Детали сессии (устройства)',
        description: 'Подробная информация об одной конкретной сессии по её ID.',
        category: 'devices',
        authorization: TOKEN_AUTH,
        pathParams: [
          { name: 'device_id', type: 'number', required: true, description: 'ID устройства/токена' }
        ],
        requestExample: {
          curl: `curl --request GET \\
  --url ${ACCOUNTS_URL}/users/get_token_detail/101/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `{
  "id": 101,
  "device_name": "iPhone 15",
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0..."
}`
        },
        responseParams: [
          { name: 'id', type: 'number', required: true, description: 'ID сессии' },
          { name: 'device_name', type: 'string', required: false, description: 'Название устройства' },
          { name: 'ip_address', type: 'string', required: true, description: 'IP адрес' },
          { name: 'user_agent', type: 'string', required: false, description: 'Подробный юзер-агент устройства' }
        ]
      }
    ]
  },
  // ============ РАЗДЕЛ 3: КОНТАКТЫ ============
  {
    id: 'contacts',
    title: 'Контакты',
    titleKey: 'api.categories.contacts',
    icon: '📇',
    endpoints: [
      // 24. Список контактов (синхронизация)
      {
        id: 'contacts-sync',
        method: 'GET',
        path: '/accounts/contacts/',
        title: 'Список контактов (синхронизация)',
        description: 'Автоматически подтягивает друзей из Apofiz и отдает весь список контактов.',
        category: 'contacts',
        authorization: TOKEN_AUTH,
        requestExample: {
          curl: `curl --request GET \\
  --url ${ACCOUNTS_URL}/contacts/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `[
  {
    "id": "uuid",
    "apofiz_id": "123",
    "full_name": "Иван Смирнов",
    "phone": "+971501234567",
    "email": "ivan@mail.com",
    "company": "Google",
    "position": "Dev",
    "avatar_url": "https://...",
    "notes": "Мой друг"
  }
]`
        },
        responseParams: [
          { name: 'id', type: 'string', required: true, description: 'Уникальный ID контакта' },
          { name: 'apofiz_id', type: 'string', required: false, description: 'ID контакта во внешней системе (если есть)' },
          { name: 'full_name', type: 'string', required: true, description: 'Полное имя' },
          { name: 'phone', type: 'string', required: false, description: 'Телефон контакта' },
          { name: 'email', type: 'string', required: false, description: 'Email контакта' },
          { name: 'company', type: 'string', required: false, description: 'Компания' },
          { name: 'position', type: 'string', required: false, description: 'Должность' },
          { name: 'avatar_url', type: 'string', required: false, description: 'Ссылка на аватарку' },
          { name: 'notes', type: 'string', required: false, description: 'Заметки пользователя' }
        ]
      },
      // 25. Создать контакт
      {
        id: 'contacts-create',
        method: 'POST',
        path: '/accounts/contacts/',
        title: 'Создать контакт вручную',
        description: 'Добавление нового контакта в телефонную книгу пользователя.',
        category: 'contacts',
        authorization: TOKEN_AUTH,
        bodyParams: [
          { name: 'full_name', type: 'string', required: true, description: 'Имя контакта' },
          { name: 'phone', type: 'string', required: false, description: 'Телефон' },
          { name: 'email', type: 'string', required: false, description: 'Email' },
          { name: 'notes', type: 'string', required: false, description: 'Заметка' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${ACCOUNTS_URL}/contacts/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "full_name": "Анна Петрова",
    "phone": "+971555000000",
    "notes": "По работе"
  }'`,
          json: `{
  "full_name": "Анна Петрова",
  "phone": "+971555000000",
  "notes": "По работе"
}`
        },
        responseExample: {
          status: 201,
          json: `{
  "id": "uuid",
  "full_name": "Анна Петрова",
  "phone": "+971555000000",
  "email": null,
  "company": null,
  "position": null,
  "avatar_url": null,
  "notes": "По работе"
}`
        },
        responseParams: [
          { name: 'id', type: 'string', required: true, description: 'ID созданного контакта' }
        ],
        notes: ['Возвращает полностью созданный объект контакта']
      },
      // 26. Получить один контакт
      {
        id: 'contacts-detail',
        method: 'GET',
        path: '/accounts/contacts/{uuid}/',
        title: 'Получить один контакт',
        description: 'Детальная карточка конкретного контакта.',
        category: 'contacts',
        authorization: TOKEN_AUTH,
        pathParams: [
          { name: 'uuid', type: 'uuid', required: true, description: 'UUID контакта' }
        ],
        requestExample: {
          curl: `curl --request GET \\
  --url ${ACCOUNTS_URL}/contacts/550e8400-e29b-41d4-a716-446655440000/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `{
  "id": "uuid",
  "full_name": "Иван Смирнов",
  "phone": "+971501234567",
  "email": "ivan@mail.com",
  "avatar_url": "https://..."
}`
        },
        responseParams: [
          { name: 'id', type: 'string', required: true, description: 'ID контакта' }
        ]
      },
      // 27. Обновить контакт (частично)
      {
        id: 'contacts-update',
        method: 'PATCH',
        path: '/accounts/contacts/{uuid}/',
        title: 'Обновить контакт (частично)',
        description: 'Изменение данных контакта. Отправляются только те поля, которые изменились.',
        category: 'contacts',
        authorization: TOKEN_AUTH,
        pathParams: [
          { name: 'uuid', type: 'uuid', required: true, description: 'UUID контакта' }
        ],
        bodyParams: [
          { name: 'full_name', type: 'string', required: false, description: 'Имя контакта' },
          { name: 'phone', type: 'string', required: false, description: 'Телефон' },
          { name: 'notes', type: 'string', required: false, description: 'Заметка' },
          { name: 'payment_methods', type: 'array', required: false, description: 'Реквизиты для быстрых переводов' }
        ],
        requestExample: {
          curl: `curl --request PATCH \\
  --url ${ACCOUNTS_URL}/contacts/550e8400-e29b-41d4-a716-446655440000/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "notes": "Обновленная заметка",
    "payment_methods": [{"type": "card", "number": "45321111"}]
  }'`,
          json: `{
  "notes": "Обновленная заметка",
  "payment_methods": [{"type": "card", "number": "45321111"}]
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "id": "uuid",
  "full_name": "Иван Смирнов",
  "notes": "Обновленная заметка",
  "payment_methods": [{"type": "card", "number": "45321111"}]
}`
        },
        responseParams: [
          { name: 'id', type: 'string', required: true, description: 'Обновленный объект контакта' }
        ]
      },
      // 28. Удалить контакт
      {
        id: 'contacts-delete',
        method: 'DELETE',
        path: '/accounts/contacts/{uuid}/',
        title: 'Удалить контакт',
        description: 'Удаление контакта из записной книжки.',
        category: 'contacts',
        authorization: TOKEN_AUTH,
        pathParams: [
          { name: 'uuid', type: 'uuid', required: true, description: 'UUID контакта' }
        ],
        requestExample: {
          curl: `curl --request DELETE \\
  --url ${ACCOUNTS_URL}/contacts/550e8400-e29b-41d4-a716-446655440000/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 204,
          json: `// Пустой ответ, статус 204 No Content`
        },
        responseParams: [],
        notes: ['Возвращает пустой ответ со статусом 204']
      },
      // 29. Загрузить аватар контакту
      {
        id: 'contacts-upload-avatar',
        method: 'POST',
        path: '/accounts/contacts/{uuid}/avatar/',
        title: 'Загрузить аватар контакту',
        description: 'Устанавливает кастомную фотографию для карточки контакта.',
        category: 'contacts',
        authorization: TOKEN_AUTH,
        headers: [
          { name: 'Content-Type', type: 'string', required: true, description: 'multipart/form-data' }
        ],
        pathParams: [
          { name: 'uuid', type: 'uuid', required: true, description: 'UUID контакта' }
        ],
        bodyParams: [
          { name: 'file', type: 'file', required: true, description: 'Файл изображения' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${ACCOUNTS_URL}/contacts/550e8400-e29b-41d4-a716-446655440000/avatar/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --form 'file=@/path/to/photo.jpg'`
        },
        responseExample: {
          status: 200,
          json: `{
  "id": "uuid",
  "avatar_url": "https://новая_ссылка.jpg"
}`
        },
        responseParams: [
          { name: 'avatar_url', type: 'string', required: true, description: 'Ссылка на загруженный аватар' }
        ]
      },
      // 30. Удалить аватар контакта
      {
        id: 'contacts-delete-avatar',
        method: 'DELETE',
        path: '/accounts/contacts/{uuid}/avatar/',
        title: 'Удалить аватар контакта',
        description: 'Сбрасывает аватарку контакта.',
        category: 'contacts',
        authorization: TOKEN_AUTH,
        pathParams: [
          { name: 'uuid', type: 'uuid', required: true, description: 'UUID контакта' }
        ],
        requestExample: {
          curl: `curl --request DELETE \\
  --url ${ACCOUNTS_URL}/contacts/550e8400-e29b-41d4-a716-446655440000/avatar/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `{
  "id": "uuid",
  "avatar_url": null
}`
        },
        responseParams: [
          { name: 'avatar_url', type: 'string', required: true, description: 'null после удаления' }
        ]
      }
    ]
  },
  // ============ РАЗДЕЛ 4: АДМИН-ПАНЕЛЬ И ЛИМИТЫ ============
  {
    id: 'admin',
    title: 'Админ-панель и Лимиты',
    titleKey: 'api.categories.admin',
    icon: '⚙️',
    endpoints: [
      // 31. Глобальные настройки (админ)
      {
        id: 'admin-settings-list',
        method: 'GET',
        path: '/accounts/admin/settings/',
        title: 'Получить глобальные настройки',
        description: 'Выводит список всех глобальных комиссий и лимитов системы по умолчанию.',
        category: 'admin',
        authorization: { type: 'Token', description: 'Authorization: Token <токен_админа>' },
        requestExample: {
          curl: `curl --request GET \\
  --url ${ACCOUNTS_URL}/admin/settings/ \\
  --header 'Authorization: Token admin_token_here'`
        },
        responseExample: {
          status: 200,
          json: `[
  {
    "id": 1,
    "category": "fees",
    "key": "card_to_card_percent",
    "value": "1.000000",
    "description": "Комиссия за перевод",
    "updated_at": "2026-02-20T10:00:00Z"
  }
]`
        },
        responseParams: [
          { name: 'id', type: 'number', required: true, description: 'Внутренний ID настройки' },
          { name: 'category', type: 'string', required: true, description: 'Категория (fees, limits)' },
          { name: 'key', type: 'string', required: true, description: 'Технический ключ' },
          { name: 'value', type: 'string', required: true, description: 'Числовое значение' },
          { name: 'description', type: 'string', required: false, description: 'Описание' },
          { name: 'updated_at', type: 'string', required: true, description: 'Время последнего изменения' }
        ]
      },
      // 32. Изменить глобальную настройку
      {
        id: 'admin-settings-update',
        method: 'PUT',
        path: '/accounts/admin/settings/',
        title: 'Изменить глобальную настройку',
        description: 'Изменяет существующую настройку или создает новую.',
        category: 'admin',
        authorization: { type: 'Token', description: 'Authorization: Token <токен_админа>' },
        bodyParams: [
          { name: 'category', type: 'string', required: true, description: 'Категория настройки' },
          { name: 'key', type: 'string', required: true, description: 'Уникальный ключ' },
          { name: 'value', type: 'number', required: true, description: 'Новое значение (например, 2.5%)' }
        ],
        requestExample: {
          curl: `curl --request PUT \\
  --url ${ACCOUNTS_URL}/admin/settings/ \\
  --header 'Authorization: Token admin_token_here' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "category": "fees",
    "key": "card_to_card_percent",
    "value": 2.5
  }'`,
          json: `{
  "category": "fees",
  "key": "card_to_card_percent",
  "value": 2.5
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "id": 1,
  "category": "fees",
  "key": "card_to_card_percent",
  "value": "2.500000",
  "description": "Комиссия за перевод",
  "updated_at": "2026-02-25T10:00:00Z"
}`
        },
        responseParams: [
          { name: 'id', type: 'number', required: true, description: 'Обновленный объект настройки' }
        ]
      },
      // 33. Лимиты всех пользователей
      {
        id: 'admin-users-limits',
        method: 'GET',
        path: '/accounts/admin/users/limits/',
        title: 'Получить лимиты всех пользователей',
        description: 'Выгружает реестр пользователей с их персональными лимитами и комиссиями.',
        category: 'admin',
        authorization: { type: 'Token', description: 'Authorization: Token <токен_админа>' },
        requestExample: {
          curl: `curl --request GET \\
  --url ${ACCOUNTS_URL}/admin/users/limits/ \\
  --header 'Authorization: Token admin_token_here'`
        },
        responseExample: {
          status: 200,
          json: `[
  {
    "user_id": "1234",
    "phone": "+971501234567",
    "custom_settings_enabled": true,
    "transfer_min": "10.00",
    "transfer_max": "999999.00",
    "daily_transfer_limit": "50000.00",
    "monthly_transfer_limit": "150000.00",
    "withdrawal_min": null,
    "withdrawal_max": null,
    "daily_withdrawal_limit": null,
    "monthly_withdrawal_limit": null
  }
]`
        },
        responseParams: [
          { name: 'user_id', type: 'string', required: true, description: 'ID пользователя' },
          { name: 'phone', type: 'string', required: true, description: 'Телефон клиента' },
          { name: 'custom_settings_enabled', type: 'boolean', required: true, description: 'Флаг индивидуальных условий' },
          { name: 'transfer_min', type: 'string', required: false, description: 'Минимальная сумма перевода' },
          { name: 'transfer_max', type: 'string', required: false, description: 'Максимальная сумма перевода' },
          { name: 'daily_transfer_limit', type: 'string', required: false, description: 'Дневной лимит переводов' },
          { name: 'monthly_transfer_limit', type: 'string', required: false, description: 'Месячный лимит переводов' }
        ]
      },
      // 34. Изменить персональные лимиты
      {
        id: 'admin-user-limit-detail',
        method: 'PATCH',
        path: '/accounts/admin/users/{user_id}/limits/',
        title: 'Изменить персональные лимиты',
        description: 'Устанавливает индивидуальные (кастомные) условия для конкретного клиента.',
        category: 'admin',
        authorization: { type: 'Token', description: 'Authorization: Token <токен_админа>' },
        pathParams: [
          { name: 'user_id', type: 'string', required: true, description: 'ID пользователя' }
        ],
        bodyParams: [
          { name: 'custom_settings_enabled', type: 'boolean', required: true, description: 'Обязательно true, чтобы система использовала индивидуальные настройки' },
          { name: 'card_to_card_percent', type: 'string', required: false, description: 'Процент комиссии за перевод' },
          { name: 'daily_transfer_limit', type: 'string', required: false, description: 'Дневной лимит переводов' }
        ],
        requestExample: {
          curl: `curl --request PATCH \\
  --url ${ACCOUNTS_URL}/admin/users/1234/limits/ \\
  --header 'Authorization: Token admin_token_here' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "custom_settings_enabled": true,
    "card_to_card_percent": "0.00",
    "daily_transfer_limit": "999999.00"
  }'`,
          json: `{
  "custom_settings_enabled": true,
  "card_to_card_percent": "0.00",
  "daily_transfer_limit": "999999.00"
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "user_id": "1234",
  "phone": "+971501234567",
  "custom_settings_enabled": true,
  "card_to_card_percent": "0.00",
  "daily_transfer_limit": "999999.00"
}`
        },
        responseParams: [
          { name: 'user_id', type: 'string', required: true, description: 'Полностью обновленный объект лимитов' }
        ]
      }
    ]
  },
  // ============ РАЗДЕЛ 5: БАЛАНСЫ И СЧЕТА (CARDS API) ============
  {
    id: 'cards',
    title: 'Балансы и Счета',
    titleKey: 'api.categories.cards',
    icon: '💳',
    endpoints: [
      // 35. Балансы всех счетов (Dashboard)
      {
        id: 'get-balances',
        method: 'GET',
        path: '/cards/balances/',
        title: 'Балансы всех счетов (Dashboard)',
        description: 'Агрегированный эндпоинт, собирающий балансы всех типов счетов (Карты, IBAN, Крипта).',
        category: 'cards',
        authorization: TOKEN_AUTH,
        requestExample: {
          curl: `curl --request GET \\
  --url ${CARDS_URL}/balances/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `{
  "cards": [
    {
      "id": "uuid",
      "type": "metal",
      "balance": "50000.00",
      "currency": "AED",
      "last_four": "1234",
      "status": "active"
    }
  ],
  "bank_accounts": [
    {
      "id": "uuid",
      "iban": "AE123456789",
      "balance": "200000.00",
      "currency": "AED",
      "bank_name": "EasyCard Bank"
    }
  ],
  "crypto_wallets": [
    {
      "id": "uuid",
      "address": "T123...",
      "balance": "5000.000000",
      "token": "USDT",
      "network": "TRC20"
    }
  ]
}`
        },
        responseParams: [
          { name: 'cards', type: 'array', required: true, description: 'Массив карт с балансами' },
          { name: 'bank_accounts', type: 'array', required: true, description: 'Массив банковских счетов' },
          { name: 'crypto_wallets', type: 'array', required: true, description: 'Массив криптокошельков' }
        ]
      },
      // 36. Получить банковский счет (IBAN AED)
      {
        id: 'get-iban-balance',
        method: 'GET',
        path: '/cards/accounts/IBAN_AED/',
        title: 'Получить банковский счет (IBAN AED)',
        description: 'Реквизиты банковского счета пользователя.',
        category: 'cards',
        authorization: TOKEN_AUTH,
        requestExample: {
          curl: `curl --request GET \\
  --url ${CARDS_URL}/accounts/IBAN_AED/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `{
  "id": "uuid",
  "iban": "AE070331234567890",
  "bank_name": "EasyCard Default Bank",
  "beneficiary": "Барсбек Альманбеков",
  "balance": "200000.00",
  "is_active": true
}`
        },
        responseParams: [
          { name: 'id', type: 'string', required: true, description: 'ID банковского профиля' },
          { name: 'iban', type: 'string', required: true, description: 'Номер счета IBAN' },
          { name: 'bank_name', type: 'string', required: true, description: 'Название банка' },
          { name: 'beneficiary', type: 'string', required: true, description: 'ФИО владельца' },
          { name: 'balance', type: 'string', required: true, description: 'Сумма в AED' },
          { name: 'is_active', type: 'boolean', required: true, description: 'Флаг активности счета' }
        ]
      },
      // 37. Список всех карт
      {
        id: 'get-user-cards',
        method: 'GET',
        path: '/cards/cards/',
        title: 'Список всех карт',
        description: 'Возвращает список выпущенных карточек с зашифрованными номерами.',
        category: 'cards',
        authorization: TOKEN_AUTH,
        requestExample: {
          curl: `curl --request GET \\
  --url ${CARDS_URL}/cards/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `[
  {
    "id": "uuid",
    "type": "metal",
    "card_number": "4532****1234",
    "currency": "AED",
    "balance": "50000.00",
    "status": "active"
  },
  {
    "id": "uuid",
    "type": "virtual",
    "card_number": "4532****5678",
    "currency": "AED",
    "balance": "25000.00",
    "status": "active"
  }
]`
        },
        responseParams: [
          { name: 'id', type: 'string', required: true, description: 'ID карты' },
          { name: 'type', type: 'string', required: true, description: 'Тип карты (metal, virtual)' },
          { name: 'card_number', type: 'string', required: true, description: 'Номер карты (замаскирован)' },
          { name: 'currency', type: 'string', required: true, description: 'Валюта' },
          { name: 'balance', type: 'string', required: true, description: 'Баланс' },
          { name: 'status', type: 'string', required: true, description: 'Статус карты' }
        ]
      },
      // 38. Сводка по крипто-кошельку (Wallet Summary)
      {
        id: 'wallet-summary',
        method: 'GET',
        path: '/cards/wallet/summary/',
        title: 'Сводка по крипто-кошельку (Wallet Summary)',
        description: 'Баланс и реквизиты криптосчета пользователя.',
        category: 'cards',
        authorization: TOKEN_AUTH,
        requestExample: {
          curl: `curl --request GET \\
  --url ${CARDS_URL}/wallet/summary/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `{
  "id": "uuid",
  "network": "TRC20",
  "token": "USDT",
  "address": "T123456abcdef",
  "balance": "5000.000000",
  "is_active": true
}`
        },
        responseParams: [
          { name: 'id', type: 'string', required: true, description: 'ID кошелька' },
          { name: 'network', type: 'string', required: true, description: 'Сеть блокчейна' },
          { name: 'token', type: 'string', required: true, description: 'Токен' },
          { name: 'address', type: 'string', required: true, description: 'Публичный адрес кошелька' },
          { name: 'balance', type: 'string', required: true, description: 'Сумма монет' },
          { name: 'is_active', type: 'boolean', required: true, description: 'Флаг активности' }
        ]
      }
    ]
  },
  // ============ РАЗДЕЛ 6: ПЕРЕВОДЫ И ВЫВОДЫ ============
  {
    id: 'transfers',
    title: 'Переводы и Выводы',
    titleKey: 'api.categories.transfers',
    icon: '🔄',
    endpoints: [
      // 39. Поиск получателя
      {
        id: 'recipient-info',
        method: 'GET',
        path: '/transactions/recipient-info/',
        title: 'Поиск получателя (реквизиты и ФИО)',
        description: 'Вызывается при вводе реквизитов, чтобы показать ФИО получателя ДО отправки денег.',
        category: 'transfers',
        authorization: TOKEN_AUTH,
        queryParams: [
          { name: 'card_number', type: 'string', required: false, description: 'Номер карты получателя' },
          { name: 'iban', type: 'string', required: false, description: 'IBAN номер' },
          { name: 'crypto_address', type: 'string', required: false, description: 'Крипто-адрес' }
        ],
        requestExample: {
          curl: `curl --request GET \\
  --url '${TRANSACTIONS_URL}/recipient-info/?card_number=4532112233123456' \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `{
  "is_internal": true,
  "recipient_name": "Анна Петрова",
  "avatar_url": "https://...",
  "card_type": "metal",
  "token": null
}`
        },
        responseParams: [
          { name: 'is_internal', type: 'boolean', required: true, description: 'Получатель внутри системы EasyCard' },
          { name: 'recipient_name', type: 'string', required: false, description: 'Имя найденного человека (null если внешний)' },
          { name: 'avatar_url', type: 'string', required: false, description: 'Фотография получателя' },
          { name: 'card_type', type: 'string', required: false, description: 'Тип продукта (если по карте)' },
          { name: 'token', type: 'string', required: false, description: 'Валюта (если по крипто-адресу)' }
        ],
        notes: [
          'Передавать ОДИН из параметров: card_number, iban или crypto_address',
          'Для внешних адресов: is_internal=false, recipient_name=null'
        ]
      },
      // 40. Пополнение банковским переводом
      {
        id: 'bank-topup',
        method: 'POST',
        path: '/transactions/topup/bank/',
        title: 'Пополнение банковским переводом (Wire)',
        description: 'Создает транзакцию в статусе pending и выдает SWIFT/IBAN реквизиты для перевода.',
        category: 'transfers',
        authorization: TOKEN_AUTH,
        bodyParams: [
          { name: 'transfer_rail', type: 'enum', required: true, description: 'Тип банковского перевода', enum: ['UAE_LOCAL_AED', 'SWIFT_INTL'] }
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
  "transaction_id": "uuid",
  "instructions": {
    "bank_name": "EasyCard Bank",
    "iban": "AE123...",
    "beneficiary": "Иван Иванов",
    "reference": "REF-uuid",
    "fee_percent": "2.00"
  }
}`
        },
        responseParams: [
          { name: 'message', type: 'string', required: true, description: 'Статус успеха' },
          { name: 'transaction_id', type: 'uuid', required: true, description: 'ID pending-транзакции' },
          { name: 'instructions', type: 'object', required: true, description: 'Реквизиты для перевода' },
          { name: 'instructions.reference', type: 'string', required: true, description: 'Номер Reference (комментарий к платежу)' }
        ],
        notes: [
          'UAE_LOCAL_AED — локальный перевод в ОАЭ (быстрее, дешевле)',
          'SWIFT_INTL — международный SWIFT перевод',
          'Транзакция в статусе pending до подтверждения банком'
        ]
      },
      // 41. Генерация адреса для крипто-пополнения
      {
        id: 'crypto-topup',
        method: 'POST',
        path: '/transactions/topup/crypto/',
        title: 'Генерация адреса для крипто-пополнения',
        description: 'Генерирует QR-код и адрес для депозита стейблкоинов на карту (авто-конвертация при поступлении).',
        category: 'transfers',
        authorization: TOKEN_AUTH,
        bodyParams: [
          { name: 'card_id', type: 'uuid', required: true, description: 'ID карты, на которую зачислятся AED' },
          { name: 'token', type: 'enum', required: true, description: 'Выбранный токен', enum: ['USDT', 'USDC'] },
          { name: 'network', type: 'enum', required: true, description: 'Сеть блокчейна', enum: ['TRC20', 'ERC20', 'BEP20', 'SOL'] }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${TRANSACTIONS_URL}/topup/crypto/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "card_id": "uuid",
    "token": "USDT",
    "network": "TRC20"
  }'`,
          json: `{
  "card_id": "uuid",
  "token": "USDT",
  "network": "TRC20"
}`
        },
        responseExample: {
          status: 201,
          json: `{
  "message": "Crypto address generated",
  "deposit_address": "T123...",
  "qr_payload": "usdt:T123..."
}`
        },
        responseParams: [
          { name: 'message', type: 'string', required: true, description: 'Статус' },
          { name: 'deposit_address', type: 'string', required: true, description: 'Адрес кошелька для перевода крипты' },
          { name: 'qr_payload', type: 'string', required: true, description: 'Строка для генерации QR-кода' }
        ],
        notes: [
          'Поддерживаемые токены: USDT, USDC',
          'Поддерживаемые сети: TRC20 (Tron), ERC20 (Ethereum), BEP20 (BSC), SOL (Solana)'
        ]
      },
      // 42. Перевод Карта -> Карта
      {
        id: 'card-transfer',
        method: 'POST',
        path: '/transactions/transfer/card/',
        title: 'Перевод Карта → Карта',
        description: 'Моментальный перевод AED с одной карты на другую (свою или чужую внутри EasyCard).',
        category: 'transfers',
        authorization: TOKEN_AUTH,
        bodyParams: [
          { name: 'sender_card_id', type: 'uuid', required: true, description: 'ID карты отправителя' },
          { name: 'receiver_card_number', type: 'string', required: true, description: '16-значный номер карты получателя' },
          { name: 'amount', type: 'string', required: true, description: 'Сумма в AED' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${TRANSACTIONS_URL}/transfer/card/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "sender_card_id": "uuid",
    "receiver_card_number": "4532112233001234",
    "amount": "100.00"
  }'`,
          json: `{
  "sender_card_id": "uuid",
  "receiver_card_number": "4532112233001234",
  "amount": "100.00"
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "message": "Transfer successful",
  "transaction_id": "uuid",
  "amount": "100.00"
}`
        },
        responseParams: [
          { name: 'message', type: 'string', required: true, description: 'Сообщение' },
          { name: 'transaction_id', type: 'uuid', required: true, description: 'ID транзакции' },
          { name: 'amount', type: 'string', required: true, description: 'Подтвержденная сумма' }
        ]
      },
      // 43. Перевод Банк -> Карта
      {
        id: 'bank-to-card',
        method: 'POST',
        path: '/transactions/transfer/bank-to-card/',
        title: 'Перевод Банк (IBAN) → Карта',
        description: 'Списание со счета IBAN пользователя и пополнение баланса карточки.',
        category: 'transfers',
        authorization: TOKEN_AUTH,
        bodyParams: [
          { name: 'from_bank_account_id', type: 'uuid', required: true, description: 'ID банковского счета (отправитель)' },
          { name: 'receiver_card_number', type: 'string', required: true, description: 'Номер карты (получатель)' },
          { name: 'amount', type: 'string', required: true, description: 'Сумма' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${TRANSACTIONS_URL}/transfer/bank-to-card/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "from_bank_account_id": "uuid",
    "receiver_card_number": "4532112233001234",
    "amount": "1000.00"
  }'`,
          json: `{
  "from_bank_account_id": "uuid",
  "receiver_card_number": "4532112233001234",
  "amount": "1000.00"
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "message": "Transfer successful",
  "transaction_id": "uuid",
  "amount": "1000.00",
  "fee": "20.00",
  "total_debit": "1020.00"
}`
        },
        responseParams: [
          { name: 'transaction_id', type: 'uuid', required: true, description: 'ID транзакции' },
          { name: 'amount', type: 'string', required: true, description: 'Сумма перевода' },
          { name: 'fee', type: 'string', required: true, description: 'Комиссия' },
          { name: 'total_debit', type: 'string', required: true, description: 'Итого списано со счета' }
        ]
      },
      // 44. Перевод Карта -> Криптокошелек
      {
        id: 'card-to-crypto',
        method: 'POST',
        path: '/transactions/transfer/card-to-crypto/',
        title: 'Перевод Карта → Криптокошелек',
        description: 'Деньги списываются с баланса AED-карты с конвертацией в крипту.',
        category: 'transfers',
        authorization: TOKEN_AUTH,
        bodyParams: [
          { name: 'from_card_id', type: 'uuid', required: true, description: 'ID карты отправителя' },
          { name: 'to_wallet_id', type: 'uuid', required: true, description: 'ID криптокошелька получателя' },
          { name: 'amount_aed', type: 'string', required: true, description: 'Сумма в AED' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${TRANSACTIONS_URL}/transfer/card-to-crypto/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "from_card_id": "uuid",
    "to_wallet_id": "uuid",
    "amount_aed": "1000.00"
  }'`,
          json: `{
  "from_card_id": "uuid",
  "to_wallet_id": "uuid",
  "amount_aed": "1000.00"
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "message": "Transfer successful",
  "transaction_id": "uuid",
  "deducted_amount": "372.69",
  "fee": "3.69",
  "credited_amount": "100.00"
}`
        },
        responseParams: [
          { name: 'transaction_id', type: 'uuid', required: true, description: 'ID операции' },
          { name: 'deducted_amount', type: 'string', required: true, description: 'Списано AED с карты (сумма + комиссия)' },
          { name: 'fee', type: 'string', required: true, description: 'Сумма комиссии в AED' },
          { name: 'credited_amount', type: 'string', required: true, description: 'Сколько крипты (USDT) получено' }
        ]
      },
      // 45. Перевод Криптокошелек -> Карта
      {
        id: 'crypto-to-card',
        method: 'POST',
        path: '/transactions/transfer/crypto-to-card/',
        title: 'Перевод Криптокошелек → Карта',
        description: 'Списание USDT с кошелька, конвертация в фиат и зачисление AED на карту.',
        category: 'transfers',
        authorization: TOKEN_AUTH,
        bodyParams: [
          { name: 'from_wallet_id', type: 'uuid', required: true, description: 'ID кошелька отправителя' },
          { name: 'to_card_number', type: 'string', required: true, description: 'Номер карты получателя' },
          { name: 'amount_usdt', type: 'string', required: true, description: 'Сумма списания в крипте' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${TRANSACTIONS_URL}/transfer/crypto-to-card/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "from_wallet_id": "uuid",
    "to_card_number": "4532112233123456",
    "amount_usdt": "100.00"
  }'`,
          json: `{
  "from_wallet_id": "uuid",
  "to_card_number": "4532112233123456",
  "amount_usdt": "100.00"
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "message": "Успешно",
  "transaction_id": "uuid",
  "deducted_amount": "100.00",
  "fee": "1.00",
  "credited_amount": "360.00"
}`
        },
        responseParams: [
          { name: 'transaction_id', type: 'uuid', required: true, description: 'ID операции' },
          { name: 'deducted_amount', type: 'string', required: true, description: 'Списано USDT' },
          { name: 'fee', type: 'string', required: true, description: 'Комиссия' },
          { name: 'credited_amount', type: 'string', required: true, description: 'Зачислено AED на карту' }
        ]
      },
      // 46. Перевод Банк -> Криптокошелек
      {
        id: 'bank-to-crypto',
        method: 'POST',
        path: '/transactions/transfer/bank-to-crypto/',
        title: 'Перевод Банк (IBAN) → Криптокошелек',
        description: 'Деньги списываются с банковского IBAN счета и конвертируются в крипту.',
        category: 'transfers',
        authorization: TOKEN_AUTH,
        bodyParams: [
          { name: 'from_bank_account_id', type: 'uuid', required: true, description: 'ID счета отправителя' },
          { name: 'to_crypto_address', type: 'string', required: true, description: 'Адрес получателя' },
          { name: 'amount_aed', type: 'string', required: true, description: 'Сумма к списанию в AED' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${TRANSACTIONS_URL}/transfer/bank-to-crypto/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "from_bank_account_id": "uuid",
    "to_crypto_address": "T...",
    "amount_aed": "369.00"
  }'`,
          json: `{
  "from_bank_account_id": "uuid",
  "to_crypto_address": "T...",
  "amount_aed": "369.00"
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "message": "Transfer successful",
  "transaction_id": "uuid",
  "deducted_amount": "369.00",
  "fee": "5.00",
  "credited_amount": "100.00"
}`
        },
        responseParams: [
          { name: 'transaction_id', type: 'uuid', required: true, description: 'ID транзакции' },
          { name: 'deducted_amount', type: 'string', required: true, description: 'Списано AED' },
          { name: 'fee', type: 'string', required: true, description: 'Комиссия' },
          { name: 'credited_amount', type: 'string', required: true, description: 'Зачислено крипты' }
        ]
      },
      // 47. Перевод Криптокошелек -> Банк (IBAN)
      {
        id: 'crypto-to-bank',
        method: 'POST',
        path: '/transactions/transfer/crypto-to-bank/',
        title: 'Перевод Криптокошелек → Банк (IBAN)',
        description: 'Конвертация крипты в фиат и зачисление на IBAN счет.',
        category: 'transfers',
        authorization: TOKEN_AUTH,
        bodyParams: [
          { name: 'from_wallet_id', type: 'uuid', required: true, description: 'ID кошелька' },
          { name: 'to_iban', type: 'string', required: true, description: 'Номер IBAN получателя' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${TRANSACTIONS_URL}/transfer/crypto-to-bank/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "from_wallet_id": "uuid",
    "to_iban": "AE070331234567890123456"
  }'`,
          json: `{
  "from_wallet_id": "uuid",
  "to_iban": "AE070331234567890123456"
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "message": "Transfer successful",
  "transaction_id": "uuid",
  "deducted_amount": "100.000000",
  "fee": "2.000000",
  "credited_amount": "360.000000"
}`
        },
        responseParams: [
          { name: 'transaction_id', type: 'uuid', required: true, description: 'ID транзакции' },
          { name: 'deducted_amount', type: 'string', required: true, description: 'Списано USDT' },
          { name: 'fee', type: 'string', required: true, description: 'Комиссия' },
          { name: 'credited_amount', type: 'string', required: true, description: 'Зачислено AED' }
        ]
      },
      // 48. Перевод Карта -> Банк (IBAN)
      {
        id: 'card-to-bank',
        method: 'POST',
        path: '/transactions/transfer/card-to-bank/',
        title: 'Перевод Карта → Банк (IBAN)',
        description: 'Внутренний фиатный перевод с карточки на банковский счет по IBAN.',
        category: 'transfers',
        authorization: TOKEN_AUTH,
        bodyParams: [
          { name: 'from_card_id', type: 'uuid', required: true, description: 'ID карты' },
          { name: 'to_iban', type: 'string', required: true, description: 'Номер IBAN' },
          { name: 'amount_aed', type: 'string', required: true, description: 'Сумма в AED' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${TRANSACTIONS_URL}/transfer/card-to-bank/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "from_card_id": "uuid",
    "to_iban": "AE070331234567890123456",
    "amount_aed": "100.00"
  }'`,
          json: `{
  "from_card_id": "uuid",
  "to_iban": "AE070331234567890123456",
  "amount_aed": "100.00"
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "message": "Transfer successful",
  "transaction_id": "uuid",
  "deducted_amount": "100.00",
  "fee": "2.00",
  "credited_amount": "98.00"
}`
        },
        responseParams: [
          { name: 'transaction_id', type: 'uuid', required: true, description: 'ID транзакции' },
          { name: 'deducted_amount', type: 'string', required: true, description: 'Списано с карты' },
          { name: 'fee', type: 'string', required: true, description: 'Комиссия' },
          { name: 'credited_amount', type: 'string', required: true, description: 'Зачислено на IBAN' }
        ]
      },
      // 49. Вывод с криптокошелька (на прямую)
      {
        id: 'crypto-wallet-withdrawal',
        method: 'POST',
        path: '/transactions/withdrawal/crypto-wallet/',
        title: 'Вывод с криптокошелька (прямой)',
        description: 'Прямая отправка USDT на любой крипто-адрес. Если адрес найден в базе — мгновенный перевод, если внешний — в статус Pending.',
        category: 'transfers',
        authorization: TOKEN_AUTH,
        bodyParams: [
          { name: 'from_wallet_id', type: 'uuid', required: true, description: 'ID кошелька отправителя' },
          { name: 'to_address', type: 'string', required: true, description: 'Адрес получателя' },
          { name: 'amount_usdt', type: 'string', required: true, description: 'Сумма USDT' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${TRANSACTIONS_URL}/withdrawal/crypto-wallet/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "from_wallet_id": "uuid",
    "to_address": "T...",
    "amount_usdt": "50.00"
  }'`,
          json: `{
  "from_wallet_id": "uuid",
  "to_address": "T...",
  "amount_usdt": "50.00"
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "message": "Перевод выполнен",
  "transaction_id": "uuid",
  "status": "completed",
  "is_internal": true,
  "recipient_name": "Иван",
  "avatar_url": "https://...",
  "deducted_amount": "51.00",
  "fee": "1.00",
  "credited_amount": "50.00"
}`
        },
        responseParams: [
          { name: 'transaction_id', type: 'uuid', required: true, description: 'ID транзакции' },
          { name: 'status', type: 'string', required: true, description: '"completed" (внутренний) или "pending" (внешний)' },
          { name: 'is_internal', type: 'boolean', required: true, description: 'true если получатель в системе' },
          { name: 'recipient_name', type: 'string', required: false, description: 'ФИО получателя (null если внешний)' },
          { name: 'avatar_url', type: 'string', required: false, description: 'Аватар получателя' },
          { name: 'deducted_amount', type: 'string', required: true, description: 'Списано (сумма + комиссия)' },
          { name: 'fee', type: 'string', required: true, description: 'Сетевая комиссия' },
          { name: 'credited_amount', type: 'string', required: true, description: 'Зачислено получателю' }
        ]
      },
      // 50. Вывод крипты с карты в сеть
      {
        id: 'crypto-withdrawal',
        method: 'POST',
        path: '/transactions/withdrawal/crypto/',
        title: 'Вывод крипты с карты в сеть',
        description: 'Вывод на внешний крипто-адрес. Списываются AED с карты.',
        category: 'transfers',
        authorization: TOKEN_AUTH,
        bodyParams: [
          { name: 'from_card_id', type: 'uuid', required: true, description: 'ID карты списания' },
          { name: 'token', type: 'enum', required: true, description: 'Токен', enum: ['USDT', 'USDC'] },
          { name: 'network', type: 'enum', required: true, description: 'Сеть', enum: ['TRC20', 'ERC20', 'BEP20', 'SOL'] },
          { name: 'to_address', type: 'string', required: true, description: 'Внешний адрес' },
          { name: 'amount_crypto', type: 'string', required: true, description: 'Желаемая сумма к получению в крипте' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${TRANSACTIONS_URL}/withdrawal/crypto/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "from_card_id": "uuid",
    "token": "USDT",
    "network": "TRC20",
    "to_address": "T...",
    "amount_crypto": "50.00"
  }'`,
          json: `{
  "from_card_id": "uuid",
  "token": "USDT",
  "network": "TRC20",
  "to_address": "T...",
  "amount_crypto": "50.00"
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "message": "Withdrawal processing",
  "transaction_id": "uuid",
  "total_debit_crypto": "51.00"
}`
        },
        responseParams: [
          { name: 'message', type: 'string', required: true, description: 'Статус' },
          { name: 'transaction_id', type: 'uuid', required: true, description: 'ID транзакции' },
          { name: 'total_debit_crypto', type: 'string', required: true, description: 'Итого в крипте с учетом сетевой комиссии' }
        ]
      },
      // 51. Банковский вывод (Wire)
      {
        id: 'bank-withdrawal',
        method: 'POST',
        path: '/transactions/withdrawal/bank/',
        title: 'Банковский вывод (Wire)',
        description: 'Отправка денег (AED) в сторонний внешний банк (не внутри EasyCard).',
        category: 'transfers',
        authorization: TOKEN_AUTH,
        bodyParams: [
          { name: 'from_card_id', type: 'uuid', required: true, description: 'ID карты (или from_bank_account_id)' },
          { name: 'iban', type: 'string', required: true, description: 'Внешний IBAN в ОАЭ' },
          { name: 'beneficiary_name', type: 'string', required: true, description: 'Имя получателя во внешнем банке' },
          { name: 'bank_name', type: 'string', required: true, description: 'Название внешнего банка' },
          { name: 'amount_aed', type: 'string', required: true, description: 'Сумма перевода' }
        ],
        requestExample: {
          curl: `curl --request POST \\
  --url ${TRANSACTIONS_URL}/withdrawal/bank/ \\
  --header 'Authorization: Token abc123xyz789token' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "from_card_id": "uuid",
    "iban": "AE999123456",
    "beneficiary_name": "John Doe",
    "bank_name": "Emirates NBD",
    "amount_aed": "1000.00"
  }'`,
          json: `{
  "from_card_id": "uuid",
  "iban": "AE999123456",
  "beneficiary_name": "John Doe",
  "bank_name": "Emirates NBD",
  "amount_aed": "1000.00"
}`
        },
        responseExample: {
          status: 200,
          json: `{
  "message": "Bank wire processing",
  "transaction_id": "uuid",
  "fee_amount": "20.00"
}`
        },
        responseParams: [
          { name: 'message', type: 'string', required: true, description: 'Статус обработки' },
          { name: 'transaction_id', type: 'uuid', required: true, description: 'ID транзакции' },
          { name: 'fee_amount', type: 'string', required: true, description: 'Комиссия за межбанк' }
        ]
      }
    ]
  },
  // ============ ВНУТРЕННИЕ СПРАВОЧНИКИ ============
  {
    id: 'accounts-info',
    title: 'Внутренние справочники',
    titleKey: 'api.categories.accountsInfo',
    icon: '🏦',
    endpoints: [
      // 52. Мои банковские счета
      {
        id: 'bank-accounts',
        method: 'GET',
        path: '/transactions/bank-accounts/',
        title: 'Мои банковские счета (IBAN)',
        description: 'Список IBAN счетов текущего пользователя (для выпадающих списков).',
        category: 'accounts-info',
        authorization: TOKEN_AUTH,
        requestExample: {
          curl: `curl --request GET \\
  --url ${TRANSACTIONS_URL}/bank-accounts/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `[
  {
    "id": "uuid",
    "iban": "AE...",
    "bank_name": "EasyCard Default Bank",
    "beneficiary": "Имя Фамилия",
    "balance": "2000.00",
    "is_active": true
  }
]`
        },
        responseParams: [
          { name: 'id', type: 'uuid', required: true, description: 'ID счета' },
          { name: 'iban', type: 'string', required: true, description: 'Номер IBAN' },
          { name: 'bank_name', type: 'string', required: true, description: 'Название банка' },
          { name: 'beneficiary', type: 'string', required: true, description: 'Владелец' },
          { name: 'balance', type: 'string', required: true, description: 'Баланс' },
          { name: 'is_active', type: 'boolean', required: true, description: 'Активен ли' }
        ]
      },
      // 53. Мои криптокошельки
      {
        id: 'crypto-wallets',
        method: 'GET',
        path: '/transactions/crypto-wallets/',
        title: 'Мои криптокошельки',
        description: 'Список криптоадресов текущего пользователя.',
        category: 'accounts-info',
        authorization: TOKEN_AUTH,
        requestExample: {
          curl: `curl --request GET \\
  --url ${TRANSACTIONS_URL}/crypto-wallets/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `[
  {
    "id": "uuid",
    "network": "TRC20",
    "token": "USDT",
    "address": "Txxxxxx...",
    "balance": "5000.000000",
    "is_active": true
  }
]`
        },
        responseParams: [
          { name: 'id', type: 'uuid', required: true, description: 'ID кошелька' },
          { name: 'network', type: 'string', required: true, description: 'Сеть блокчейна' },
          { name: 'token', type: 'string', required: true, description: 'Тип токена' },
          { name: 'address', type: 'string', required: true, description: 'Адрес кошелька' },
          { name: 'balance', type: 'string', required: true, description: 'Баланс' },
          { name: 'is_active', type: 'boolean', required: true, description: 'Активен ли' }
        ]
      }
    ]
  },
  // ============ ИСТОРИЯ И КВИТАНЦИИ ============
  {
    id: 'transaction-history',
    title: 'История и Квитанции',
    titleKey: 'api.categories.transactionHistory',
    icon: '📊',
    endpoints: [
      // 54. Все транзакции
      {
        id: 'transactions-all',
        method: 'GET',
        path: '/transactions/all/',
        title: 'Все транзакции',
        description: 'Единая общая история всех операций пользователя.',
        category: 'transaction-history',
        authorization: TOKEN_AUTH,
        requestExample: {
          curl: `curl --request GET \\
  --url ${TRANSACTIONS_URL}/all/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `[
  {
    "id": "uuid",
    "type": "card_transfer",
    "direction": "outbound",
    "status": "completed",
    "amount": "100.00",
    "currency": "AED",
    "fee": "1.00",
    "exchange_rate": null,
    "original_amount": null,
    "original_currency": null,
    "receiver_name": "Анна Петрова",
    "created_at": "2026-02-24T12:00:00Z"
  }
]`
        },
        responseParams: [
          { name: 'id', type: 'uuid', required: true, description: 'ID транзакции' },
          { name: 'type', type: 'string', required: true, description: 'Технический тип (card_transfer, bank_withdrawal и т.д.)' },
          { name: 'direction', type: 'enum', required: true, description: 'Направление', enum: ['inbound', 'outbound', 'internal'] },
          { name: 'status', type: 'string', required: true, description: 'Статус: completed, pending, processing, failed' },
          { name: 'amount', type: 'string', required: true, description: 'Сумма' },
          { name: 'currency', type: 'string', required: true, description: 'Валюта' },
          { name: 'fee', type: 'string', required: false, description: 'Комиссия' },
          { name: 'exchange_rate', type: 'string', required: false, description: 'Курс обмена (если была конвертация)' },
          { name: 'original_amount', type: 'string', required: false, description: 'Оригинальная сумма (при конвертации)' },
          { name: 'original_currency', type: 'string', required: false, description: 'Оригинальная валюта' },
          { name: 'receiver_name', type: 'string', required: false, description: 'Имя получателя (НОВОЕ ПОЛЕ)' },
          { name: 'created_at', type: 'string', required: true, description: 'Дата и время' }
        ],
        notes: ['Во всех списках транзакций добавлено новое поле receiver_name']
      },
      // 55. Только банковские (IBAN)
      {
        id: 'transactions-iban',
        method: 'GET',
        path: '/transactions/iban/',
        title: 'Только банковские (IBAN)',
        description: 'Фильтрованный список транзакций, затронувших только банковский счет (IBAN).',
        category: 'transaction-history',
        authorization: TOKEN_AUTH,
        requestExample: {
          curl: `curl --request GET \\
  --url ${TRANSACTIONS_URL}/iban/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `[
  {
    "id": "uuid",
    "type": "bank_topup",
    "direction": "inbound",
    "status": "completed",
    "amount": "5000.00",
    "currency": "AED",
    "receiver_name": null,
    "created_at": "2026-02-24T12:00:00Z"
  }
]`
        },
        responseParams: [
          { name: '[]', type: 'array', required: true, description: 'Массив банковских транзакций (формат идентичен п.54, включая receiver_name)' }
        ]
      },
      // 56. Только карты
      {
        id: 'transactions-card',
        method: 'GET',
        path: '/transactions/card-transactions/',
        title: 'Только карты',
        description: 'Транзакции с пластиковыми и виртуальными картами.',
        category: 'transaction-history',
        authorization: TOKEN_AUTH,
        requestExample: {
          curl: `curl --request GET \\
  --url ${TRANSACTIONS_URL}/card-transactions/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `[
  {
    "id": "uuid",
    "type": "card_payment",
    "direction": "outbound",
    "status": "completed",
    "amount": "250.00",
    "currency": "AED",
    "merchant_name": "Amazon",
    "receiver_name": null,
    "created_at": "2026-02-24T12:00:00Z"
  }
]`
        },
        responseParams: [
          { name: '[]', type: 'array', required: true, description: 'Массив карточных транзакций (формат идентичен п.54)' }
        ]
      },
      // 57. Только крипта
      {
        id: 'transactions-crypto',
        method: 'GET',
        path: '/transactions/crypto/',
        title: 'Только крипта',
        description: 'Крипто-транзакции пользователя.',
        category: 'transaction-history',
        authorization: TOKEN_AUTH,
        requestExample: {
          curl: `curl --request GET \\
  --url ${TRANSACTIONS_URL}/crypto/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `[
  {
    "id": "uuid",
    "type": "crypto_topup",
    "direction": "inbound",
    "status": "completed",
    "amount": "1000.000000",
    "currency": "USDT",
    "receiver_name": null,
    "created_at": "2026-02-24T12:00:00Z"
  }
]`
        },
        responseParams: [
          { name: '[]', type: 'array', required: true, description: 'Массив крипто-транзакций (формат идентичен п.54)' }
        ]
      },
      // 58. Детальная квитанция (чек)
      {
        id: 'transaction-receipt',
        method: 'GET',
        path: '/transactions/{transaction_id}/receipt/',
        title: 'Детальная квитанция (чек)',
        description: 'Генерирует полную квитанцию по конкретной транзакции для экрана "Детали платежа".',
        category: 'transaction-history',
        authorization: TOKEN_AUTH,
        pathParams: [
          { name: 'transaction_id', type: 'uuid', required: true, description: 'UUID транзакции' }
        ],
        requestExample: {
          curl: `curl --request GET \\
  --url ${TRANSACTIONS_URL}/550e8400-e29b-41d4-a716-446655440000/receipt/ \\
  --header 'Authorization: Token abc123xyz789token'`
        },
        responseExample: {
          status: 200,
          json: `{
  "transaction_id": "uuid",
  "type": "card_transfer",
  "operation": "Card Transfer",
  "status": "completed",
  "date_time": "2026-02-24T12:00:00Z",
  "amount": 100.0,
  "currency": "AED",
  "fee": 1.0,
  "exchange_rate": null,
  "original_amount": null,
  "original_currency": null,
  "description": "Описание платежа",
  "merchant_name": null,
  "merchant_category": null,
  "reference_id": null,
  "card_id": null
}`
        },
        responseParams: [
          { name: 'transaction_id', type: 'uuid', required: true, description: 'ID транзакции' },
          { name: 'type', type: 'string', required: true, description: 'Технический тип' },
          { name: 'operation', type: 'string', required: true, description: 'Удобочитаемое название операции' },
          { name: 'status', type: 'string', required: true, description: 'Статус: completed, pending, failed, cancelled' },
          { name: 'date_time', type: 'string', required: true, description: 'Дата и время (ISO 8601)' },
          { name: 'amount', type: 'number', required: true, description: 'Чистая сумма' },
          { name: 'currency', type: 'string', required: true, description: 'Валюта' },
          { name: 'fee', type: 'number', required: false, description: 'Сумма комиссии' },
          { name: 'exchange_rate', type: 'number', required: false, description: 'Курс обмена' },
          { name: 'original_amount', type: 'number', required: false, description: 'Исходная сумма (при конвертации)' },
          { name: 'original_currency', type: 'string', required: false, description: 'Исходная валюта' },
          { name: 'description', type: 'string', required: false, description: 'Описание' },
          { name: 'merchant_name', type: 'string', required: false, description: 'Название продавца' },
          { name: 'merchant_category', type: 'string', required: false, description: 'Категория' },
          { name: 'reference_id', type: 'string', required: false, description: 'Банковский референс' },
          { name: 'card_id', type: 'string', required: false, description: 'ID карты (если есть)' }
        ],
        notes: [
          'Формат ответа адаптируется к типу транзакции',
          'Карточные переводы включают маски карт отправителя/получателя',
          'Крипто-транзакции включают token, network, address',
          'Банковские переводы включают IBAN и реквизиты банка'
        ]
      }
    ]
  },
  // ============ АДМИН-ПАНЕЛЬ (ДОХОДЫ) ============
  {
    id: 'admin-revenue',
    title: 'Админ: Доходы',
    titleKey: 'api.categories.adminRevenue',
    icon: '💵',
    endpoints: [
      // 59. Сводка по комиссиям (админ)
      {
        id: 'admin-revenue-summary',
        method: 'GET',
        path: '/transactions/admin/revenue/summary/',
        title: 'Сводка по заработанным комиссиям',
        description: 'Показывает общую прибыль приложения с удержанных комиссий. Поддерживает start_date и end_date.',
        category: 'admin-revenue',
        authorization: { type: 'Token', description: 'Authorization: Token <токен_админа>' },
        queryParams: [
          { name: 'start_date', type: 'string', required: false, description: 'Начало периода (YYYY-MM-DD)' },
          { name: 'end_date', type: 'string', required: false, description: 'Конец периода (YYYY-MM-DD)' }
        ],
        requestExample: {
          curl: `curl --request GET \\
  --url '${TRANSACTIONS_URL}/admin/revenue/summary/?start_date=2026-01-01' \\
  --header 'Authorization: Token admin_token_here'`
        },
        responseExample: {
          status: 200,
          json: `{
  "total_revenue": "5000.00",
  "by_type": {
    "card_transfer": {
      "count": 100,
      "total_fees": "1000.00"
    },
    "bank_withdrawal": {
      "count": 50,
      "total_fees": "2000.00"
    }
  }
}`
        },
        responseParams: [
          { name: 'total_revenue', type: 'string', required: true, description: 'Суммарная чистая прибыль' },
          { name: 'by_type', type: 'object', required: true, description: 'Прибыль по типам операций' }
        ]
      },
      // 60. Реестр доходов и комиссий
      {
        id: 'admin-revenue-transactions',
        method: 'GET',
        path: '/transactions/admin/revenue/transactions/',
        title: 'Реестр доходов и комиссий',
        description: 'Постраничный детальный список каждой комиссии, списанной у пользователя.',
        category: 'admin-revenue',
        authorization: { type: 'Token', description: 'Authorization: Token <токен_админа>' },
        queryParams: [
          { name: 'limit', type: 'number', required: false, description: 'Количество записей (по умолчанию 50)' },
          { name: 'offset', type: 'number', required: false, description: 'Смещение (по умолчанию 0)' }
        ],
        requestExample: {
          curl: `curl --request GET \\
  --url '${TRANSACTIONS_URL}/admin/revenue/transactions/?limit=50&offset=0' \\
  --header 'Authorization: Token admin_token_here'`
        },
        responseExample: {
          status: 200,
          json: `{
  "count": 500,
  "results": [
    {
      "id": "uuid",
      "transaction_id": "uuid",
      "user_id": "123",
      "fee_type": "card_transfer",
      "fee_amount": "1.00",
      "fee_currency": "AED",
      "base_amount": "100.00",
      "created_at": "2026-02-24T12:00:00Z"
    }
  ]
}`
        },
        responseParams: [
          { name: 'count', type: 'number', required: true, description: 'Общее количество записей' },
          { name: 'results', type: 'array', required: true, description: 'Массив записей о доходах' },
          { name: 'results[].id', type: 'uuid', required: true, description: 'ID записи о доходе' },
          { name: 'results[].transaction_id', type: 'uuid', required: true, description: 'К какой транзакции относится' },
          { name: 'results[].user_id', type: 'string', required: true, description: 'С кого списали' },
          { name: 'results[].fee_type', type: 'string', required: true, description: 'Тип услуги' },
          { name: 'results[].fee_amount', type: 'string', required: true, description: 'Сколько списали (прибыль)' },
          { name: 'results[].fee_currency', type: 'string', required: true, description: 'Валюта' },
          { name: 'results[].base_amount', type: 'string', required: true, description: 'Базовая сумма перевода' },
          { name: 'results[].created_at', type: 'string', required: true, description: 'Время списания' }
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

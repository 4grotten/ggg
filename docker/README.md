# Easy Card Database - Docker Deployment

Полный Docker Compose стек с **Nginx + SSL (Let's Encrypt)** для развертывания базы данных Easy Card на DigitalOcean Droplet.

## 🗂 Структура

```
docker/
├── docker-compose.yml          # Основной compose файл
├── .env.example               # Пример переменных окружения
├── README.md                  # Эта документация
├── nginx/                     # Nginx конфигурация
│   ├── nginx.conf            # Главный конфиг Nginx
│   └── conf.d/
│       ├── default.conf      # HTTP → HTTPS редирект
│       └── easycard.conf.template  # Шаблон HTTPS конфига
├── certbot/                   # Let's Encrypt сертификаты (auto-generated)
│   ├── conf/                 # Сертификаты
│   └── www/                  # ACME challenge
├── scripts/
│   └── init-ssl.sh           # Скрипт инициализации SSL
└── init/                      # SQL миграции
    ├── 01_extensions.sql     # Расширения и ENUM типы
    ├── 02_tables.sql         # Таблицы базы данных
    ├── 03_functions.sql      # Функции и триггеры
    ├── 04_seed_data.sql      # Начальные данные
    └── 05_rls_policies.sql   # RLS политики
```

## 🔒 SSL & Security Features

- **Nginx** reverse proxy с HTTPS
- **Let's Encrypt** автоматические сертификаты
- **Автопродление** каждые 12 часов
- **HTTP/2** поддержка
- **HSTS** headers
- **Rate limiting** (10 req/s общий, 30 req/s API)
- PostgreSQL и Redis доступны только через localhost

## 📊 Схема базы данных

### Таблицы

| Таблица | Описание |
|---------|----------|
| `profiles` | Профили пользователей |
| `user_roles` | RBAC роли (admin, moderator, user) |
| `cards` | Виртуальные и металлические карты |
| `transactions` | Все финансовые операции |
| `admin_settings` | Курсы, комиссии, лимиты |
| `admin_action_history` | Аудит действий администраторов |

### Типы транзакций

- `top_up` - Пополнение
- `withdrawal` - Вывод
- `transfer_in` / `transfer_out` - Переводы
- `card_payment` - Оплата картой
- `refund` / `fee` / `cashback` - Возвраты/комиссии
- `card_activation` - Активация карты

### Курсы и комиссии (по умолчанию)

| Параметр | Значение |
|----------|----------|
| USDT → AED | 3.65 / 3.69 |
| Card-to-Card | 1% |
| Bank Transfer | 2% |
| Crypto Top-up | 5.90 USDT |

| Операция | Комиссия |
|----------|----------|
| Крипто пополнение | 5.90 USDT (flat) |
| Банковское пополнение | 1.5% |
| Card-to-Card | 1% |
| Банковский перевод | 2% |
| Конвертация валюты | 1.5% |
| Виртуальная карта | 183 AED/год |
| Металлическая карта | 183 AED/год |

## 🚀 Быстрый старт

### 1. Подготовка сервера (DigitalOcean Droplet)

```bash
# Подключитесь к серверу
ssh root@your_droplet_ip

# Установите Docker
curl -fsSL https://get.docker.com | sh

# Установите Docker Compose
apt install docker-compose-plugin -y

# Откройте порты
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP (для ACME challenge)
ufw allow 443/tcp  # HTTPS
ufw enable
```

### 2. Загрузка файлов

```bash
# Создайте директорию
mkdir -p /opt/easycard
cd /opt/easycard

# Скопируйте файлы
scp -r docker/* root@your_droplet_ip:/opt/easycard/
```

### 3. Настройка переменных

```bash
# Создайте .env файл
cp .env.example .env

# Отредактируйте домен и пароли!
nano .env
```

### 4. Получение SSL сертификата

```bash
# Сделайте скрипт исполняемым
chmod +x scripts/init-ssl.sh

# Запустите с вашим доменом
./scripts/init-ssl.sh your-domain.com admin@your-domain.com
```

**Важно:** Перед запуском убедитесь, что:
- DNS A-запись указывает на IP вашего сервера
- Порты 80 и 443 открыты

### 5. Запуск всех сервисов

```bash
# Запуск в фоне
docker compose up -d

# Проверка статуса
docker compose ps

# Просмотр логов
docker compose logs -f
```

## 🌐 Доступ к сервисам

После успешного деплоя:

| Сервис | URL |
|--------|-----|
| Admin Dashboard | `https://your-domain.com/` |
| pgAdmin | `https://your-domain.com/pgadmin/` |
| Redis Commander | `https://your-domain.com/redis/` |

**PostgreSQL и Redis** доступны только через localhost (127.0.0.1) для безопасности.

## 🔒 Безопасность

### Рекомендации

1. ✅ **HTTPS** включен по умолчанию с Let's Encrypt
2. ✅ **Rate limiting** защита от DDoS
3. ✅ **HSTS** headers включены
4. ✅ **PostgreSQL/Redis** только localhost
5. 🔄 **Измените все пароли** в `.env` перед продакшеном
6. 🔄 **Настройте бэкапы** (см. ниже)

## 📦 Бэкап и восстановление

### Создание бэкапа

```bash
docker exec easycard_db pg_dump -U easycard easycard > backup_$(date +%Y%m%d).sql
```

### Восстановление

```bash
docker exec -i easycard_db psql -U easycard easycard < backup_20240101.sql
```

### Автоматические бэкапы (cron)

```bash
# Добавьте в crontab
0 2 * * * docker exec easycard_db pg_dump -U easycard easycard | gzip > /backups/easycard_$(date +\%Y\%m\%d).sql.gz
```

## 🔧 Полезные команды

```bash
# Подключение к PostgreSQL
docker exec -it easycard_db psql -U easycard

# Просмотр таблиц
\dt

# Просмотр данных
SELECT * FROM admin_settings;

# Остановка
docker compose down

# Полная очистка (УДАЛИТ ДАННЫЕ!)
docker compose down -v
```

## 🌐 Подключение из приложения

```javascript
// Строка подключения
const connectionString = 'postgresql://easycard:your_password@your_droplet_ip:5432/easycard';

// С Prisma
DATABASE_URL="postgresql://easycard:your_password@your_droplet_ip:5432/easycard?schema=public"
```

## 📈 Мониторинг

### pgAdmin (включен в compose)

- URL: `http://your_droplet_ip:5050`
- Email: значение из `PGADMIN_EMAIL`
- Password: значение из `PGADMIN_PASSWORD`

### Добавление сервера в pgAdmin

1. Откройте pgAdmin
2. Right click → Register → Server
3. Name: `EasyCard DB`
4. Connection:
   - Host: `postgres` (имя контейнера)
   - Port: `5432`
   - Username: `easycard`
   - Password: ваш пароль

## 🆘 Troubleshooting

### База не запускается

```bash
# Проверьте логи
docker compose logs postgres

# Проверьте права на volume
ls -la /var/lib/docker/volumes/
```

### Ошибки миграций

```bash
# Пересоздать базу (УДАЛИТ ДАННЫЕ!)
docker compose down -v
docker compose up -d
```

### Нет доступа снаружи

```bash
# Проверьте файрвол
ufw status

# Проверьте binding в docker-compose.yml
# ports: "0.0.0.0:5432:5432"
```

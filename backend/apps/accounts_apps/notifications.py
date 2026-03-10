import threading
import requests
import logging
import ast
import re
from datetime import timedelta, timezone
from decimal import Decimal
from django.conf import settings
from django.core.mail import send_mail, get_connection, EmailMessage
from .models import AdminNotificationSettings, UserRoles, WahaSession, UserNotificationSettings, Profiles
from django.apps import apps

logger = logging.getLogger(__name__)

# --- MULTILANGUAGE DICTIONARY ---
TRANSLATIONS = {
    'en': {
        'debit_title': '💸 <b>Successful Debit</b>',
        'credit_title': '📥 <b>Funds Received</b>',
        'op_type': 'Operation Type:',
        'amount': 'Amount:',
        'fee': 'Fee:',
        'from': 'From:',
        'from_card': 'From Card:',
        'from_iban': 'From Account (IBAN):',
        'from_crypto': 'From Crypto Wallet:',
        'to': 'To:',
        'to_card': 'To Card:',
        'to_iban': 'To Account (IBAN):',
        'to_crypto': 'To Crypto Wallet:',
        'status': 'Status:',
        'tx_id': 'Transaction ID:',
        'time': 'Time:',
        'desc': 'Description:',
        'ext_sender': 'External Sender',
        'ext_account': 'External Account',
        'ops': {
            'card_transfer': 'Card Transfer', 'internal_transfer': 'Internal Transfer',
            'top_up': 'Account Top Up', 'bank_topup': 'Bank Transfer Top Up',
            'crypto_deposit': 'Crypto Deposit', 'crypto_withdrawal': 'Crypto Withdrawal',
            'bank_withdrawal': 'Bank Withdrawal', 'card_to_crypto': 'Card to Crypto',
            'crypto_to_card': 'Crypto to Card', 'bank_to_crypto': 'Bank to Crypto',
            'crypto_to_iban': 'Crypto to Bank Account', 'iban_to_card': 'Bank Account to Card',
            'crypto_to_crypto': 'Crypto Transfer'
        }
    },
    'ru': {
        'debit_title': '💸 <b>Успешное списание</b>',
        'credit_title': '📥 <b>Поступление средств</b>',
        'op_type': 'Тип операции:',
        'amount': 'Сумма:',
        'fee': 'Комиссия:',
        'from': 'Отправитель:',
        'from_card': 'С карты:',
        'from_iban': 'Со счета (IBAN):',
        'from_crypto': 'С криптокошелька:',
        'to': 'Получатель:',
        'to_card': 'На карту:',
        'to_iban': 'На счет (IBAN):',
        'to_crypto': 'На криптокошелек:',
        'status': 'Статус:',
        'tx_id': 'ID Транзакции:',
        'time': 'Время:',
        'desc': 'Описание:',
        'ext_sender': 'Внешний отправитель',
        'ext_account': 'Внешний счет',
        'ops': {
            'card_transfer': 'Перевод на карту', 'internal_transfer': 'Внутренний перевод',
            'top_up': 'Пополнение счета', 'bank_topup': 'Пополнение банк. переводом',
            'crypto_deposit': 'Пополнение криптовалютой', 'crypto_withdrawal': 'Вывод в криптовалюте',
            'bank_withdrawal': 'Вывод на банк. счет', 'card_to_crypto': 'Перевод с карты в крипто',
            'crypto_to_card': 'Перевод из крипто на карту', 'bank_to_crypto': 'Перевод со счета в крипто',
            'crypto_to_iban': 'Перевод из крипто на счет', 'iban_to_card': 'Перевод со счета на карту',
            'crypto_to_crypto': 'Перевод криптовалюты'
        }
    },
    'de': {
        'debit_title': '💸 <b>Erfolgreiche Abbuchung</b>',
        'credit_title': '📥 <b>Geldeingang</b>',
        'op_type': 'Vorgangsart:',
        'amount': 'Betrag:',
        'fee': 'Gebühr:',
        'from': 'Von:',
        'from_card': 'Von Karte:',
        'from_iban': 'Von Konto (IBAN):',
        'from_crypto': 'Von Krypto-Wallet:',
        'to': 'An:',
        'to_card': 'Auf Karte:',
        'to_iban': 'Auf Konto (IBAN):',
        'to_crypto': 'Auf Krypto-Wallet:',
        'status': 'Status:',
        'tx_id': 'Transaktions-ID:',
        'time': 'Zeit:',
        'desc': 'Beschreibung:',
        'ext_sender': 'Externer Absender',
        'ext_account': 'Externes Konto',
        'ops': {
            'card_transfer': 'Kartenüberweisung', 'internal_transfer': 'Interne Überweisung',
            'top_up': 'Kontoaufladung', 'bank_topup': 'Banküberweisung Aufladung',
            'crypto_deposit': 'Krypto-Einzahlung', 'crypto_withdrawal': 'Krypto-Auszahlung',
            'bank_withdrawal': 'Bankauszahlung', 'card_to_crypto': 'Karte zu Krypto',
            'crypto_to_card': 'Krypto zu Karte', 'bank_to_crypto': 'Bank zu Krypto',
            'crypto_to_iban': 'Krypto zu Bankkonto', 'iban_to_card': 'Bankkonto zu Karte',
            'crypto_to_crypto': 'Krypto-Transfer'
        }
    },
    'tr': {
        'debit_title': '💸 <b>Başarılı Çekim</b>',
        'credit_title': '📥 <b>Para Geldi</b>',
        'op_type': 'İşlem Tipi:',
        'amount': 'Tutar:',
        'fee': 'Ücret:',
        'from': 'Gönderen:',
        'from_card': 'Karttan:',
        'from_iban': 'Hesaptan (IBAN):',
        'from_crypto': 'Kripto Cüzdandan:',
        'to': 'Alıcı:',
        'to_card': 'Karta:',
        'to_iban': 'Hesaba (IBAN):',
        'to_crypto': 'Kripto Cüzdana:',
        'status': 'Durum:',
        'tx_id': 'İşlem ID:',
        'time': 'Zaman:',
        'desc': 'Açıklama:',
        'ext_sender': 'Dış Gönderici',
        'ext_account': 'Dış Hesap',
        'ops': {
            'card_transfer': 'Kart Transferi', 'internal_transfer': 'İç Transfer',
            'top_up': 'Hesaba Para Yükleme', 'bank_topup': 'Banka Transferi ile Yükleme',
            'crypto_deposit': 'Kripto Para Yatırma', 'crypto_withdrawal': 'Kripto Para Çekme',
            'bank_withdrawal': 'Banka Çekimi', 'card_to_crypto': 'Karttan Kriptoya',
            'crypto_to_card': 'Kriptodan Karta', 'bank_to_crypto': 'Bankadan Kriptoya',
            'crypto_to_iban': 'Kriptodan Banka Hesabına', 'iban_to_card': 'Banka Hesabından Karta',
            'crypto_to_crypto': 'Kripto Transferi'
        }
    },
    'zh': {
        'debit_title': '💸 <b>成功扣款</b>',
        'credit_title': '📥 <b>资金已收到</b>',
        'op_type': '操作类型:',
        'amount': '金额:',
        'fee': '手续费:',
        'from': '来自:',
        'from_card': '来自卡:',
        'from_iban': '来自账户 (IBAN):',
        'from_crypto': '来自加密钱包:',
        'to': '到:',
        'to_card': '到卡:',
        'to_iban': '到账户 (IBAN):',
        'to_crypto': '到加密钱包:',
        'status': '状态:',
        'tx_id': '交易ID:',
        'time': '时间:',
        'desc': '描述:',
        'ext_sender': '外部发送者',
        'ext_account': '外部账户',
        'ops': {
            'card_transfer': '卡转账', 'internal_transfer': '内部转账',
            'top_up': '账户充值', 'bank_topup': '银行转账充值',
            'crypto_deposit': '加密货币存款', 'crypto_withdrawal': '加密货币提现',
            'bank_withdrawal': '银行提现', 'card_to_crypto': '卡到加密货币',
            'crypto_to_card': '加密货币到卡', 'bank_to_crypto': '银行到加密货币',
            'crypto_to_iban': '加密货币到银行账户', 'iban_to_card': '银行账户到卡',
            'crypto_to_crypto': '加密货币转账'
        }
    },
    'ar': {
        'debit_title': '💸 <b>خصم ناجح</b>',
        'credit_title': '📥 <b>استلام الأموال</b>',
        'op_type': 'نوع العملية:',
        'amount': 'المبلغ:',
        'fee': 'الرسوم:',
        'from': 'من:',
        'from_card': 'من بطاقة:',
        'from_iban': 'من حساب (IBAN):',
        'from_crypto': 'من محفظة رقمية:',
        'to': 'إلى:',
        'to_card': 'إلى بطاقة:',
        'to_iban': 'إلى حساب (IBAN):',
        'to_crypto': 'إلى محفظة رقمية:',
        'status': 'الحالة:',
        'tx_id': 'رقم المعاملة:',
        'time': 'الوقت:',
        'desc': 'الوصف:',
        'ext_sender': 'مرسل خارجي',
        'ext_account': 'حساب خارجي',
        'ops': {
            'card_transfer': 'تحويل بطاقة', 'internal_transfer': 'تحويل داخلي',
            'top_up': 'تعبئة الرصيد', 'bank_topup': 'تعبئة تحويل بنكي',
            'crypto_deposit': 'إيداع عملة رقمية', 'crypto_withdrawal': 'سحب عملة رقمية',
            'bank_withdrawal': 'سحب بنكي', 'card_to_crypto': 'من بطاقة إلى عملة رقمية',
            'crypto_to_card': 'من عملة رقمية إلى بطاقة', 'bank_to_crypto': 'من بنك إلى عملة رقمية',
            'crypto_to_iban': 'من عملة رقمية إلى حساب بنكي', 'iban_to_card': 'من حساب بنكي إلى بطاقة',
            'crypto_to_crypto': 'تحويل عملة رقمية'
        }
    },
    'es': {
        'debit_title': '💸 <b>Débito exitoso</b>',
        'credit_title': '📥 <b>Fondos recibidos</b>',
        'op_type': 'Tipo de operación:',
        'amount': 'Monto:',
        'fee': 'Comisión:',
        'from': 'De:',
        'from_card': 'Desde tarjeta:',
        'from_iban': 'Desde cuenta (IBAN):',
        'from_crypto': 'Desde billetera cripto:',
        'to': 'A:',
        'to_card': 'A la tarjeta:',
        'to_iban': 'A la cuenta (IBAN):',
        'to_crypto': 'A la billetera cripto:',
        'status': 'Estado:',
        'tx_id': 'ID de transacción:',
        'time': 'Hora:',
        'desc': 'Descripción:',
        'ext_sender': 'Remitente externo',
        'ext_account': 'Cuenta externa',
        'ops': {
            'card_transfer': 'Transferencia a tarjeta', 'internal_transfer': 'Transferencia interna',
            'top_up': 'Recarga de cuenta', 'bank_topup': 'Recarga por transferencia bancaria',
            'crypto_deposit': 'Depósito criptográfico', 'crypto_withdrawal': 'Retiro criptográfico',
            'bank_withdrawal': 'Retiro bancario', 'card_to_crypto': 'Tarjeta a cripto',
            'crypto_to_card': 'Cripto a tarjeta', 'bank_to_crypto': 'Banco a cripto',
            'crypto_to_iban': 'Cripto a cuenta bancaria', 'iban_to_card': 'Cuenta bancaria a tarjeta',
            'crypto_to_crypto': 'Transferencia criptográfica'
        }
    }
}


def to_2_decimals(value):
    if value is None:
        return "0.00"
    if isinstance(value, (int, float, Decimal)):
        return f"{float(value):.2f}"
    if isinstance(value, str):
        if re.match(r'^-?\d+(?:\.\d+)?$', value):
            try:
                return f"{float(value):.2f}"
            except ValueError:
                pass
    return str(value)


def resolve_telegram_username_to_id(username):
    username = username.replace('@', '').strip().lower()
    url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/getUpdates"
    try:
        resp = requests.get(url, timeout=10).json()
        if resp.get('ok'):
            for update in resp['result']:
                msg = update.get('message', {})
                chat = msg.get('chat', {})
                if chat.get('username', '').lower() == username:
                    return str(chat.get('id'))
    except Exception as e:
        logger.error(f"TG Resolve Error: {e}")
    return None

def send_telegram(settings_obj, text):
    try:
        chat_id = settings_obj.telegram_chat_id
        if not chat_id and settings_obj.telegram_username:
            chat_id = resolve_telegram_username_to_id(settings_obj.telegram_username)
            if chat_id:
                settings_obj.telegram_chat_id = chat_id
                settings_obj.save(update_fields=['telegram_chat_id'])
        
        if not chat_id:
            logger.error(f"TG: chat_id not found for {settings_obj.telegram_username}. The user must press /start in the bot!")
            return

        url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
        requests.post(url, json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"}, timeout=10)
    except Exception as e:
        logger.error(f"Telegram Notification Error: {e}")

def send_whatsapp(phone, text):
    try:
        clean_phone = ''.join(filter(str.isdigit, str(phone)))
        try:
            WahaSession = apps.get_model('accounts_apps', 'WahaSession')
            session = WahaSession.objects.filter(is_active=True).first()
        except Exception:
            session = None
        api_url = session.api_url if session else getattr(settings, 'WAHA_API_URL', 'http://waha:3000')
        session_name = session.session_name if session else getattr(settings, 'WAHA_SESSION_NAME', 'default')
        api_key = session.api_key if session else getattr(settings, 'WAHA_API_KEY', '5f0ed637143a4fddac67e3108cfd80ed')
        url = f"{api_url.rstrip('/')}/api/sendText"
        payload = {
            "chatId": f"{clean_phone}@c.us",
            "text": text,
            "session": session_name
        }
        headers = {
            "Content-Type": "application/json",
            "X-Api-Key": api_key
        }
        resp = requests.post(url, json=payload, headers=headers, timeout=30)
        
        if resp.status_code not in [200, 201]:
            logger.error(f"WAHA Error: {resp.status_code} - {resp.text}")
        else:
            logger.info(f"WhatsApp message sent to {clean_phone} successfully.")
    except Exception as e:
        logger.error(f"WhatsApp Notification Error: {str(e)}")

def send_email_async(email, text, is_transaction=False):
    try:
        subject = "💳 Financial Notification | uEasyCard" if is_transaction else "🔔 System Notification | uEasyCard"
        if is_transaction:
            from_email = getattr(settings, 'TRANSACTION_EMAIL_HOST_USER', getattr(settings, 'DEFAULT_FROM_EMAIL'))
            tx_host = getattr(settings, 'TRANSACTION_EMAIL_HOST', None)
            
            if tx_host:
                connection = get_connection(
                    host=tx_host,
                    port=getattr(settings, 'TRANSACTION_EMAIL_PORT', 587),
                    username=getattr(settings, 'TRANSACTION_EMAIL_HOST_USER', ''),
                    password=getattr(settings, 'TRANSACTION_EMAIL_HOST_PASSWORD', ''),
                    use_tls=getattr(settings, 'TRANSACTION_EMAIL_USE_TLS', True)
                )
                email_msg = EmailMessage(subject, text, from_email, [email], connection=connection)
                email_msg.send()
                return
            else:
                send_mail(subject, text, from_email, [email], fail_silently=False)
        else:
            send_mail(subject, text, settings.DEFAULT_FROM_EMAIL, [email], fail_silently=False)
            
    except Exception as e:
        logger.error(f"Email Notification Error: {e}")

def format_human_readable_details(details_str):
    if not details_str:
        return "No details"
    try:
        data = ast.literal_eval(details_str) if isinstance(details_str, str) else details_str
        if isinstance(data, dict):
            lines = []
            if 'acting_role' in data:
                lines.append(f"<b>Acting Role:</b> {data['acting_role']}")
            if 'changes' in data:
                lines.append("<b>Changes:</b>")
                for field, values in data['changes'].items():
                    old_v = to_2_decimals(values.get('было', values.get('was', 'Empty')))
                    new_v = to_2_decimals(values.get('стало', values.get('became', 'Empty')))
                    lines.append(f" └ <i>{field}</i>: {old_v} ➔ {new_v}")
            return "\n".join(lines) if lines else str(data)
        return str(details_str)
    except Exception:
        return str(details_str)

def format_notification_message(instance):
    tz_utc_4 = timezone(timedelta(hours=4))
    local_time = instance.created_at.astimezone(tz_utc_4).strftime('%d.%m.%Y %H:%M:%S')
    pretty_details = format_human_readable_details(instance.details)

    return (
        f"🔔 <b>Admin Action Log</b>\n"
        f"👤 <b>Who:</b> {instance.admin_name or instance.admin_id}\n"
        f"🎯 <b>Action:</b> {instance.action}\n"
        f"👥 <b>To:</b> {instance.target_user_name or instance.target_user_id or 'N/A'}\n"
        f"🕒 <b>Time:</b> {local_time} (UTC+4)\n"
        f"📝 <b>Details:</b>\n{pretty_details}"
    )

def dispatch_notifications(instance):
    privileged_users = UserRoles.objects.filter(role__in=['admin', 'root']).values_list('user_id', flat=True)
    active_settings = AdminNotificationSettings.objects.filter(user_id__in=privileged_users)
    text = format_notification_message(instance)
    wa_text = text.replace('<b>', '*').replace('</b>', '*').replace('<i>', '_').replace('</i>', '_')
    plain_text = text.replace('<b>', '').replace('</b>', '').replace('<i>', '').replace('</i>', '')

    for s in active_settings:
        if s.telegram_enabled and s.telegram_username:
            threading.Thread(target=send_telegram, args=(s, text), daemon=True).start()
        if s.whatsapp_enabled and s.whatsapp_number:
            threading.Thread(target=send_whatsapp, args=(s.whatsapp_number, wa_text), daemon=True).start()
        if s.email_enabled and s.email_address:
            threading.Thread(target=send_email_async, args=(s.email_address, plain_text, False), daemon=True).start()

def dispatch_test_notification(s):
    text = "🔧 <b>Test notification from uEasyCard system</b>\nIf you are reading this, the integration works successfully!"
    if s.telegram_enabled and s.telegram_username:
        threading.Thread(target=send_telegram, args=(s, text), daemon=True).start()
    if s.whatsapp_enabled and s.whatsapp_number:
        threading.Thread(target=send_whatsapp, args=(s.whatsapp_number, text), daemon=True).start()
    if s.email_enabled and s.email_address:
        plain_text = text.replace('<b>', '').replace('</b>', '')
        threading.Thread(target=send_email_async, args=(s.email_address, plain_text, False), daemon=True).start()

def resolve_user_telegram_username_to_id(username):
    username = username.replace('@', '').strip().lower()
    bot_token = getattr(settings, 'USER_TELEGRAM_BOT_TOKEN', '')
    if not bot_token:
        return None
    url = f"https://api.telegram.org/bot{bot_token}/getUpdates"
    try:
        resp = requests.get(url, timeout=10).json()
        if resp.get('ok'):
            for update in resp['result']:
                msg = update.get('message', {})
                chat = msg.get('chat', {})
                if chat.get('username', '').lower() == username:
                    return str(chat.get('id'))
    except Exception as e:
        logger.error(f"User TG Resolve Error: {e}")
    return None

def send_user_telegram(settings_obj, text):
    try:
        bot_token = getattr(settings, 'USER_TELEGRAM_BOT_TOKEN', '')
        if not bot_token:
            logger.error("USER_TELEGRAM_BOT_TOKEN is not configured!")
            return

        chat_id = settings_obj.telegram_chat_id
        if not chat_id and settings_obj.telegram_username:
            chat_id = resolve_user_telegram_username_to_id(settings_obj.telegram_username)
            if chat_id:
                settings_obj.telegram_chat_id = chat_id
                settings_obj.save(update_fields=['telegram_chat_id'])
        
        if not chat_id:
            logger.error(f"User TG: chat_id not found for {settings_obj.telegram_username}. The user must start the bot!")
            return

        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        requests.post(url, json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"}, timeout=10)
    except Exception as e:
        logger.error(f"User Telegram Notification Error: {e}")


def build_transaction_message(txn, role, lang_code='en'):
    if lang_code not in TRANSLATIONS:
        lang_code = 'en'
    t = TRANSLATIONS[lang_code]

    amount = to_2_decimals(txn.amount)
    fee = to_2_decimals(txn.fee) if txn.fee else "0.00"
    currency = txn.currency
    
    tz_utc_4 = timezone(timedelta(hours=4))
    date_str = txn.created_at.astimezone(tz_utc_4).strftime('%d.%m.%Y %H:%M')

    tx_type_display = t['ops'].get(txn.type, txn.type.replace('_', ' ').title())
    meta = txn.metadata or {}
    
    sender_display = txn.sender_name or txn.sender_id or t['ext_sender']
    receiver_display = txn.receiver_name or txn.receiver_id or t['ext_account']
    
    lines = []
    
    if role == 'sender':
        lines.append(t['debit_title'])
        lines.append(f"{t['op_type']} {tx_type_display}")
        lines.append(f"{t['amount']} <b>-{amount} {currency}</b>")
        if txn.fee and float(txn.fee) > 0:
            lines.append(f"{t['fee']} {fee} {currency}")
            
        lines.append(f"{t['from']} {sender_display}")
        if txn.sender_card:
            lines.append(f"{t['from_card']} {txn.sender_card}")
        elif meta.get('sender_iban'):
            lines.append(f"{t['from_iban']} {meta.get('sender_iban')}")
        elif meta.get('from_address'):
            lines.append(f"{t['from_crypto']} {meta.get('from_address')}")
            
        lines.append(f"{t['to']} {receiver_display}")
        if txn.recipient_card:
            lines.append(f"{t['to_card']} {txn.recipient_card}")
        elif meta.get('beneficiary_iban'):
            lines.append(f"{t['to_iban']} {meta.get('beneficiary_iban')}")
        elif meta.get('crypto_address'):
            lines.append(f"{t['to_crypto']} {meta.get('crypto_address')}")
        
    else:
        lines.append(t['credit_title'])
        lines.append(f"{t['op_type']} {tx_type_display}")
        lines.append(f"{t['amount']} <b>+{amount} {currency}</b>")
        
        lines.append(f"{t['to']} {receiver_display}")
        if txn.recipient_card:
            lines.append(f"{t['to_card']} {txn.recipient_card}")
        elif meta.get('beneficiary_iban'):
            lines.append(f"{t['to_iban']} {meta.get('beneficiary_iban')}")
        elif meta.get('crypto_address'):
            lines.append(f"{t['to_crypto']} {meta.get('crypto_address')}")
            
        lines.append(f"{t['from']} {sender_display}")
        if txn.sender_card:
            lines.append(f"{t['from_card']} {txn.sender_card}")
        elif meta.get('sender_iban'):
            lines.append(f"{t['from_iban']} {meta.get('sender_iban')}")
        elif meta.get('from_address'):
            lines.append(f"{t['from_crypto']} {meta.get('from_address')}")

    lines.append("")
    lines.append(f"{t['status']} <b>{txn.status.upper()}</b>")
    lines.append(f"{t['tx_id']} {str(txn.id)}")
    lines.append(f"{t['time']} {date_str} (UTC+4)")
    if txn.description:
        lines.append(f"{t['desc']} {txn.description}")

    return "\n".join(lines)


def get_user_language(user_id):
    if not user_id or str(user_id) == 'EXTERNAL':
        return 'en'
    try:
        profile = Profiles.objects.filter(user_id=str(user_id)).first()
        if profile and profile.language:
            return profile.language.lower()[:2]
    except Exception:
        pass
    return 'en'


def notify_transaction_parties(transaction_id):
    from apps.transactions_apps.models import Transactions
    try:
        txn = Transactions.objects.get(id=transaction_id)
    except Transactions.DoesNotExist:
        return
        
    if txn.sender_id and txn.sender_id != 'EXTERNAL':
        sender_lang = get_user_language(txn.sender_id)
        sender_text = build_transaction_message(txn, 'sender', sender_lang)
        send_user_notification(txn.sender_id, sender_text, is_transaction=True)
        
    if txn.receiver_id and txn.receiver_id != 'EXTERNAL':
        if txn.sender_id != txn.receiver_id:
            receiver_lang = get_user_language(txn.receiver_id)
            receiver_text = build_transaction_message(txn, 'receiver', receiver_lang)
            send_user_notification(txn.receiver_id, receiver_text, is_transaction=True)


def send_user_notification(user_id, text, is_transaction=False):
    try:
        settings_obj = UserNotificationSettings.objects.get(user_id=str(user_id))
    except UserNotificationSettings.DoesNotExist:
        return
    wa_text = text.replace('<b>', '*').replace('</b>', '*').replace('<i>', '_').replace('</i>', '_')
    plain_text = text.replace('<b>', '').replace('</b>', '').replace('<i>', '').replace('</i>', '')
    if settings_obj.telegram_enabled and settings_obj.telegram_username:
        threading.Thread(target=send_user_telegram, args=(settings_obj, text), daemon=True).start()
    if settings_obj.whatsapp_enabled and settings_obj.whatsapp_number:
        threading.Thread(target=send_whatsapp, args=(settings_obj.whatsapp_number, wa_text), daemon=True).start()
    if settings_obj.email_enabled and settings_obj.email_address:
        threading.Thread(target=send_email_async, args=(settings_obj.email_address, plain_text, is_transaction), daemon=True).start()


def dispatch_user_transaction_notification(user_id, tx_details_text=None, transaction_id=None):
    if transaction_id:
        notify_transaction_parties(transaction_id)
    elif tx_details_text:
        send_user_notification(user_id, tx_details_text, is_transaction=True)


# ─── STATEMENT FILE DELIVERY ───

STATEMENT_TRANSLATIONS = {
    'en': {
        'subject': '📄 Your Statement | uEasyCard',
        'message': '📄 Your statement for the period {period} is ready.\nAssets: {assets}.',
        'caption': 'Statement {period}',
    },
    'ru': {
        'subject': '📄 Ваша выписка | uEasyCard',
        'message': '📄 Ваша выписка за период {period} готова.\nАктивы: {assets}.',
        'caption': 'Выписка {period}',
    },
    'de': {
        'subject': '📄 Ihr Kontoauszug | uEasyCard',
        'message': '📄 Ihr Kontoauszug für den Zeitraum {period} ist bereit.\nVermögenswerte: {assets}.',
        'caption': 'Kontoauszug {period}',
    },
    'tr': {
        'subject': '📄 Hesap Özetiniz | uEasyCard',
        'message': '📄 {period} dönemi hesap özetiniz hazır.\nVarlıklar: {assets}.',
        'caption': 'Hesap Özeti {period}',
    },
    'zh': {
        'subject': '📄 您的对账单 | uEasyCard',
        'message': '📄 您 {period} 期间的对账单已准备就绪。\n资产: {assets}。',
        'caption': '对账单 {period}',
    },
    'ar': {
        'subject': '📄 كشف حسابك | uEasyCard',
        'message': '📄 كشف حسابك للفترة {period} جاهز.\nالأصول: {assets}.',
        'caption': 'كشف حساب {period}',
    },
    'es': {
        'subject': '📄 Su Estado de Cuenta | uEasyCard',
        'message': '📄 Su estado de cuenta del período {period} está listo.\nActivos: {assets}.',
        'caption': 'Estado de Cuenta {period}',
    },
}


def send_telegram_document(settings_obj, file_bytes, filename, caption):
    """Send a file (document) via Telegram Bot API."""
    try:
        chat_id = settings_obj.telegram_chat_id
        if not chat_id and settings_obj.telegram_username:
            chat_id = resolve_telegram_username_to_id(settings_obj.telegram_username)
            if chat_id:
                settings_obj.telegram_chat_id = chat_id
                settings_obj.save(update_fields=['telegram_chat_id'])
        if not chat_id:
            logger.error(f"TG Document: chat_id not found for {settings_obj.telegram_username}")
            return False
        url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendDocument"
        files = {'document': (filename, file_bytes, 'application/pdf')}
        data = {'chat_id': chat_id, 'caption': caption, 'parse_mode': 'HTML'}
        resp = requests.post(url, data=data, files=files, timeout=30)
        if resp.status_code == 200:
            logger.info(f"TG document sent to {chat_id}")
            return True
        else:
            logger.error(f"TG Document Error: {resp.status_code} - {resp.text}")
            return False
    except Exception as e:
        logger.error(f"TG Document Error: {e}")
        return False


def send_whatsapp_file(phone, file_bytes, filename, caption):
    """Send a file via WAHA sendFile API."""
    import base64
    try:
        clean_phone = ''.join(filter(str.isdigit, str(phone)))
        try:
            WahaSessionModel = apps.get_model('accounts_apps', 'WahaSession')
            session = WahaSessionModel.objects.filter(is_active=True).first()
        except Exception:
            session = None
        api_url = session.api_url if session else getattr(settings, 'WAHA_API_URL', 'http://waha:3000')
        session_name = session.session_name if session else getattr(settings, 'WAHA_SESSION_NAME', 'default')
        api_key = session.api_key if session else getattr(settings, 'WAHA_API_KEY', '5f0ed637143a4fddac67e3108cfd80ed')

        b64 = base64.b64encode(file_bytes).decode('utf-8')
        url = f"{api_url.rstrip('/')}/api/sendFile"
        payload = {
            "chatId": f"{clean_phone}@c.us",
            "file": {
                "mimetype": "application/pdf",
                "filename": filename,
                "data": f"data:application/pdf;base64,{b64}",
            },
            "caption": caption,
            "session": session_name,
        }
        headers = {"Content-Type": "application/json", "X-Api-Key": api_key}
        resp = requests.post(url, json=payload, headers=headers, timeout=30)
        if resp.status_code in [200, 201]:
            logger.info(f"WA file sent to {clean_phone}")
            return True
        else:
            logger.error(f"WAHA File Error: {resp.status_code} - {resp.text}")
            return False
    except Exception as e:
        logger.error(f"WA File Error: {e}")
        return False


def send_email_with_attachment(email_address, subject, body_text, file_bytes, filename):
    """Send email with HTML file attachment."""
    try:
        from_email = getattr(settings, 'TRANSACTION_EMAIL_HOST_USER', getattr(settings, 'DEFAULT_FROM_EMAIL'))
        tx_host = getattr(settings, 'TRANSACTION_EMAIL_HOST', None)

        if tx_host:
            connection = get_connection(
                host=tx_host,
                port=getattr(settings, 'TRANSACTION_EMAIL_PORT', 587),
                username=getattr(settings, 'TRANSACTION_EMAIL_HOST_USER', ''),
                password=getattr(settings, 'TRANSACTION_EMAIL_HOST_PASSWORD', ''),
                use_tls=getattr(settings, 'TRANSACTION_EMAIL_USE_TLS', True)
            )
        else:
            connection = None

        email_msg = EmailMessage(subject, body_text, from_email, [email_address], connection=connection)
        email_msg.attach(filename, file_bytes, 'text/html')
        email_msg.send()
        logger.info(f"Email with attachment sent to {email_address}")
        return True
    except Exception as e:
        logger.error(f"Email Attachment Error: {e}")
        return False


def send_statement_to_channels(user_id, html_content, channels, period_label, asset_labels, lang='en'):
    """
    Send statement HTML file via selected channels (telegram, whatsapp, email).
    Returns dict with results per channel.
    """
    tr = STATEMENT_TRANSLATIONS.get(lang, STATEMENT_TRANSLATIONS['en'])
    assets_str = ', '.join(asset_labels) if asset_labels else '—'
    message = tr['message'].format(period=period_label, assets=assets_str)
    caption = tr['caption'].format(period=period_label)
    subject = tr['subject']

    file_bytes = html_content.encode('utf-8')
    file_date = __import__('datetime').datetime.now().strftime('%Y%m%d')
    filename = f"uEasyCard_Statement_{file_date}.html"

    # Get user notification settings
    notif = UserNotificationSettings.objects.filter(user_id=user_id).first()
    if not notif:
        return {ch: {'ok': False, 'error': 'Notification settings not found'} for ch in channels}

    results = {}

    for ch in channels:
        if ch == 'telegram':
            if notif.telegram_enabled and (notif.telegram_chat_id or notif.telegram_username):
                ok = send_telegram_document(notif, file_bytes, filename, caption)
                results['telegram'] = {'ok': ok}
            else:
                results['telegram'] = {'ok': False, 'error': 'Telegram not configured'}

        elif ch == 'whatsapp':
            if notif.whatsapp_enabled and notif.whatsapp_number:
                ok = send_whatsapp_file(notif.whatsapp_number, file_bytes, filename, caption)
                results['whatsapp'] = {'ok': ok}
            else:
                results['whatsapp'] = {'ok': False, 'error': 'WhatsApp not configured'}

        elif ch == 'email':
            if notif.email_enabled and notif.email_address:
                ok = send_email_with_attachment(notif.email_address, subject, message, file_bytes, filename)
                results['email'] = {'ok': ok}
            else:
                results['email'] = {'ok': False, 'error': 'Email not configured'}

    return results
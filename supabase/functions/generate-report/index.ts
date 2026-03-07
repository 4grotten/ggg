import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function escapeCSV(val: string): string {
  if (!val) return '';
  if (val.includes('"') || val.includes(',') || val.includes('\n') || val.includes(';')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { backend_token, start_date, end_date, user_name } = await req.json();

    if (!backend_token) {
      return new Response(
        JSON.stringify({ error: "Не авторизован" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const BACKEND_BASE = "https://ueasycard.com/api/v1";
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Token ${backend_token}`,
    };

    // Fetch all transactions
    const response = await fetch(`${BACKEND_BASE}/transactions/all/`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      console.error("Transactions API error:", response.status);
      return new Response(
        JSON.stringify({ error: "Не удалось получить транзакции" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawData = await response.json();
    const allTransactions = Array.isArray(rawData) ? rawData : (rawData?.results || rawData?.data || []);

    // Filter by date range if provided
    let filtered = allTransactions;
    if (start_date || end_date) {
      const startMs = start_date ? new Date(start_date).getTime() : 0;
      const endMs = end_date ? new Date(end_date + "T23:59:59").getTime() : Date.now();
      filtered = allTransactions.filter((tx: any) => {
        const txDate = new Date(tx.created_at).getTime();
        return txDate >= startMs && txDate <= endMs;
      });
    }

    // Build CSV with BOM for Excel
    const BOM = "\uFEFF";
    const separator = ";"; // Excel-friendly separator for RU locale
    
    const headerRow = [
      "№", "Дата", "Время", "Тип", "Описание", "Сумма", "Валюта",
      "Статус", "Отправитель", "Карта отправителя", "Получатель",
      "Карта получателя", "Комиссия", "Категория", "Примечание"
    ].join(separator);

    const typeMap: Record<string, string> = {
      'top_up': 'Пополнение',
      'withdrawal': 'Вывод',
      'transfer_in': 'Входящий перевод',
      'transfer_out': 'Исходящий перевод',
      'card_payment': 'Оплата картой',
      'refund': 'Возврат',
      'fee': 'Комиссия',
      'cashback': 'Кэшбэк',
      'card_activation': 'Активация карты',
      'card_transfer': 'Перевод между картами',
      'bank_transfer': 'Банковский перевод',
      'bank_transfer_incoming': 'Входящий банковский перевод',
      'crypto_withdrawal': 'Вывод крипто',
      'crypto_send': 'Отправка крипто',
      'crypto_deposit': 'Пополнение крипто',
      'crypto_to_card': 'Крипто на карту',
      'crypto_to_iban': 'Крипто на IBAN',
      'crypto_to_crypto': 'Крипто на крипто',
      'bank_to_crypto': 'Банк на крипто',
      'iban_to_iban': 'IBAN на IBAN',
      'internal_transfer': 'Внутренний перевод',
      'payment': 'Платёж',
    };

    const statusMap: Record<string, string> = {
      'pending': 'В обработке',
      'processing': 'Обрабатывается',
      'settled': 'Завершено',
      'completed': 'Завершено',
      'failed': 'Ошибка',
      'cancelled': 'Отменено',
      'declined': 'Отклонено',
    };

    const rows = filtered.map((tx: any, idx: number) => {
      const date = tx.created_at ? formatDate(tx.created_at) : '';
      const time = tx.created_at ? formatTime(tx.created_at) : '';
      const type = typeMap[tx.type] || tx.type || '';
      
      // Description from display block or merchant
      let description = '';
      if (tx.display?.title) {
        description = tx.display.title;
        if (tx.display.subtitle) description += ` - ${tx.display.subtitle}`;
      } else if (tx.merchant_name) {
        description = tx.merchant_name;
      } else if (tx.description) {
        description = tx.description;
      }

      // Amount
      let amount = '';
      if (tx.display?.primary_amount) {
        const pa = tx.display.primary_amount;
        amount = `${pa.sign || ''}${pa.amount}`;
      } else if (tx.amount !== undefined) {
        amount = String(tx.amount);
      }

      const currency = tx.display?.primary_amount?.currency || tx.currency || 'AED';
      const status = statusMap[tx.status] || tx.status || '';
      
      // Sender/receiver info
      const senderName = tx.sender_name || tx.metadata?.sender_name || '';
      const senderCard = tx.sender_card_mask || '';
      const receiverName = tx.receiver_name || tx.metadata?.beneficiary_name || tx.metadata?.receiver_name || '';
      const receiverCard = tx.receiver_card_mask || '';
      
      // Fee
      const fee = tx.fee !== undefined && tx.fee !== null ? String(tx.fee) : '';
      
      // Category
      const category = tx.merchant_category || tx.metadata?.category || '';
      
      // Notes
      const note = tx.metadata?.note || tx.metadata?.reference || '';

      return [
        idx + 1, 
        escapeCSV(date), 
        escapeCSV(time), 
        escapeCSV(type),
        escapeCSV(description), 
        escapeCSV(amount), 
        escapeCSV(currency),
        escapeCSV(status), 
        escapeCSV(senderName), 
        escapeCSV(senderCard),
        escapeCSV(receiverName), 
        escapeCSV(receiverCard),
        escapeCSV(fee), 
        escapeCSV(category), 
        escapeCSV(note)
      ].join(separator);
    });

    // Summary section
    const totalIn = filtered
      .filter((tx: any) => {
        const amt = tx.display?.primary_amount ? parseFloat(String(tx.display.primary_amount.amount).replace(/,/g, '')) : parseFloat(tx.amount);
        const sign = tx.display?.primary_amount?.sign;
        return sign === '+' || (!sign && amt > 0);
      })
      .reduce((sum: number, tx: any) => {
        const amt = tx.display?.primary_amount ? parseFloat(String(tx.display.primary_amount.amount).replace(/,/g, '')) : Math.abs(parseFloat(tx.amount));
        return sum + (isNaN(amt) ? 0 : amt);
      }, 0);

    const totalOut = filtered
      .filter((tx: any) => {
        const amt = tx.display?.primary_amount ? parseFloat(String(tx.display.primary_amount.amount).replace(/,/g, '')) : parseFloat(tx.amount);
        const sign = tx.display?.primary_amount?.sign;
        return sign === '-' || (!sign && amt < 0);
      })
      .reduce((sum: number, tx: any) => {
        const amt = tx.display?.primary_amount ? parseFloat(String(tx.display.primary_amount.amount).replace(/,/g, '')) : Math.abs(parseFloat(tx.amount));
        return sum + (isNaN(amt) ? 0 : amt);
      }, 0);

    const summaryRows = [
      '',
      ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''].join(separator),
      `ИТОГО ОПЕРАЦИЙ${separator}${filtered.length}`,
      `ПРИХОД (AED)${separator}${totalIn.toFixed(2)}`,
      `РАСХОД (AED)${separator}${totalOut.toFixed(2)}`,
      `БАЛАНС (AED)${separator}${(totalIn - totalOut).toFixed(2)}`,
    ];

    const periodLabel = start_date && end_date 
      ? `Период: ${formatDate(start_date)} - ${formatDate(end_date)}`
      : start_date 
        ? `Период: с ${formatDate(start_date)}`
        : end_date 
          ? `Период: по ${formatDate(end_date)}`
          : 'Все транзакции';

    const titleRows = [
      `Easy Card - Отчёт по транзакциям`,
      periodLabel,
      user_name ? `Клиент: ${user_name}` : '',
      `Дата формирования: ${formatDate(new Date().toISOString())}`,
      '',
    ];

    const csvContent = BOM + titleRows.join('\n') + '\n' + headerRow + '\n' + rows.join('\n') + '\n' + summaryRows.join('\n');

    // Generate filename
    const fileDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const fileName = `EasyCard_Report_${fileDate}.csv`;

    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Report generation error:", error);
    return new Response(
      JSON.stringify({ error: "Ошибка при формировании отчёта" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

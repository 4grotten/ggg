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

function esc(val: string): string {
  if (!val) return '';
  return val.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const typeMap: Record<string, string> = {
  'top_up': 'Пополнение', 'withdrawal': 'Вывод', 'transfer_in': 'Входящий перевод',
  'transfer_out': 'Исходящий перевод', 'card_payment': 'Оплата картой', 'refund': 'Возврат',
  'fee': 'Комиссия', 'cashback': 'Кэшбэк', 'card_activation': 'Активация карты',
  'card_transfer': 'Перевод между картами', 'bank_transfer': 'Банковский перевод',
  'bank_transfer_incoming': 'Входящий банк. перевод', 'crypto_withdrawal': 'Вывод крипто',
  'crypto_send': 'Отправка крипто', 'crypto_deposit': 'Пополнение крипто',
  'crypto_to_card': 'Крипто → Карта', 'crypto_to_iban': 'Крипто → IBAN',
  'crypto_to_crypto': 'Крипто → Крипто', 'bank_to_crypto': 'Банк → Крипто',
  'iban_to_iban': 'IBAN → IBAN', 'internal_transfer': 'Внутренний перевод', 'payment': 'Платёж',
};

const statusMap: Record<string, { label: string; color: string }> = {
  'pending': { label: 'В обработке', color: '#f59e0b' },
  'processing': { label: 'Обрабатывается', color: '#3b82f6' },
  'settled': { label: 'Завершено', color: '#10b981' },
  'completed': { label: 'Завершено', color: '#10b981' },
  'failed': { label: 'Ошибка', color: '#ef4444' },
  'cancelled': { label: 'Отменено', color: '#6b7280' },
  'declined': { label: 'Отклонено', color: '#ef4444' },
};

function buildHTML(filtered: any[], periodLabel: string, userName: string, generatedDate: string, totalIn: number, totalOut: number): string {
  const txRows = filtered.map((tx: any, idx: number) => {
    const date = tx.created_at ? formatDate(tx.created_at) : '';
    const time = tx.created_at ? formatTime(tx.created_at) : '';
    const type = typeMap[tx.type] || tx.type || '—';

    let description = '';
    if (tx.display?.title) {
      description = tx.display.title;
      if (tx.display.subtitle) description += `<br><span class="sub">${esc(tx.display.subtitle)}</span>`;
    } else if (tx.merchant_name) {
      description = tx.merchant_name;
    } else if (tx.description) {
      description = tx.description;
    }

    let amount = '';
    let sign = '';
    if (tx.display?.primary_amount) {
      const pa = tx.display.primary_amount;
      sign = pa.sign || '';
      amount = `${sign}${pa.amount}`;
    } else if (tx.amount !== undefined) {
      amount = String(tx.amount);
      sign = parseFloat(tx.amount) >= 0 ? '+' : '-';
    }
    const currency = tx.display?.primary_amount?.currency || tx.currency || 'AED';
    const amountClass = sign === '+' ? 'amount-in' : sign === '-' ? 'amount-out' : '';

    const st = statusMap[tx.status] || { label: tx.status || '—', color: '#6b7280' };
    const senderName = esc(tx.sender_name || tx.metadata?.sender_name || '—');
    const receiverName = esc(tx.receiver_name || tx.metadata?.beneficiary_name || tx.metadata?.receiver_name || '—');
    
    // Build masked account details for sender
    const senderDetails: string[] = [];
    if (tx.sender_card_mask) senderDetails.push(`•••• ${tx.sender_card_mask.slice(-4)}`);
    if (tx.metadata?.sender_iban_mask) senderDetails.push(tx.metadata.sender_iban_mask);
    else if (tx.metadata?.sender_iban) {
      const iban = String(tx.metadata.sender_iban);
      senderDetails.push(`${iban.slice(0, 4)}••••${iban.slice(-4)}`);
    }
    if (tx.metadata?.from_address) {
      const addr = String(tx.metadata.from_address);
      senderDetails.push(`${addr.slice(0, 6)}••••${addr.slice(-4)}`);
    }
    if (tx.metadata?.from_wallet_address) {
      const addr = String(tx.metadata.from_wallet_address);
      senderDetails.push(`${addr.slice(0, 6)}••••${addr.slice(-4)}`);
    }
    
    // Build masked account details for receiver
    const receiverDetails: string[] = [];
    if (tx.receiver_card_mask) receiverDetails.push(`•••• ${tx.receiver_card_mask.slice(-4)}`);
    if (tx.metadata?.receiver_iban_mask || tx.metadata?.beneficiary_iban) {
      const iban = String(tx.metadata?.receiver_iban_mask || tx.metadata?.beneficiary_iban);
      receiverDetails.push(iban.length > 8 ? `${iban.slice(0, 4)}••••${iban.slice(-4)}` : iban);
    }
    if (tx.metadata?.to_address || tx.metadata?.to_wallet_address) {
      const addr = String(tx.metadata?.to_address || tx.metadata?.to_wallet_address);
      receiverDetails.push(`${addr.slice(0, 6)}••••${addr.slice(-4)}`);
    }
    if (tx.metadata?.receiver_card_number) {
      const card = String(tx.metadata.receiver_card_number);
      receiverDetails.push(`•••• ${card.slice(-4)}`);
    }
    
    const senderMask = senderDetails.length > 0 ? esc(senderDetails.join(' · ')) : '—';
    const receiverMask = receiverDetails.length > 0 ? esc(receiverDetails.join(' · ')) : '—';
    const fee = tx.fee !== undefined && tx.fee !== null ? `${tx.fee} ${currency}` : '—';

    return `<tr>
      <td class="num">${idx + 1}</td>
      <td class="date-cell">${esc(date)}<br><span class="time">${esc(time)}</span></td>
      <td><span class="type-badge">${esc(type)}</span></td>
      <td class="desc">${description || '—'}</td>
      <td class="amount ${amountClass}">${esc(amount)} ${esc(currency)}</td>
      <td><span class="status-dot" style="background:${st.color}"></span>${esc(st.label)}</td>
      <td class="participant">${senderName}<br><span class="card-mask">${senderMask}</span></td>
      <td class="participant">${receiverName}<br><span class="card-mask">${receiverMask}</span></td>
      <td class="fee">${esc(fee)}</td>
    </tr>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>uEasyCard — Отчёт по транзакциям</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  
  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  body {
    font-family: 'Inter', -apple-system, sans-serif;
    background: #f8fafc;
    color: #1e293b;
    line-height: 1.5;
  }
  
  .page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0;
    background: #fff;
    min-height: 100vh;
  }
  
  /* ===== HEADER ===== */
  .header {
    background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0ea5e9 100%);
    color: #fff;
    padding: 40px 48px;
    position: relative;
    overflow: hidden;
  }
  
  .header::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -20%;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(14,165,233,0.2) 0%, transparent 70%);
    border-radius: 50%;
  }
  
  .header::after {
    content: '';
    position: absolute;
    bottom: -30%;
    left: 10%;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(56,189,248,0.15) 0%, transparent 70%);
    border-radius: 50%;
  }
  
  .header-content {
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  
  .brand {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
  }
  
  .logo-circle {
    width: 56px;
    height: 56px;
    background: rgba(255,255,255,0.15);
    backdrop-filter: blur(10px);
    border: 2px solid rgba(255,255,255,0.25);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: 800;
    color: #38bdf8;
  }
  
  .brand-name {
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.5px;
  }
  
  .brand-name span { color: #38bdf8; }
  
  .report-title {
    font-size: 18px;
    font-weight: 600;
    opacity: 0.9;
    margin-bottom: 6px;
  }
  
  .report-period {
    font-size: 32px;
    font-weight: 800;
    letter-spacing: -1px;
    background: linear-gradient(90deg, #fff, #7dd3fc);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .header-meta {
    text-align: right;
    font-size: 13px;
    opacity: 0.75;
    line-height: 1.8;
  }
  
  .header-meta strong {
    display: block;
    font-size: 14px;
    opacity: 1;
    color: #7dd3fc;
  }
  
  /* ===== SUMMARY CARDS ===== */
  .summary {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    padding: 24px 48px;
    margin-top: -28px;
    position: relative;
    z-index: 2;
  }
  
  .summary-card {
    background: #fff;
    border-radius: 16px;
    padding: 20px 24px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    border: 1px solid #e2e8f0;
  }
  
  .summary-card .label {
    font-size: 12px;
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
  }
  
  .summary-card .value {
    font-size: 24px;
    font-weight: 800;
    letter-spacing: -0.5px;
  }
  
  .summary-card.income .value { color: #10b981; }
  .summary-card.expense .value { color: #ef4444; }
  .summary-card.balance .value { color: #0ea5e9; }
  .summary-card.count .value { color: #1e293b; }
  
  /* ===== TABLE ===== */
  .table-wrapper {
    padding: 24px 48px 48px;
    overflow-x: auto;
  }
  
  .table-title {
    font-size: 16px;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .table-title::before {
    content: '';
    width: 4px;
    height: 20px;
    background: linear-gradient(180deg, #0ea5e9, #38bdf8);
    border-radius: 2px;
  }
  
  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 13px;
  }
  
  thead th {
    background: #f1f5f9;
    color: #64748b;
    font-weight: 600;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 12px 14px;
    text-align: left;
    white-space: nowrap;
    border-bottom: 2px solid #e2e8f0;
  }
  
  thead th:first-child { border-radius: 10px 0 0 0; }
  thead th:last-child { border-radius: 0 10px 0 0; }
  
  tbody tr {
    transition: background 0.15s;
  }
  
  tbody tr:hover { background: #f8fafc; }
  tbody tr:nth-child(even) { background: #fafbfc; }
  tbody tr:nth-child(even):hover { background: #f1f5f9; }
  
  td {
    padding: 12px 14px;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: middle;
  }
  
  .num {
    color: #94a3b8;
    font-weight: 500;
    text-align: center;
    width: 40px;
  }
  
  .date-cell { white-space: nowrap; font-weight: 500; }
  .time { color: #94a3b8; font-size: 11px; }
  
  .type-badge {
    display: inline-block;
    background: #eff6ff;
    color: #3b82f6;
    padding: 3px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
  }
  
  .desc { max-width: 200px; }
  .sub { color: #94a3b8; font-size: 11px; }
  
  .amount {
    font-weight: 700;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }
  
  .amount-in { color: #10b981; }
  .amount-out { color: #ef4444; }
  
  .status-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 6px;
    vertical-align: middle;
  }
  
  .participant {
    font-size: 12px;
    max-width: 140px;
  }
  
  .card-mask {
    color: #94a3b8;
    font-size: 11px;
    font-family: 'SF Mono', 'Fira Code', monospace;
  }
  
  .fee {
    color: #94a3b8;
    font-size: 12px;
    white-space: nowrap;
  }
  
  /* ===== FOOTER ===== */
  .footer {
    padding: 32px 48px;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: #94a3b8;
  }
  
  .footer-brand {
    font-weight: 700;
    color: #64748b;
  }
  
  /* Print styles */
  @media print {
    body { background: #fff; }
    .page { box-shadow: none; }
    .summary-card { box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @page { margin: 0; size: A4 landscape; }
  }
</style>
</head>
<body>
<div class="page">
  <!-- HEADER -->
  <div class="header">
    <div class="header-content">
      <div>
        <div class="brand">
          <div class="logo-circle">U</div>
          <div class="brand-name"><span>u</span>EasyCard</div>
        </div>
        <div class="report-title">📊 Отчёт по транзакциям</div>
        <div class="report-period">${esc(periodLabel)}</div>
      </div>
      <div class="header-meta">
        ${userName ? `<strong>${esc(userName)}</strong>` : ''}
        Дата формирования: ${esc(generatedDate)}<br>
        Документ сформирован автоматически<br>
        uEasyCard Financial Services
      </div>
    </div>
  </div>

  <!-- SUMMARY -->
  <div class="summary">
    <div class="summary-card count">
      <div class="label">Всего операций</div>
      <div class="value">${filtered.length}</div>
    </div>
    <div class="summary-card income">
      <div class="label">Приход</div>
      <div class="value">+${totalIn.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} AED</div>
    </div>
    <div class="summary-card expense">
      <div class="label">Расход</div>
      <div class="value">-${totalOut.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} AED</div>
    </div>
    <div class="summary-card balance">
      <div class="label">Баланс</div>
      <div class="value">${(totalIn - totalOut).toLocaleString('ru-RU', { minimumFractionDigits: 2 })} AED</div>
    </div>
  </div>

  <!-- TABLE -->
  <div class="table-wrapper">
    <div class="table-title">Детализация операций</div>
    <table>
      <thead>
        <tr>
          <th>№</th>
          <th>Дата</th>
          <th>Тип</th>
          <th>Описание</th>
          <th>Сумма</th>
          <th>Статус</th>
          <th>Отправитель</th>
          <th>Получатель</th>
          <th>Комиссия</th>
        </tr>
      </thead>
      <tbody>
        ${txRows}
      </tbody>
    </table>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-brand">uEasyCard © ${new Date().getFullYear()}</div>
    <div>Конфиденциальный документ · Только для личного использования</div>
  </div>
</div>
</body>
</html>`;
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

    const response = await fetch(`${BACKEND_BASE}/transactions/all/`, { method: "GET", headers });

    if (!response.ok) {
      console.error("Transactions API error:", response.status);
      return new Response(
        JSON.stringify({ error: "Не удалось получить транзакции" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawData = await response.json();
    const allTransactions = Array.isArray(rawData) ? rawData : (rawData?.results || rawData?.data || []);

    let filtered = allTransactions;
    if (start_date || end_date) {
      const startMs = start_date ? new Date(start_date).getTime() : 0;
      const endMs = end_date ? new Date(end_date + "T23:59:59").getTime() : Date.now();
      filtered = allTransactions.filter((tx: any) => {
        const txDate = new Date(tx.created_at).getTime();
        return txDate >= startMs && txDate <= endMs;
      });
    }

    // Calculate totals
    const totalIn = filtered
      .filter((tx: any) => {
        const sign = tx.display?.primary_amount?.sign;
        const amt = parseFloat(String(tx.display?.primary_amount?.amount || tx.amount || 0).replace(/,/g, ''));
        return sign === '+' || (!sign && amt > 0);
      })
      .reduce((sum: number, tx: any) => {
        const amt = parseFloat(String(tx.display?.primary_amount?.amount || tx.amount || 0).replace(/,/g, ''));
        return sum + (isNaN(amt) ? 0 : Math.abs(amt));
      }, 0);

    const totalOut = filtered
      .filter((tx: any) => {
        const sign = tx.display?.primary_amount?.sign;
        const amt = parseFloat(String(tx.display?.primary_amount?.amount || tx.amount || 0).replace(/,/g, ''));
        return sign === '-' || (!sign && amt < 0);
      })
      .reduce((sum: number, tx: any) => {
        const amt = parseFloat(String(tx.display?.primary_amount?.amount || tx.amount || 0).replace(/,/g, ''));
        return sum + (isNaN(amt) ? 0 : Math.abs(amt));
      }, 0);

    const periodLabel = start_date && end_date
      ? `${formatDate(start_date)} — ${formatDate(end_date)}`
      : start_date
        ? `с ${formatDate(start_date)}`
        : end_date
          ? `по ${formatDate(end_date)}`
          : 'Все транзакции';

    const generatedDate = formatDate(new Date().toISOString());
    const html = buildHTML(filtered, periodLabel, user_name || '', generatedDate, totalIn, totalOut);

    const fileDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const fileName = `uEasyCard_Report_${fileDate}.html`;

    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
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

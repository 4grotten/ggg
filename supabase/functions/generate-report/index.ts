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
    // IBAN
    const sIban = tx.metadata?.sender_iban_mask || tx.metadata?.sender_iban || tx.metadata?.from_iban;
    if (sIban) {
      const s = String(sIban);
      senderDetails.push(s.length > 8 ? `${s.slice(0, 4)}••••${s.slice(-4)}` : s);
    }
    // Crypto address
    const sAddr = tx.metadata?.from_address || tx.metadata?.from_wallet_address || tx.metadata?.crypto_address || tx.metadata?.sender_crypto_address;
    if (sAddr) {
      const a = String(sAddr);
      senderDetails.push(`${a.slice(0, 6)}••••${a.slice(-4)}`);
    }
    // Card number from metadata
    if (tx.metadata?.from_card_number || tx.metadata?.sender_card_number) {
      const c = String(tx.metadata?.from_card_number || tx.metadata?.sender_card_number);
      senderDetails.push(`•••• ${c.slice(-4)}`);
    }
    // Movements fallback (index 0 = sender)
    if (senderDetails.length === 0 && tx.movements && Array.isArray(tx.movements) && tx.movements[0]) {
      const m = tx.movements[0];
      if (m.card_mask) senderDetails.push(`•••• ${m.card_mask.slice(-4)}`);
      else if (m.iban) { const i = String(m.iban); senderDetails.push(`${i.slice(0, 4)}••••${i.slice(-4)}`); }
      else if (m.address) { const a = String(m.address); senderDetails.push(`${a.slice(0, 6)}••••${a.slice(-4)}`); }
    }
    
    // Build masked account details for receiver
    const receiverDetails: string[] = [];
    if (tx.receiver_card_mask) receiverDetails.push(`•••• ${tx.receiver_card_mask.slice(-4)}`);
    // IBAN
    const rIban = tx.metadata?.receiver_iban_mask || tx.metadata?.beneficiary_iban || tx.metadata?.receiver_iban || tx.metadata?.to_iban;
    if (rIban) {
      const s = String(rIban);
      receiverDetails.push(s.length > 8 ? `${s.slice(0, 4)}••••${s.slice(-4)}` : s);
    }
    // Crypto address
    const rAddr = tx.metadata?.to_address || tx.metadata?.to_wallet_address || tx.metadata?.receiver_crypto_address;
    if (rAddr) {
      const a = String(rAddr);
      receiverDetails.push(`${a.slice(0, 6)}••••${a.slice(-4)}`);
    }
    // Card number
    const rCard = tx.metadata?.receiver_card_number || tx.metadata?.to_card_number || tx.metadata?.card_number || tx.metadata?.to_card_mask;
    if (rCard) {
      const c = String(rCard);
      receiverDetails.push(`•••• ${c.slice(-4)}`);
    }
    // Movements fallback - check ALL movements for receiver data
    if (receiverDetails.length === 0 && tx.movements && Array.isArray(tx.movements)) {
      // Try index 1 first, then any movement with account_type 'card' or 'bank'
      const candidates = tx.movements.length > 1 ? [tx.movements[1], ...tx.movements] : tx.movements;
      for (const m of candidates) {
        if (receiverDetails.length > 0) break;
        if (m.card_mask) receiverDetails.push(`•••• ${m.card_mask.slice(-4)}`);
        else if (m.card_number) { const c = String(m.card_number); receiverDetails.push(`•••• ${c.slice(-4)}`); }
        else if (m.iban) { const i = String(m.iban); receiverDetails.push(`${i.slice(0, 4)}••••${i.slice(-4)}`); }
        else if (m.address) { const a = String(m.address); receiverDetails.push(`${a.slice(0, 6)}••••${a.slice(-4)}`); }
      }
    }
    // Last resort: use display subtitle
    if (receiverDetails.length === 0 && tx.display?.subtitle) {
      const sub = String(tx.display.subtitle);
      const cardMatch = sub.match(/(\d{4})\s*$/);
      if (cardMatch) receiverDetails.push(`•••• ${cardMatch[1]}`);
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
    background: linear-gradient(135deg, #000000 0%, #0a0a0a 40%, #007AFF 100%);
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
    background: radial-gradient(circle, rgba(0,122,255,0.3) 0%, transparent 70%);
    border-radius: 50%;
  }
  
  .header::after {
    content: '';
    position: absolute;
    bottom: -30%;
    left: 10%;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(0,122,255,0.2) 0%, transparent 70%);
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
  
  .logo-svg {
    width: 56px;
    height: 56px;
    flex-shrink: 0;
  }
  
  .brand-name {
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.5px;
  }
  
  .brand-name .u-letter { color: #007AFF; }
  
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
    background: linear-gradient(90deg, #fff, #5AC8FA);
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
    color: #5AC8FA;
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
  .summary-card.balance .value { color: #007AFF; }
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
          <svg class="logo-svg" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="512" height="512" rx="62" fill="#0ea5e9"/>
            <path d="M259 66.002L301.399 66V266.83C301.399 289.38 296.013 309.111 285.242 326.023C274.571 342.935 259.622 356.122 240.394 365.585C221.167 374.947 198.769 379.628 173.199 379.628C147.529 379.628 125.081 374.947 105.853 365.585C86.6258 356.122 71.6767 342.935 61.006 326.023C50.3353 309.111 45 289.38 45 266.83V66H110.383V261.243C110.383 273.021 112.95 283.491 118.084 292.651C123.319 301.812 130.668 309.01 140.13 314.245C149.593 319.479 160.616 322.097 173.199 322.097C185.883 322.097 196.906 319.479 206.268 314.245C215.731 309.01 223.029 301.812 228.163 292.651C233.398 283.491 236.015 273.021 236.015 261.243L259 66.002Z" fill="white"/>
            <path d="M259 379.002V66.002H467.381V120.563H324.383V195.145H456.659V249.706H324.383V324.441H467.985V379.002H259Z" fill="white"/>
            <path d="M142.852 414.35H119.597C119.172 413.031 118.305 411.858 116.995 410.834C115.686 409.793 114.004 408.908 111.951 408.179C109.898 407.449 107.527 406.89 104.837 406.502C102.182 406.114 99.2974 405.92 96.1826 405.92C90.5546 405.92 85.6523 406.533 81.4755 407.76C77.2988 408.971 74.0601 410.74 71.7593 413.069C69.4586 415.383 68.3082 418.193 68.3082 421.5C68.3082 424.9 69.4586 427.757 71.7593 430.07C74.0955 432.384 77.3519 434.13 81.5286 435.31C85.7054 436.49 90.5369 437.08 96.0233 437.08C99.1027 437.08 101.952 436.902 104.571 436.545C107.226 436.188 109.58 435.667 111.633 434.984C113.686 434.286 115.385 433.439 116.73 432.446C118.11 431.452 119.066 430.319 119.597 429.046L142.852 429.092C142.25 431.281 140.746 433.393 138.339 435.427C135.968 437.445 132.764 439.254 128.729 440.853C124.729 442.437 119.951 443.694 114.394 444.626C108.872 445.542 102.625 446 95.6516 446C85.9531 446 77.2811 445.037 69.6356 443.112C62.0255 441.187 56.0081 438.4 51.5836 434.751C47.1945 431.103 45 426.686 45 421.5C45 416.299 47.2299 411.874 51.6898 408.225C56.1497 404.577 62.2024 401.798 69.848 399.888C77.4935 397.963 86.0947 397 95.6516 397C101.952 397 107.792 397.388 113.173 398.164C118.588 398.941 123.384 400.074 127.561 401.565C131.738 403.04 135.136 404.848 137.755 406.991C140.41 409.134 142.109 411.587 142.852 414.35Z" fill="white"/>
            <path d="M176.036 445.348H151.4L188.938 397.652H218.564L256.048 445.348H231.413L204.176 408.551H203.326L176.036 445.348ZM174.496 426.6H232.687V434.472H174.496V426.6Z" fill="white"/>
            <path d="M253.754 445.348V397.652H300.605C306.977 397.652 312.428 398.458 316.959 400.07C321.525 401.666 325.011 404.011 327.418 407.104C329.86 410.181 331.081 413.948 331.081 418.404C331.081 421.943 330.322 424.989 328.805 427.542C327.287 430.078 325.189 432.152 322.512 433.762C319.87 435.357 316.817 436.521 313.353 437.252L311.76 438.32H269.828L269.934 429.752H300.871C304.23 429.752 307.035 429.256 309.284 428.263C311.534 427.254 313.229 425.846 314.37 424.037C315.546 422.213 316.134 420.078 316.134 417.634C316.134 414.977 315.529 412.686 314.317 410.76C313.141 408.834 311.393 407.357 309.072 406.33C306.787 405.286 303.964 404.765 300.605 404.765H268.648V445.348H253.754ZM318.976 432.901L334.027 445.348H316.64L302.091 432.901H318.976Z" fill="white"/>
            <path d="M338.859 445.348V397.652H380.737C390.329 397.652 397.88 399.676 403.39 403.725C408.935 407.758 411.708 413.454 411.708 420.812C411.708 425.854 410.491 430.163 408.06 433.739C405.628 437.299 402.055 440.041 397.342 441.963C392.628 443.886 386.858 444.848 380.031 444.848L381.624 445.348H338.859ZM353.753 437.252H380.631C385.239 437.252 389.168 436.677 392.42 435.528C395.671 434.363 398.154 432.614 399.87 430.279C401.622 427.928 402.498 424.988 402.498 421.459C402.498 417.371 401.534 413.971 399.605 411.259C397.711 408.531 395 406.461 391.466 405.049C387.969 403.621 383.757 402.907 378.826 402.907L380.366 402.191H353.753V437.252ZM380.949 404.765L380.578 405.271V437.252L381.161 437.829H402.339V445.348H365.643V397.652H401.686V404.765H380.949Z" fill="white"/>
            <path d="M421.127 445.348V438.499L421.604 437.829H421.127V397.652H465.739V404.765H436.021V417.318H463.112V424.431H436.021V437.829H421.604L421.127 438.499V445.348Z" fill="white" fill-opacity="0.996078"/>
          </svg>
          <div class="brand-name"><span class="u-letter">u</span>EasyCard</div>
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

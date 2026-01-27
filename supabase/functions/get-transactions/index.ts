import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TransactionQuery {
  user_id?: string;
  type?: string;
  limit?: number;
  days?: number;
  summary?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse query parameters
    const url = new URL(req.url);
    const body = req.method === 'POST' ? await req.json() : {};
    
    const userId = body.user_id || url.searchParams.get('user_id') || '00000000-0000-0000-0000-000000000001';
    const type = body.type || url.searchParams.get('type');
    const limit = parseInt(body.limit || url.searchParams.get('limit') || '10');
    const days = parseInt(body.days || url.searchParams.get('days') || '30');
    const summary = body.summary === true || url.searchParams.get('summary') === 'true';

    console.log(`Querying transactions: user_id=${userId}, type=${type}, limit=${limit}, days=${days}, summary=${summary}`);

    // Build query
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter by type if specified
    if (type) {
      query = query.eq('type', type);
    }

    const { data: transactions, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch transactions', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If summary requested, calculate aggregates
    if (summary) {
      const summaryData = calculateSummary(transactions || []);
      return new Response(
        JSON.stringify({
          summary: summaryData,
          recent_transactions: (transactions || []).slice(0, 5),
          total_count: transactions?.length || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format transactions for AI agent
    const formattedTransactions = (transactions || []).map(tx => ({
      id: tx.id,
      type: formatTransactionType(tx.type),
      amount: `${tx.amount > 0 ? '+' : ''}${tx.amount} ${tx.currency}`,
      description: tx.description,
      merchant: tx.merchant_name,
      category: tx.merchant_category,
      date: formatDate(tx.created_at),
      status: tx.status
    }));

    return new Response(
      JSON.stringify({
        transactions: formattedTransactions,
        count: formattedTransactions.length,
        period_days: days
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function formatTransactionType(type: string): string {
  const typeMap: Record<string, string> = {
    'top_up': 'Пополнение',
    'withdrawal': 'Вывод',
    'transfer_in': 'Входящий перевод',
    'transfer_out': 'Исходящий перевод',
    'card_payment': 'Оплата картой',
    'refund': 'Возврат',
    'fee': 'Комиссия',
    'cashback': 'Кэшбэк',
    'card_activation': 'Активация карты'
  };
  return typeMap[type] || type;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

function calculateSummary(transactions: any[]) {
  const income = transactions
    .filter(tx => tx.amount > 0)
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
  
  const expenses = transactions
    .filter(tx => tx.amount < 0)
    .reduce((sum, tx) => sum + Math.abs(parseFloat(tx.amount)), 0);

  const byType = transactions.reduce((acc, tx) => {
    const type = formatTransactionType(tx.type);
    if (!acc[type]) {
      acc[type] = { count: 0, total: 0 };
    }
    acc[type].count++;
    acc[type].total += parseFloat(tx.amount);
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  const merchantTotals: Record<string, number> = transactions
    .filter(tx => tx.merchant_name && tx.amount < 0)
    .reduce((acc, tx) => {
      if (!acc[tx.merchant_name]) {
        acc[tx.merchant_name] = 0;
      }
      acc[tx.merchant_name] += Math.abs(parseFloat(tx.amount));
      return acc;
    }, {} as Record<string, number>);

  const topMerchants = Object.entries(merchantTotals)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 3)
    .map(([name, amount]) => ({ name, amount: `${(amount as number).toFixed(2)} AED` }));

  return {
    total_income: `+${income.toFixed(2)} AED`,
    total_expenses: `-${expenses.toFixed(2)} AED`,
    net_balance: `${(income - expenses).toFixed(2)} AED`,
    transaction_count: transactions.length,
    by_type: byType,
    top_merchants: topMerchants
  };
}

import { ArrowDownLeft, ArrowUpRight, CreditCard, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageContentProps {
  content: string;
}

// Regex patterns for detecting financial data
const AMOUNT_PATTERN = /([+-]?\d{1,3}(?:[,\s]?\d{3})*(?:\.\d{1,2})?)\s*(AED|дирхам|USDT|USD)/gi;
const TRANSACTION_LINE_PATTERN = /^[-•]\s*(\d{2}\.\d{2}\.\d{4}):\s*(.*?)\s*([+-]?\d{1,3}(?:[,\s]?\d{3})*(?:\.\d{1,2})?)\s*AED(.*)$/gm;
const BALANCE_PATTERN = /(Общий баланс|Баланс|Total balance|Balance|Доходы|Income|Расходы|Expenses):\s*([+-]?\d{1,3}(?:[,\s]?\d{3})*(?:\.\d{1,2})?)\s*(AED|дирхам)?/gi;

interface ParsedTransaction {
  date: string;
  type: string;
  amount: number;
  description: string;
}

interface ParsedBalance {
  label: string;
  amount: string;
  isIncome: boolean;
  isExpense: boolean;
}

const parseTransactionType = (typeStr: string): 'incoming' | 'outgoing' | 'card' => {
  const lower = typeStr.toLowerCase();
  if (lower.includes('пополнение') || lower.includes('входящий') || lower.includes('кэшбэк') || lower.includes('возврат')) {
    return 'incoming';
  }
  if (lower.includes('оплата') || lower.includes('перевод') || lower.includes('комиссия') || lower.includes('вывод') || lower.includes('исходящий')) {
    return 'outgoing';
  }
  return 'card';
};

const TransactionItem = ({ date, type, amount, description }: ParsedTransaction) => {
  const isPositive = amount > 0;
  
  const getIcon = () => {
    if (isPositive) return <ArrowDownLeft className="w-4 h-4 text-white" />;
    return <ArrowUpRight className="w-4 h-4 text-white" />;
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-background border border-border/50 shadow-sm my-1.5">
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
        isPositive ? "bg-success" : "bg-destructive"
      )}>
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium truncate">{type}</p>
          <p className={cn(
            "text-sm font-bold flex-shrink-0",
            isPositive ? "text-success" : "text-destructive"
          )}>
            {isPositive ? '+' : ''}{amount.toFixed(2)} AED
          </p>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          {description ? (
            <p className="text-xs text-muted-foreground truncate">{description.trim()}</p>
          ) : (
            <span />
          )}
          <p className="text-xs text-muted-foreground flex-shrink-0">{date}</p>
        </div>
      </div>
    </div>
  );
};

const BalanceCard = ({ label, amount, isIncome, isExpense }: ParsedBalance) => {
  const getIcon = () => {
    if (isIncome) return <ArrowDownLeft className="w-4 h-4 text-success" />;
    if (isExpense) return <ArrowUpRight className="w-4 h-4 text-destructive" />;
    return <Wallet className="w-4 h-4 text-primary" />;
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50 my-1">
      <div className={cn(
        "w-9 h-9 rounded-full flex items-center justify-center",
        isIncome ? "bg-success/20" : isExpense ? "bg-destructive/20" : "bg-primary/20"
      )}>
        {getIcon()}
      </div>
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className={cn(
          "text-sm font-bold",
          isIncome ? "text-success" : isExpense ? "text-destructive" : "text-foreground"
        )}>
          {amount} AED
        </p>
      </div>
    </div>
  );
};

const formatAmountInText = (text: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  
  const regex = new RegExp(AMOUNT_PATTERN.source, 'gi');
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    
    const amount = match[1];
    const currency = match[2];
    const isPositive = amount.startsWith('+');
    const isNegative = amount.startsWith('-');
    
    parts.push(
      <span 
        key={match.index} 
        className={cn(
          "font-semibold px-1 py-0.5 rounded",
          isPositive ? "text-success bg-success/10" : 
          isNegative ? "text-destructive bg-destructive/10" : 
          "text-primary bg-primary/10"
        )}
      >
        {amount} {currency}
      </span>
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  
  return parts.length > 0 ? parts : [text];
};

export const ChatMessageContent = ({ content }: ChatMessageContentProps) => {
  // Check for transaction lines
  const transactionMatches: ParsedTransaction[] = [];
  let match;
  const txRegex = new RegExp(TRANSACTION_LINE_PATTERN.source, 'gm');
  
  while ((match = txRegex.exec(content)) !== null) {
    transactionMatches.push({
      date: match[1],
      type: match[2].trim(),
      amount: parseFloat(match[3].replace(/[,\s]/g, '')),
      description: match[4] || ''
    });
  }

  // Check for balance lines
  const balanceMatches: ParsedBalance[] = [];
  const balanceRegex = new RegExp(BALANCE_PATTERN.source, 'gi');
  
  while ((match = balanceRegex.exec(content)) !== null) {
    const label = match[1];
    balanceMatches.push({
      label,
      amount: match[2],
      isIncome: /доход|income/i.test(label),
      isExpense: /расход|expense/i.test(label)
    });
  }

  // If we have transactions, render them specially
  if (transactionMatches.length > 0) {
    // Split content by transaction lines and render mixed content
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let currentTextBlock: string[] = [];
    
    lines.forEach((line, idx) => {
      const isTxLine = /^[-•]\s*\d{2}\.\d{2}\.\d{4}:/.test(line);
      
      if (isTxLine) {
        // Flush text block
        if (currentTextBlock.length > 0) {
          elements.push(
            <p key={`text-${idx}`} className="text-sm whitespace-pre-wrap mb-2">
              {formatAmountInText(currentTextBlock.join('\n'))}
            </p>
          );
          currentTextBlock = [];
        }
        
        // Find matching transaction
        const tx = transactionMatches.find(t => line.includes(t.date) && line.includes(t.type));
        if (tx) {
          elements.push(
            <TransactionItem key={`tx-${idx}`} {...tx} />
          );
        }
      } else if (line.trim()) {
        // Check if it's a balance line
        const balanceMatch = balanceMatches.find(b => line.includes(b.label));
        if (balanceMatch && /баланс|balance|доход|income|расход|expense/i.test(line)) {
          if (currentTextBlock.length > 0) {
            elements.push(
              <p key={`text-${idx}`} className="text-sm whitespace-pre-wrap mb-2">
                {formatAmountInText(currentTextBlock.join('\n'))}
              </p>
            );
            currentTextBlock = [];
          }
          elements.push(
            <BalanceCard key={`balance-${idx}`} {...balanceMatch} />
          );
        } else {
          currentTextBlock.push(line);
        }
      } else {
        currentTextBlock.push(line);
      }
    });
    
    // Flush remaining text
    if (currentTextBlock.length > 0) {
      elements.push(
        <p key="text-final" className="text-sm whitespace-pre-wrap">
          {formatAmountInText(currentTextBlock.join('\n'))}
        </p>
      );
    }
    
    return <div className="space-y-1">{elements}</div>;
  }

  // If we have balance info but no transactions
  if (balanceMatches.length > 0) {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let currentTextBlock: string[] = [];
    
    lines.forEach((line, idx) => {
      const balanceMatch = balanceMatches.find(b => line.includes(b.label) && line.includes(b.amount));
      
      if (balanceMatch) {
        if (currentTextBlock.length > 0) {
          elements.push(
            <p key={`text-${idx}`} className="text-sm whitespace-pre-wrap mb-2">
              {formatAmountInText(currentTextBlock.join('\n'))}
            </p>
          );
          currentTextBlock = [];
        }
        elements.push(
          <BalanceCard key={`balance-${idx}`} {...balanceMatch} />
        );
      } else {
        currentTextBlock.push(line);
      }
    });
    
    if (currentTextBlock.length > 0) {
      elements.push(
        <p key="text-final" className="text-sm whitespace-pre-wrap">
          {formatAmountInText(currentTextBlock.join('\n'))}
        </p>
      );
    }
    
    return <div className="space-y-1">{elements}</div>;
  }

  // Default: just highlight amounts in regular text
  return (
    <p className="text-sm whitespace-pre-wrap">
      {formatAmountInText(content)}
    </p>
  );
};

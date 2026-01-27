import { ArrowDownLeft, ArrowUpRight, Wallet, Building2, CreditCard, CircleCheck, Coins } from "lucide-react";
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

const getTransactionIcon = (type: string, isPositive: boolean) => {
  const lower = type.toLowerCase();
  if (lower.includes('банковский') || lower.includes('bank')) {
    return <Building2 className="w-5 h-5 text-white" />;
  }
  if (lower.includes('пополнение') || lower.includes('topup') || lower.includes('top-up')) {
    return <Coins className="w-5 h-5 text-white" />;
  }
  if (lower.includes('карт') || lower.includes('card')) {
    return <CreditCard className="w-5 h-5 text-white" />;
  }
  if (isPositive) {
    return <ArrowDownLeft className="w-5 h-5 text-white" />;
  }
  return <ArrowUpRight className="w-5 h-5 text-white" />;
};

const getIconBgColor = (type: string, isPositive: boolean) => {
  const lower = type.toLowerCase();
  if (lower.includes('банковский') || lower.includes('bank')) {
    return "bg-violet-500";
  }
  if (lower.includes('пополнение') || lower.includes('topup')) {
    return "bg-success";
  }
  if (lower.includes('карт') || lower.includes('card')) {
    return "bg-blue-500";
  }
  return isPositive ? "bg-success" : "bg-violet-500";
};

const TransactionCard = ({ date, type, amount, description }: ParsedTransaction) => {
  const isPositive = amount > 0;
  
  // Extract time from date or use placeholder
  const timeMatch = date.match(/(\d{2}:\d{2})/);
  const displayTime = timeMatch ? timeMatch[1] : date;

  return (
    <div className="flex items-center gap-3 py-3 px-1 my-1">
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0",
        getIconBgColor(type, isPositive)
      )}>
        {getTransactionIcon(type, isPositive)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-foreground leading-tight">{type}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm text-muted-foreground">{displayTime}</span>
          <div className="flex items-center gap-1 text-success">
            <CircleCheck className="w-3.5 h-3.5" />
            <span className="text-sm">Завершено</span>
          </div>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={cn(
          "text-lg font-bold",
          isPositive ? "text-success" : "text-[#007AFF]"
        )}>
          {isPositive ? '+' : '-'}{Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} AED
        </p>
      </div>
    </div>
  );
};

const BalanceCard = ({ label, amount, isIncome, isExpense }: ParsedBalance) => {
  const getIcon = () => {
    if (isIncome) return <ArrowDownLeft className="w-5 h-5 text-white" />;
    if (isExpense) return <ArrowUpRight className="w-5 h-5 text-white" />;
    return <Wallet className="w-5 h-5 text-white" />;
  };

  return (
    <div className="flex items-center gap-3 py-3 px-1 my-1">
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center",
        isIncome ? "bg-success" : isExpense ? "bg-destructive" : "bg-primary"
      )}>
        {getIcon()}
      </div>
      <div className="flex-1">
        <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
        <p className={cn(
          "text-lg font-bold mt-0.5",
          isIncome ? "text-success" : isExpense ? "text-destructive" : "text-foreground"
        )}>
          {amount} <span className="text-sm font-medium text-muted-foreground">AED</span>
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
            <TransactionCard key={`tx-${idx}`} {...tx} />
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

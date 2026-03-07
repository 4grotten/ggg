import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { CreditCard, Wallet, Landmark, Bitcoin, FileDown, Loader2, CheckCircle } from "lucide-react";
import { getAuthToken } from "@/services/api/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { ReactNode } from "react";

interface ChatMessageContentProps {
  content: string;
}

const AMOUNT_PATTERN = /([+-]?\d{1,3}(?:[,\s]?\d{3})*(?:\.\d{1,2})?)\s*(AED|дирхам|USDT|USD)/gi;

const formatAmountInText = (text: string): ReactNode[] => {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  const regex = new RegExp(AMOUNT_PATTERN.source, "gi");
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const amount = match[1];
    const currency = match[2];
    const isPositive = amount.startsWith("+");
    const isNegative = amount.startsWith("-");

    parts.push(
      <span
        key={match.index}
        className={cn(
          "font-bold px-1 py-0.5 rounded",
          isPositive ? "text-success bg-success/10"
            : isNegative ? "text-destructive bg-destructive/10"
            : "text-primary bg-primary/10"
        )}
      >
        {amount} {currency}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length > 0 ? parts : [text];
};

function processChildren(children: ReactNode): ReactNode {
  if (typeof children === "string") return formatAmountInText(children);
  if (Array.isArray(children)) {
    return children.map((child, i) => {
      if (typeof child === "string") {
        const parts = formatAmountInText(child);
        return parts.length === 1 && parts[0] === child ? child : <span key={i}>{parts}</span>;
      }
      return child;
    });
  }
  return children;
}

function extractText(children: ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(extractText).join("");
  if (children && typeof children === "object" && "props" in children) {
    return extractText((children as any).props?.children);
  }
  return "";
}

type CardLineType = 'card' | 'metal_card' | 'bank' | 'crypto' | 'total' | null;

function detectCardLineType(children: ReactNode): CardLineType {
  const text = extractText(children).trim();
  if (/^💰/.test(text) || /итого/i.test(text)) return 'total';
  if (/^🪙|usdt|крипто.*кошел/i.test(text)) return 'crypto';
  if (/^🏦|iban|банк.*счёт|банк.*счет|bank/i.test(text)) return 'bank';
  if (/^💳/.test(text)) {
    return /метал|metal/i.test(text) ? 'metal_card' : 'card';
  }
  return null;
}

const cardLineStyles: Record<Exclude<CardLineType, null>, { bg: string; iconBg: string; icon: typeof CreditCard; iconColor: string }> = {
  card: {
    bg: "bg-muted/80 border border-border/30",
    iconBg: "bg-primary/10",
    icon: CreditCard,
    iconColor: "text-primary",
  },
  metal_card: {
    bg: "bg-muted/80 border border-border/30",
    iconBg: "bg-amber-500/15",
    icon: CreditCard,
    iconColor: "text-amber-500",
  },
  bank: {
    bg: "bg-muted/80 border border-border/30",
    iconBg: "bg-emerald-500/15",
    icon: Landmark,
    iconColor: "text-emerald-500",
  },
  crypto: {
    bg: "bg-muted/80 border border-border/30",
    iconBg: "bg-orange-500/15",
    icon: Bitcoin,
    iconColor: "text-orange-500",
  },
  total: {
    bg: "bg-primary/15 border border-primary/20",
    iconBg: "bg-primary/20",
    icon: Wallet,
    iconColor: "text-primary",
  },
};

const BalanceCard = ({ children, lineType }: { children: ReactNode; lineType: Exclude<CardLineType, null> }) => {
  const style = cardLineStyles[lineType];
  const Icon = style.icon;

  return (
    <div className={cn("my-1.5 px-3 py-3 rounded-xl text-sm leading-relaxed flex items-center gap-3", style.bg)}>
      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", style.iconBg)}>
        <Icon className={cn("w-5 h-5", style.iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        {processChildren(children)}
      </div>
    </div>
  );
};

const markdownComponents = {
  p: ({ children }: { children?: ReactNode }) => {
    const lineType = detectCardLineType(children);
    if (lineType) {
      return <BalanceCard lineType={lineType}>{children}</BalanceCard>;
    }
    return <p className="my-1.5 text-sm leading-relaxed">{processChildren(children)}</p>;
  },
  strong: ({ children }: { children?: ReactNode }) => {
    return <strong className="font-bold text-foreground">{processChildren(children)}</strong>;
  },
  li: ({ children }: { children?: ReactNode }) => {
    return <li className="my-1 text-sm leading-relaxed">{processChildren(children)}</li>;
  },
  ul: ({ children }: { children?: ReactNode }) => {
    return <ul className="my-2 space-y-1 list-none pl-0">{children}</ul>;
  },
  h2: ({ children }: { children?: ReactNode }) => {
    return <h2 className="text-base font-bold mt-3 mb-1.5 text-foreground">{children}</h2>;
  },
  h3: ({ children }: { children?: ReactNode }) => {
    return <h3 className="text-sm font-bold mt-2 mb-1 text-foreground">{children}</h3>;
  },
  hr: () => <hr className="my-2 border-border/40" />,
};

const REPORT_PATTERN = /\[DOWNLOAD_REPORT:([^\]]+)\]/g;

const ReportDownloadButton = ({ dateRange }: { dateRange: string }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const { user } = useAuth();

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("Необходима авторизация");
        return;
      }

      let start_date: string | undefined;
      let end_date: string | undefined;

      if (dateRange !== 'ALL') {
        const parts = dateRange.split(':');
        start_date = parts[0];
        end_date = parts[1];
      }

      const userName = user ? [user.first_name, user.last_name].filter(Boolean).join(' ') : '';

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ backend_token: token, start_date, end_date, user_name: userName }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Ошибка генерации отчёта");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const fileDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      a.download = `EasyCard_Report_${fileDate}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setIsDone(true);
      toast.success("Отчёт скачан!");
    } catch (error) {
      console.error("Report download error:", error);
      toast.error(error instanceof Error ? error.message : "Ошибка скачивания");
    } finally {
      setIsDownloading(false);
    }
  };

  // Format label
  let label = "Скачать отчёт";
  if (dateRange !== 'ALL') {
    const parts = dateRange.split(':');
    if (parts.length === 2) {
      const formatD = (d: string) => {
        const dt = new Date(d);
        return `${dt.getDate().toString().padStart(2, '0')}.${(dt.getMonth() + 1).toString().padStart(2, '0')}.${dt.getFullYear()}`;
      };
      label = `Скачать отчёт (${formatD(parts[0])} — ${formatD(parts[1])})`;
    }
  } else {
    label = "Скачать отчёт за всё время";
  }

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading || isDone}
      className={cn(
        "my-2 w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
        isDone
          ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/20"
          : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 active:scale-[0.98]",
        (isDownloading) && "opacity-70 cursor-wait"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
        isDone ? "bg-emerald-500/15" : "bg-primary/15"
      )}>
        {isDownloading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isDone ? (
          <CheckCircle className="w-5 h-5 text-emerald-500" />
        ) : (
          <FileDown className="w-5 h-5" />
        )}
      </div>
      <span>{isDone ? "Отчёт скачан ✓" : isDownloading ? "Формирую отчёт..." : label}</span>
    </button>
  );
};

export const ChatMessageContent = ({ content }: ChatMessageContentProps) => {
  // Extract report commands and split content
  const reportMatches = [...content.matchAll(REPORT_PATTERN)];
  const cleanContent = content.replace(REPORT_PATTERN, '').trim();
  
  const hasMarkdown = /\*\*|#{1,3}\s|^- /m.test(cleanContent);

  return (
    <div className="text-sm">
      {hasMarkdown ? (
        <ReactMarkdown components={markdownComponents}>{cleanContent}</ReactMarkdown>
      ) : (
        cleanContent && (
          <p className="whitespace-pre-wrap leading-relaxed">
            {formatAmountInText(cleanContent)}
          </p>
        )
      )}
      {reportMatches.map((match, i) => (
        <ReportDownloadButton key={i} dateRange={match[1]} />
      ))}
    </div>
  );
};

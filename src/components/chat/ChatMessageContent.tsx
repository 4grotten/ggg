import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { CreditCard, Wallet } from "lucide-react";
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

function isBalanceLine(children: ReactNode): boolean {
  return /^(💳|💰)/.test(extractText(children).trim());
}

function isTotalLine(children: ReactNode): boolean {
  return /^💰/.test(extractText(children).trim());
}

function isMetalCard(children: ReactNode): boolean {
  const text = extractText(children).toLowerCase();
  return /метал|metal/i.test(text);
}

const BalanceCard = ({ children, isTotal, isMetal }: { children: ReactNode; isTotal: boolean; isMetal: boolean }) => {
  return (
    <div className={cn(
      "my-1.5 px-3 py-3 rounded-xl text-sm leading-relaxed flex items-center gap-3",
      isTotal
        ? "bg-primary/15 border border-primary/20"
        : "bg-muted/80 border border-border/30"
    )}>
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
        isTotal ? "bg-primary/20" : isMetal ? "bg-amber-500/15" : "bg-primary/10"
      )}>
        {isTotal ? (
          <Wallet className={cn("w-5 h-5", "text-primary")} />
        ) : (
          <CreditCard className={cn("w-5 h-5", isMetal ? "text-amber-500" : "text-primary")} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        {processChildren(children)}
      </div>
    </div>
  );
};

const markdownComponents = {
  p: ({ children }: { children?: ReactNode }) => {
    if (isBalanceLine(children)) {
      return (
        <BalanceCard
          isTotal={isTotalLine(children)}
          isMetal={isMetalCard(children)}
        >
          {children}
        </BalanceCard>
      );
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

export const ChatMessageContent = ({ content }: ChatMessageContentProps) => {
  const hasMarkdown = /\*\*|#{1,3}\s|^- /m.test(content);

  if (hasMarkdown) {
    return (
      <div className="text-sm">
        <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
      </div>
    );
  }

  return (
    <p className="text-sm whitespace-pre-wrap leading-relaxed">
      {formatAmountInText(content)}
    </p>
  );
};

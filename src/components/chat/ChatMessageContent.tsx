import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface ChatMessageContentProps {
  content: string;
}

// Regex for detecting financial amounts
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
          isPositive
            ? "text-success bg-success/10"
            : isNegative
              ? "text-destructive bg-destructive/10"
              : "text-primary bg-primary/10"
        )}
      >
        {amount} {currency}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length > 0 ? parts : [text];
};

// Custom renderers for ReactMarkdown that highlight amounts
const markdownComponents = {
  p: ({ children }: { children?: ReactNode }) => {
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

// Process children to find text nodes and highlight amounts
function processChildren(children: ReactNode): ReactNode {
  if (typeof children === "string") {
    return formatAmountInText(children);
  }
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

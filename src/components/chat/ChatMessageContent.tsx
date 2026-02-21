import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface ChatMessageContentProps {
  content: string;
}

export const ChatMessageContent = ({ content }: ChatMessageContentProps) => {
  // Check if content has markdown tables or formatting
  const hasMarkdown = /\|.*\||\*\*|#{1,3}\s/.test(content);

  if (hasMarkdown) {
    return (
      <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-table:text-xs prose-th:px-2 prose-th:py-1.5 prose-td:px-2 prose-td:py-1.5 prose-th:text-left prose-table:border-collapse prose-th:border-b prose-th:border-border prose-td:border-b prose-td:border-border/50 prose-th:font-semibold prose-th:text-muted-foreground prose-p:my-1 prose-headings:my-2 prose-table:my-2 prose-table:w-full prose-hr:my-2">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    );
  }

  // Default: plain text with amount highlighting
  return (
    <p className="text-sm whitespace-pre-wrap">
      {formatAmountInText(content)}
    </p>
  );
};

// Regex for detecting financial amounts
const AMOUNT_PATTERN = /([+-]?\d{1,3}(?:[,\s]?\d{3})*(?:\.\d{1,2})?)\s*(AED|дирхам|USDT|USD)/gi;

const formatAmountInText = (text: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
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
          "font-semibold px-1 py-0.5 rounded",
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

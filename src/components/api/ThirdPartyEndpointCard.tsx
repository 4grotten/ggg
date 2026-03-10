import { useState } from "react";
import { Copy, Check, ChevronDown, ChevronRight, ArrowDownLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { WebhookEndpoint } from "@/data/thirdPartyApiDocs";

interface ThirdPartyEndpointCardProps {
  endpoint: WebhookEndpoint;
  index: number;
}

export const ThirdPartyEndpointCard = ({ endpoint, index }: ThirdPartyEndpointCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(endpoint.exampleJson);
    setCopied(true);
    toast.success("JSON скопирован");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2 shrink-0 mt-0.5">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white bg-blue-500">
            {endpoint.method}
          </span>
          <ArrowDownLeft className="w-3.5 h-3.5 text-green-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground">{endpoint.title}</h4>
          <code className="text-xs text-muted-foreground font-mono break-all">{endpoint.path}</code>
        </div>
        <span className="shrink-0 mt-1">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </span>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
              {/* Description */}
              <p className="text-sm text-muted-foreground">{endpoint.description}</p>

              {/* Fields table */}
              <div className="space-y-2">
                <h5 className="text-xs font-semibold text-foreground uppercase tracking-wider">Body Parameters</h5>
                <div className="space-y-1.5">
                  {endpoint.fields.map((field) => (
                    <div key={field.name} className="p-2.5 rounded-xl bg-muted/50 border border-border/50">
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="text-xs font-mono text-primary font-semibold">{field.name}</code>
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{field.type}</span>
                        {field.required ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 font-medium">required</span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">optional</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{field.description}</p>
                      {field.example && (
                        <code className="text-[11px] text-foreground/60 font-mono mt-1 block">
                          Пример: {field.example}
                        </code>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* JSON Example */}
              <div className="space-y-2">
                <h5 className="text-xs font-semibold text-foreground uppercase tracking-wider">Пример JSON Body</h5>
                <div className="relative rounded-xl overflow-hidden border border-border bg-zinc-900 dark:bg-zinc-950">
                  <pre className="p-4 overflow-x-auto text-xs leading-relaxed">
                    <code className="text-green-400 font-mono whitespace-pre">{endpoint.exampleJson}</code>
                  </pre>
                  <button
                    onClick={handleCopy}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-green-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

import { useState } from "react";
import { Copy, Check, Play, ChevronDown, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ApiEndpoint, ApiParameter, API_BASE_URL } from "@/data/apiDocumentation";
import { useTranslation } from "react-i18next";

interface ApiEndpointDetailProps {
  endpoint: ApiEndpoint;
}

const CodeBlock = ({ 
  code, 
  language = "bash", 
  title 
}: { 
  code: string; 
  language?: string; 
  title?: string;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden border border-border bg-zinc-900 dark:bg-zinc-950">
      {title && (
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 dark:bg-zinc-900 border-b border-zinc-700">
          <span className="text-xs font-medium text-zinc-400">{title}</span>
          <span className="text-xs text-zinc-500">{language}</span>
        </div>
      )}
      <div className="relative">
        <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
          <code className="text-green-400 font-mono whitespace-pre">{code}</code>
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4 text-zinc-400" />
          )}
        </button>
      </div>
    </div>
  );
};

const ParameterTable = ({ 
  params, 
  title 
}: { 
  params: ApiParameter[]; 
  title: string;
}) => {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <div className="space-y-2">
        {params.map((param) => (
          <div 
            key={param.name}
            className="p-3 rounded-xl bg-muted/50 border border-border/50"
          >
            <div className="flex items-center gap-2 mb-1">
              <code className="text-sm font-mono text-primary">{param.name}</code>
              <span className="text-xs text-muted-foreground">{param.type}</span>
              {param.required && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 font-medium">
                  required
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{param.description}</p>
            {param.enum && (
              <div className="mt-2 flex flex-wrap gap-1">
                {param.enum.map((val) => (
                  <code 
                    key={val}
                    className="text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300"
                  >
                    {val}
                  </code>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const getMethodColor = (method: string) => {
  switch (method) {
    case 'GET': return 'bg-green-500';
    case 'POST': return 'bg-blue-500';
    case 'PUT': return 'bg-orange-500';
    case 'DELETE': return 'bg-red-500';
    case 'PATCH': return 'bg-purple-500';
    default: return 'bg-muted-foreground';
  }
};

export const ApiEndpointDetail = ({ endpoint }: ApiEndpointDetailProps) => {
  const { t } = useTranslation();
  const [showTryIt, setShowTryIt] = useState(false);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className={cn(
            "px-3 py-1 rounded-lg text-sm font-bold text-white",
            getMethodColor(endpoint.method)
          )}>
            {endpoint.method}
          </span>
          <code className="text-lg font-mono text-foreground">{endpoint.path}</code>
        </div>
        
        <h1 className="text-2xl font-bold text-foreground">{endpoint.title}</h1>
        <p className="text-muted-foreground">{endpoint.description}</p>
        
        {/* Try it button */}
        <button
          onClick={() => setShowTryIt(!showTryIt)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          <Play className="w-4 h-4" />
          Try it
        </button>
      </div>

      {/* Request Example */}
      {endpoint.requestExample && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Request
          </h3>
          <CodeBlock 
            code={endpoint.requestExample.curl} 
            language="cURL" 
            title="cURL"
          />
          {endpoint.requestExample.json && (
            <CodeBlock 
              code={endpoint.requestExample.json} 
              language="json" 
              title="Request Body"
            />
          )}
        </div>
      )}

      {/* Response Example */}
      {endpoint.responseExample && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Response
            <span className="text-sm font-normal text-muted-foreground">
              {endpoint.responseExample.status}
            </span>
          </h3>
          <CodeBlock 
            code={endpoint.responseExample.json} 
            language="json" 
            title={`${endpoint.responseExample.status} - application/json`}
          />
        </div>
      )}

      {/* Authorization */}
      {endpoint.authorization && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Authorization</h3>
          <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <code className="text-sm font-mono text-primary">Authorization</code>
              <span className="text-xs text-muted-foreground">string</span>
              <span className="text-xs text-muted-foreground">header</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 font-medium">
                required
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{endpoint.authorization.description}</p>
          </div>
        </div>
      )}

      {/* Path Parameters */}
      {endpoint.pathParams && endpoint.pathParams.length > 0 && (
        <ParameterTable params={endpoint.pathParams} title="Path Parameters" />
      )}

      {/* Query Parameters */}
      {endpoint.queryParams && endpoint.queryParams.length > 0 && (
        <ParameterTable params={endpoint.queryParams} title="Query Parameters" />
      )}

      {/* Body Parameters */}
      {endpoint.bodyParams && endpoint.bodyParams.length > 0 && (
        <ParameterTable params={endpoint.bodyParams} title="Body Parameters" />
      )}

      {/* Response Parameters */}
      {endpoint.responseParams && endpoint.responseParams.length > 0 && (
        <ParameterTable params={endpoint.responseParams} title="Response" />
      )}

      {/* Notes */}
      {endpoint.notes && endpoint.notes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Notes</h3>
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <ul className="space-y-2">
              {endpoint.notes.map((note, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  {note}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiEndpointDetail;

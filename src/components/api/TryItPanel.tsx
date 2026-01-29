import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Copy, Check, ChevronDown, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ApiEndpoint, ApiParameter, API_BASE_URL } from "@/data/apiDocumentation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TryItPanelProps {
  endpoint: ApiEndpoint;
  isOpen: boolean;
  onClose: () => void;
}

interface ParamValue {
  [key: string]: string;
}

interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  time: number;
}

const TryItPanel = ({ endpoint, isOpen, onClose }: TryItPanelProps) => {
  const [authToken, setAuthToken] = useState("");
  const [pathParams, setPathParams] = useState<ParamValue>({});
  const [queryParams, setQueryParams] = useState<ParamValue>({});
  const [bodyParams, setBodyParams] = useState<ParamValue>({});
  const [rawBody, setRawBody] = useState("");
  const [useRawBody, setUseRawBody] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [copied, setCopied] = useState(false);

  // Build the full URL with path and query params
  const buildUrl = useMemo(() => {
    let url = API_BASE_URL + endpoint.path;
    
    // Replace path parameters
    if (endpoint.pathParams) {
      endpoint.pathParams.forEach((param) => {
        const value = pathParams[param.name] || `{${param.name}}`;
        url = url.replace(`{${param.name}}`, encodeURIComponent(value));
      });
    }
    
    // Add query parameters
    const queryEntries = Object.entries(queryParams).filter(([_, v]) => v);
    if (queryEntries.length > 0) {
      const queryString = queryEntries
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&");
      url += `?${queryString}`;
    }
    
    return url;
  }, [endpoint, pathParams, queryParams]);

  // Build request body
  const buildBody = useMemo(() => {
    if (useRawBody) {
      return rawBody;
    }
    
    if (!endpoint.bodyParams || endpoint.bodyParams.length === 0) {
      return null;
    }
    
    const body: Record<string, unknown> = {};
    endpoint.bodyParams.forEach((param) => {
      const value = bodyParams[param.name];
      if (value !== undefined && value !== "") {
        // Try to parse as JSON for complex types
        if (param.type === "number") {
          body[param.name] = Number(value);
        } else if (param.type === "boolean") {
          body[param.name] = value === "true";
        } else if (param.type === "array" || param.type === "object") {
          try {
            body[param.name] = JSON.parse(value);
          } catch {
            body[param.name] = value;
          }
        } else {
          body[param.name] = value;
        }
      }
    });
    
    return Object.keys(body).length > 0 ? JSON.stringify(body, null, 2) : null;
  }, [endpoint, bodyParams, rawBody, useRawBody]);

  const handleSendRequest = async () => {
    setIsLoading(true);
    setResponse(null);
    
    const startTime = performance.now();
    
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      if (authToken) {
        headers["Authorization"] = `Token ${authToken}`;
      }
      
      const options: RequestInit = {
        method: endpoint.method,
        headers,
      };
      
      if (["POST", "PUT", "PATCH"].includes(endpoint.method) && buildBody) {
        options.body = buildBody;
      }
      
      const res = await fetch(buildUrl, options);
      const endTime = performance.now();
      
      // Get response headers
      const responseHeaders: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      
      // Get response body
      let responseBody = "";
      try {
        const json = await res.json();
        responseBody = JSON.stringify(json, null, 2);
      } catch {
        responseBody = await res.text();
      }
      
      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        body: responseBody,
        time: Math.round(endTime - startTime),
      });
      
    } catch (error) {
      const endTime = performance.now();
      setResponse({
        status: 0,
        statusText: "Network Error",
        headers: {},
        body: error instanceof Error ? error.message : "Failed to send request",
        time: Math.round(endTime - startTime),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyResponse = async () => {
    if (response) {
      await navigator.clipboard.writeText(response.body);
      setCopied(true);
      toast.success("Response copied");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "text-green-500 bg-green-500/10";
    if (status >= 400 && status < 500) return "text-orange-500 bg-orange-500/10";
    if (status >= 500) return "text-red-500 bg-red-500/10";
    return "text-muted-foreground bg-muted";
  };

  const renderParamInput = (
    param: ApiParameter,
    value: string,
    onChange: (value: string) => void
  ) => {
    if (param.enum) {
      return (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="bg-background">
            <SelectValue placeholder={`Select ${param.name}`} />
          </SelectTrigger>
          <SelectContent>
            {param.enum.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    
    if (param.type === "array" || param.type === "object") {
      return (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${param.type} as JSON`}
          className="font-mono text-sm bg-background min-h-[80px]"
        />
      );
    }
    
    return (
      <Input
        type={param.type === "number" ? "number" : "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={param.description}
        className="bg-background"
      />
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="mt-4 p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Send className="w-4 h-4 text-primary" />
                Try it out
              </h4>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Authorization */}
            {endpoint.authorization && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Authorization Token
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  type="password"
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  placeholder="Enter your token"
                  className="bg-background font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  {endpoint.authorization.description}
                </p>
              </div>
            )}

            {/* Path Parameters */}
            {endpoint.pathParams && endpoint.pathParams.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Path Parameters</Label>
                <div className="space-y-2">
                  {endpoint.pathParams.map((param) => (
                    <div key={param.name} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono text-primary">{param.name}</code>
                        {param.required && (
                          <span className="text-[10px] px-1 py-0.5 rounded bg-red-500/10 text-red-500">
                            required
                          </span>
                        )}
                      </div>
                      {renderParamInput(
                        param,
                        pathParams[param.name] || "",
                        (v) => setPathParams((prev) => ({ ...prev, [param.name]: v }))
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Query Parameters */}
            {endpoint.queryParams && endpoint.queryParams.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Query Parameters</Label>
                <div className="space-y-2">
                  {endpoint.queryParams.map((param) => (
                    <div key={param.name} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono text-primary">{param.name}</code>
                        {param.required && (
                          <span className="text-[10px] px-1 py-0.5 rounded bg-red-500/10 text-red-500">
                            required
                          </span>
                        )}
                      </div>
                      {renderParamInput(
                        param,
                        queryParams[param.name] || "",
                        (v) => setQueryParams((prev) => ({ ...prev, [param.name]: v }))
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Body Parameters */}
            {endpoint.bodyParams && endpoint.bodyParams.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Request Body</Label>
                  <button
                    onClick={() => setUseRawBody(!useRawBody)}
                    className="text-xs text-primary hover:underline"
                  >
                    {useRawBody ? "Use form" : "Use raw JSON"}
                  </button>
                </div>
                
                {useRawBody ? (
                  <Textarea
                    value={rawBody}
                    onChange={(e) => setRawBody(e.target.value)}
                    placeholder='{"key": "value"}'
                    className="font-mono text-sm bg-background min-h-[120px]"
                  />
                ) : (
                  <div className="space-y-2">
                    {endpoint.bodyParams.map((param) => (
                      <div key={param.name} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono text-primary">{param.name}</code>
                          <span className="text-[10px] text-muted-foreground">{param.type}</span>
                          {param.required && (
                            <span className="text-[10px] px-1 py-0.5 rounded bg-red-500/10 text-red-500">
                              required
                            </span>
                          )}
                        </div>
                        {renderParamInput(
                          param,
                          bodyParams[param.name] || "",
                          (v) => setBodyParams((prev) => ({ ...prev, [param.name]: v }))
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Request URL Preview */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Request URL</Label>
              <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-700 overflow-x-auto">
                <code className="text-sm text-green-400 font-mono whitespace-nowrap">
                  {endpoint.method} {buildUrl}
                </code>
              </div>
            </div>

            {/* Body Preview */}
            {buildBody && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Request Body</Label>
                <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-700 overflow-x-auto">
                  <pre className="text-sm text-green-400 font-mono whitespace-pre">
                    {buildBody}
                  </pre>
                </div>
              </div>
            )}

            {/* Send Button */}
            <Button
              onClick={handleSendRequest}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Request
                </>
              )}
            </Button>

            {/* Response */}
            {response && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-foreground">Response</h4>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-lg text-sm font-medium",
                        getStatusColor(response.status)
                      )}
                    >
                      {response.status} {response.statusText}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {response.time}ms
                    </span>
                  </div>
                  <button
                    onClick={handleCopyResponse}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
                
                <div className="rounded-xl overflow-hidden border border-border bg-zinc-900">
                  <div className="p-3 bg-zinc-800 border-b border-zinc-700 flex items-center justify-between">
                    <span className="text-xs text-zinc-400">Response Body</span>
                    <span className="text-xs text-zinc-500">application/json</span>
                  </div>
                  <pre className="p-4 overflow-x-auto text-sm leading-relaxed max-h-[400px] overflow-y-auto">
                    <code className="text-green-400 font-mono whitespace-pre">
                      {response.body}
                    </code>
                  </pre>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TryItPanel;

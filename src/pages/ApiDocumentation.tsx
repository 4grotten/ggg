import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { ArrowLeft, Copy, Check, Code, Key, Globe, Shield, Zap, Book, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
}

const CodeBlock = ({ code, language = "bash", title }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden border border-border/50 bg-zinc-900 dark:bg-zinc-950">
      {title && (
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 dark:bg-zinc-900 border-b border-border/30">
          <span className="text-xs font-medium text-zinc-400">{title}</span>
          <span className="text-xs text-zinc-500">{language}</span>
        </div>
      )}
      <div className="relative">
        <pre className="p-4 overflow-x-auto text-sm">
          <code className="text-green-400 font-mono">{code}</code>
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
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

interface ApiSectionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
}

const ApiSection = ({ icon, title, description, children }: ApiSectionProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-muted/70 dark:bg-card/70 backdrop-blur-xl rounded-2xl overflow-hidden border border-border/50 p-4 space-y-4"
  >
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
    {children}
  </motion.div>
);

const ApiDocumentation = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const baseUrl = "https://api.easycard.ae/v1";

  return (
    <MobileLayout
      header={
        <div className="flex items-center justify-between w-full px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/settings")}
              className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold">{t("settings.apiDocumentation")}</h1>
          </div>
        </div>
      }
    >
      <div className="px-4 pb-8 space-y-4">
        {/* Introduction */}
        <ApiSection
          icon={<Book className="w-5 h-5 text-primary" />}
          title={t("api.introduction.title")}
          description={t("api.introduction.description")}
        >
          <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-xl">
            <Globe className="w-4 h-4 text-primary" />
            <span className="text-sm font-mono text-primary">{baseUrl}</span>
          </div>
        </ApiSection>

        {/* Authentication */}
        <ApiSection
          icon={<Key className="w-5 h-5 text-primary" />}
          title={t("api.authentication.title")}
          description={t("api.authentication.description")}
        >
          <CodeBlock
            title="Header"
            language="http"
            code={`Authorization: Bearer YOUR_API_KEY
Content-Type: application/json`}
          />
        </ApiSection>

        {/* Get Balance */}
        <ApiSection
          icon={<Zap className="w-5 h-5 text-primary" />}
          title={t("api.endpoints.balance.title")}
          description={t("api.endpoints.balance.description")}
        >
          <CodeBlock
            title="Request"
            language="bash"
            code={`GET ${baseUrl}/balance

curl -X GET "${baseUrl}/balance" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
          />
          <CodeBlock
            title="Response"
            language="json"
            code={`{
  "success": true,
  "data": {
    "balance": 1250.50,
    "currency": "AED",
    "available": 1200.00,
    "pending": 50.50
  }
}`}
          />
        </ApiSection>

        {/* Get Cards */}
        <ApiSection
          icon={<Code className="w-5 h-5 text-primary" />}
          title={t("api.endpoints.cards.title")}
          description={t("api.endpoints.cards.description")}
        >
          <CodeBlock
            title="Request"
            language="bash"
            code={`GET ${baseUrl}/cards

curl -X GET "${baseUrl}/cards" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
          />
          <CodeBlock
            title="Response"
            language="json"
            code={`{
  "success": true,
  "data": [
    {
      "id": "card_abc123",
      "type": "virtual",
      "last4": "4242",
      "status": "active",
      "balance": 500.00
    }
  ]
}`}
          />
        </ApiSection>

        {/* Create Transaction */}
        <ApiSection
          icon={<Zap className="w-5 h-5 text-primary" />}
          title={t("api.endpoints.transaction.title")}
          description={t("api.endpoints.transaction.description")}
        >
          <CodeBlock
            title="Request"
            language="bash"
            code={`POST ${baseUrl}/transactions

curl -X POST "${baseUrl}/transactions" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 100.00,
    "currency": "AED",
    "recipient": "card_xyz789",
    "description": "Payment"
  }'`}
          />
          <CodeBlock
            title="Response"
            language="json"
            code={`{
  "success": true,
  "data": {
    "id": "txn_def456",
    "status": "completed",
    "amount": 100.00,
    "fee": 0.50,
    "created_at": "2024-01-15T10:30:00Z"
  }
}`}
          />
        </ApiSection>

        {/* Rate Limits */}
        <ApiSection
          icon={<Shield className="w-5 h-5 text-primary" />}
          title={t("api.rateLimits.title")}
          description={t("api.rateLimits.description")}
        >
          <div className="space-y-2">
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-xl">
              <span className="text-sm text-muted-foreground">{t("api.rateLimits.requests")}</span>
              <span className="text-sm font-medium">1000 / {t("api.rateLimits.hour")}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-xl">
              <span className="text-sm text-muted-foreground">{t("api.rateLimits.burst")}</span>
              <span className="text-sm font-medium">100 / {t("api.rateLimits.minute")}</span>
            </div>
          </div>
        </ApiSection>

        {/* Full Documentation Link */}
        <motion.a
          href="https://docs.easycard.ae"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-4 bg-primary/10 rounded-2xl border border-primary/20 hover:bg-primary/15 transition-colors"
        >
          <div className="flex items-center gap-3">
            <ExternalLink className="w-5 h-5 text-primary" />
            <span className="font-medium text-primary">{t("api.fullDocumentation")}</span>
          </div>
          <ArrowLeft className="w-5 h-5 text-primary rotate-180" />
        </motion.a>
      </div>
    </MobileLayout>
  );
};

export default ApiDocumentation;

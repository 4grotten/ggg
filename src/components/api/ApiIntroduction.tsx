import { motion } from "framer-motion";
import { Key, Globe, Zap, Shield, Book, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "@/data/apiDocumentation";

export const ApiIntroduction = () => {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <h1 className="text-3xl font-bold text-foreground">
          {t("api.introduction.title")}
        </h1>
        <p className="text-lg text-muted-foreground">
          {t("api.introduction.description")}
        </p>
      </motion.div>

      {/* Base URL */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-4 rounded-xl bg-primary/5 border border-primary/20"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Globe className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Base URL</p>
            <code className="text-lg font-mono text-primary">{API_BASE_URL}</code>
          </div>
        </div>
      </motion.div>

      {/* Getting Started Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <h2 className="text-xl font-semibold text-foreground">Get Started in 3 Steps</h2>
        
        <div className="grid gap-4">
          {[
            {
              step: 1,
              title: "Get your API Key",
              description: "Sign up for an EasyCard account and generate your API key from the dashboard.",
              icon: Key
            },
            {
              step: 2,
              title: "Make your first request",
              description: "Use your API key to authenticate and make requests to our endpoints.",
              icon: Zap
            },
            {
              step: 3,
              title: "Go live",
              description: "Switch from test mode to production and start processing real transactions.",
              icon: Shield
            }
          ].map((item) => (
            <div 
              key={item.step}
              className="flex gap-4 p-4 rounded-xl bg-muted/50 border border-border/50"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-lg font-bold text-primary">{item.step}</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Authentication */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        <h2 className="text-xl font-semibold text-foreground">
          {t("api.authentication.title")}
        </h2>
        <p className="text-muted-foreground">
          {t("api.authentication.description")}
        </p>
        
        <div className="rounded-xl overflow-hidden border border-border bg-zinc-900 dark:bg-zinc-950">
          <div className="px-4 py-2 bg-zinc-800 dark:bg-zinc-900 border-b border-zinc-700">
            <span className="text-xs font-medium text-zinc-400">HTTP Header</span>
          </div>
          <pre className="p-4 overflow-x-auto text-sm">
            <code className="text-green-400 font-mono">
{`Authorization: Bearer YOUR_API_KEY
Content-Type: application/json`}
            </code>
          </pre>
        </div>
      </motion.div>

      {/* Rate Limits */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-4"
      >
        <h2 className="text-xl font-semibold text-foreground">
          {t("api.rateLimits.title")}
        </h2>
        <p className="text-muted-foreground">
          {t("api.rateLimits.description")}
        </p>
        
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
            <p className="text-sm text-muted-foreground">{t("api.rateLimits.requests")}</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              1,000 <span className="text-sm font-normal text-muted-foreground">/ {t("api.rateLimits.hour")}</span>
            </p>
          </div>
          <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
            <p className="text-sm text-muted-foreground">{t("api.rateLimits.burst")}</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              100 <span className="text-sm font-normal text-muted-foreground">/ {t("api.rateLimits.minute")}</span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Error Handling */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-4"
      >
        <h2 className="text-xl font-semibold text-foreground">Error Handling</h2>
        <p className="text-muted-foreground">
          The API uses conventional HTTP response codes to indicate the success or failure of requests.
        </p>
        
        <div className="space-y-2">
          {[
            { code: "200", desc: "OK - Request succeeded" },
            { code: "201", desc: "Created - Resource created successfully" },
            { code: "400", desc: "Bad Request - Invalid parameters" },
            { code: "401", desc: "Unauthorized - Invalid or missing API key" },
            { code: "403", desc: "Forbidden - Insufficient permissions" },
            { code: "404", desc: "Not Found - Resource doesn't exist" },
            { code: "429", desc: "Too Many Requests - Rate limit exceeded" },
            { code: "500", desc: "Server Error - Something went wrong" }
          ].map((item) => (
            <div 
              key={item.code}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/30"
            >
              <code className={`px-2 py-1 rounded text-sm font-mono ${
                item.code.startsWith('2') ? 'bg-green-500/10 text-green-500' :
                item.code.startsWith('4') ? 'bg-orange-500/10 text-orange-500' :
                'bg-red-500/10 text-red-500'
              }`}>
                {item.code}
              </code>
              <span className="text-sm text-muted-foreground">{item.desc}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Full Documentation Link */}
      <motion.a
        href="https://docs.easycard.ae"
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex items-center justify-between p-4 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Book className="w-5 h-5 text-primary" />
          <span className="font-medium text-primary">{t("api.fullDocumentation")}</span>
        </div>
        <ExternalLink className="w-5 h-5 text-primary" />
      </motion.a>
    </div>
  );
};

export default ApiIntroduction;

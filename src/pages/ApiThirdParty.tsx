import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { ThirdPartyEndpointCard } from "@/components/api/ThirdPartyEndpointCard";
import { thirdPartyTabs, WEBHOOK_BASE_URL } from "@/data/thirdPartyApiDocs";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Copy, Check, Shield, Webhook } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ApiThirdParty = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const handleCopyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    toast.success("URL скопирован");
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <MobileLayout
      showBackButton
      onBack={() => navigate("/settings")}
      title={t("settings.apiThirdParty")}
      rightAction={<LanguageSwitcher />}
    >
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Webhook className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Webhook Integrations</h1>
              <p className="text-xs text-muted-foreground">Incoming webhooks от сторонних провайдеров</p>
            </div>
          </div>

          {/* Auth info */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-600 dark:text-amber-400 space-y-1">
                <p className="font-semibold">Аутентификация Webhook</p>
                <p>Все входящие webhook запросы должны содержать заголовок <code className="px-1 py-0.5 rounded bg-amber-500/10 font-mono">X-Webhook-Secret</code> с секретным ключом, выданным при подключении провайдера. Запросы без валидного секрета будут отклонены с кодом 401.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="banks" className="w-full">
          <TabsList className="w-full grid grid-cols-3 h-auto p-1">
            {thirdPartyTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-1.5 text-xs py-2 data-[state=active]:bg-background"
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{t(tab.titleKey, tab.id)}</span>
                <span className="sm:hidden">{tab.icon === "🏦" ? "Банки" : tab.icon === "💳" ? "Карты" : "Крипто"}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {thirdPartyTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="space-y-4 mt-4">
              {/* Tab description + webhook URL */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                <p className="text-sm text-muted-foreground">{tab.description}</p>
                
                {/* Webhook base URL */}
                <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border border-border/50">
                  <code className="text-xs font-mono text-foreground flex-1 break-all">{tab.webhookUrl}</code>
                  <button
                    onClick={() => handleCopyUrl(tab.webhookUrl)}
                    className="shrink-0 p-1.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    {copiedUrl === tab.webhookUrl ? (
                      <Check className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </button>
                </div>

                {/* Binding flow */}
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <p className="text-xs font-semibold text-foreground mb-1.5">Как происходит привязка:</p>
                  <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Провайдер регистрируется в нашей системе и получает <code className="px-1 py-0.5 rounded bg-muted font-mono">webhook_secret</code></li>
                    <li>Пользователь авторизуется на стороне провайдера и даёт consent</li>
                    <li>Провайдер отправляет webhook с данными + <code className="px-1 py-0.5 rounded bg-muted font-mono">user_phone</code></li>
                    <li>Мы матчим <code className="px-1 py-0.5 rounded bg-muted font-mono">user_phone</code> с аккаунтом в нашей системе</li>
                    <li>Счёт/карта/кошелёк привязывается к пользователю</li>
                  </ol>
                </div>
              </motion.div>

              {/* Endpoints */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Endpoints ({tab.endpoints.length})
                </h3>
                {tab.endpoints.map((endpoint, i) => (
                  <ThirdPartyEndpointCard key={endpoint.id} endpoint={endpoint} index={i} />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </MobileLayout>
  );
};

export default ApiThirdParty;

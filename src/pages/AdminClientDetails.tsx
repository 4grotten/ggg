import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Phone, CreditCard, TrendingUp, Percent, Shield, Award, Save, ArrowUpDown, CheckCircle, Crown, Sparkles, RefreshCw, Mail, Globe, User, Wallet, Landmark, Bitcoin, Receipt, ChevronDown, ChevronUp } from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ThemeSwitcher } from "@/components/dashboard/ThemeSwitcher";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { apiRequest } from "@/services/api/apiClient";
import { BackendClientDetail } from "@/hooks/useAdminManagement";

// Referral levels configuration
const REFERRAL_LEVELS = [
  { id: "R1", name: "R1", icon: "🌱", color: "from-gray-400 to-gray-500", cardPercent: 15, txPercent: 0.05, minFriends: 0, maxFriends: 10, descKey: "r1Desc" },
  { id: "R2", name: "R2", icon: "🌿", color: "from-lime-400 to-lime-500", cardPercent: 20, txPercent: 0.1, minFriends: 10, maxFriends: 30, descKey: "r2Desc" },
  { id: "R3", name: "R3", icon: "💎", color: "from-blue-400 to-blue-500", cardPercent: 25, txPercent: 0.2, minFriends: 30, maxFriends: 50, descKey: "r3Desc" },
  { id: "R4", name: "R4", icon: "👑", color: "from-purple-400 to-purple-500", cardPercent: 30, txPercent: 0.3, minFriends: 50, maxFriends: 100, descKey: "r4Desc" },
  { id: "Partner", name: "Partner", icon: "🚀", color: "from-amber-400 to-amber-500", cardPercent: 35, txPercent: 0.5, minFriends: 100, maxFriends: Infinity, descKey: "partnerDesc" },
];

const SUBSCRIPTION_TYPES = [
  { id: "free", icon: "🆓", color: "from-gray-400 to-gray-500", nameKey: "free", descKey: "freeDesc" },
  { id: "standard", icon: "⭐", color: "from-blue-400 to-blue-500", nameKey: "standard", descKey: "standardDesc" },
  { id: "premium", icon: "💎", color: "from-purple-400 to-purple-500", nameKey: "premium", descKey: "premiumDesc" },
  { id: "vip", icon: "👑", color: "from-amber-400 to-amber-500", nameKey: "vip", descKey: "vipDesc" },
];

const TX_TYPE_LABELS: Record<string, string> = {
  topup: "Top Up", card_to_card: "Card → Card", bank_withdrawal: "Bank Withdrawal",
  crypto_to_card: "Crypto → Card", card_to_iban: "Card → IBAN", crypto_to_iban: "Crypto → IBAN",
  bank_topup: "Bank Top Up", crypto_topup: "Crypto Top Up", transfer_in: "Transfer In",
  transfer_out: "Transfer Out", card_payment: "Card Payment", fee: "Fee",
};

export default function AdminClientDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const navState = location.state as { clientUserId?: string; clientPreview?: any } | null;
  const clientUserId = navState?.clientUserId;

  // Fetch full client detail from backend
  const { data: client, isLoading } = useQuery({
    queryKey: ["admin-client-detail", clientUserId],
    queryFn: async () => {
      if (!clientUserId) throw new Error("No user ID");
      const res = await apiRequest<BackendClientDetail>(`/admin/users/${clientUserId}/detail/`);
      if (res.error || !res.data) throw new Error(res.error?.detail || "Failed");
      return res.data;
    },
    enabled: !!clientUserId,
  });

  const [selectedLevel, setSelectedLevel] = useState("R1");
  const [selectedSubscription, setSelectedSubscription] = useState("free");
  const [isVIP, setIsVIP] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showAllTx, setShowAllTx] = useState(false);

  const [limits, setLimits] = useState({
    dailyTopUp: "50000", monthlyTopUp: "500000",
    dailyTransfer: "25000", monthlyTransfer: "250000",
    dailyWithdraw: "20000", monthlyWithdraw: "200000",
    singleTransaction: "10000",
  });

  const [fees, setFees] = useState({
    topUpPercent: "2.5", transferPercent: "1.5",
    withdrawPercent: "2.0", conversionPercent: "1.0",
  });

  const [rates, setRates] = useState({
    usdtAedBuy: "3.65", usdtAedSell: "3.69",
    aedUsdBuy: "0.2723", aedUsdSell: "0.2715",
    usdAedBuy: "3.68", usdAedSell: "3.67",
  });

  const handleSave = () => {
    toast.success(t("admin.clients.settingsSaved"));
    navigate(-1);
  };

  if (!clientUserId) {
    navigate("/settings/admin/clients");
    return null;
  }

  if (isLoading) {
    return (
      <MobileLayout title={t("admin.clients.settingsTitle")} showBackButton onBack={() => navigate(-1)}>
        <div className="px-4 pt-4 space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
      </MobileLayout>
    );
  }

  if (!client) {
    return (
      <MobileLayout title={t("admin.clients.settingsTitle")} showBackButton onBack={() => navigate(-1)}>
        <div className="px-4 pt-20 text-center text-muted-foreground">Клиент не найден</div>
      </MobileLayout>
    );
  }

  const displayedTx = showAllTx ? client.transactions : client.transactions?.slice(0, 5);

  return (
    <MobileLayout
      title={client.full_name || t("admin.clients.settingsTitle")}
      showBackButton
      onBack={() => navigate(-1)}
      rightAction={
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      }
    >
      <div className="px-4 pb-8 pt-4 space-y-6">
        {/* Client Header Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-muted/30 border border-border/50 p-4">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary" />
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg ring-2 ring-primary/20">
                {client.avatar_url ? (
                  <img src={client.avatar_url} alt={client.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold text-xl">
                    {(client.full_name || "?").charAt(0)}
                  </div>
                )}
              </div>
              {client.is_verified && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg truncate">{client.full_name}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-3.5 h-3.5" />
                <span>{client.phone}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                {isVIP && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] px-2 py-0.5 border-0">
                    <Crown className="w-3 h-3 mr-1" /> VIP
                  </Badge>
                )}
                {isBlocked && (
                  <Badge variant="destructive" className="text-[10px] px-2 py-0.5">
                    {t("admin.clients.blocked")}
                  </Badge>
                )}
                <Badge variant="outline" className="text-[10px] px-2 py-0.5 capitalize">
                  {client.role}
                </Badge>
              </div>
            </div>
          </div>

          {/* Additional info row */}
          <div className="mt-4 pt-3 border-t border-border/30 grid grid-cols-2 gap-3">
            {client.email && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="w-3.5 h-3.5 text-primary" />
                <span className="truncate">{client.email}</span>
              </div>
            )}
            {client.gender && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <User className="w-3.5 h-3.5 text-primary" />
                <span className="capitalize">{client.gender}</span>
              </div>
            )}
            {client.language && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Globe className="w-3.5 h-3.5 text-primary" />
                <span className="uppercase">{client.language}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>ID: {client.user_id}</span>
            </div>
          </div>
        </div>

        {/* Quick Status Toggles */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium">{t("admin.clients.vipStatus")}</span>
            </div>
            <Switch checked={isVIP} onCheckedChange={setIsVIP} />
          </div>
          <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-destructive" />
              <span className="text-sm font-medium">{t("admin.clients.blockStatus")}</span>
            </div>
            <Switch checked={isBlocked} onCheckedChange={setIsBlocked} />
          </div>
        </div>

        {/* Cards List */}
        {client.cards && client.cards.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">{t("admin.clients.cards") || "Карты"}</h4>
              <Badge variant="secondary" className="text-[10px]">{client.cards.length}</Badge>
            </div>
            <div className="space-y-2">
              {client.cards.map((card) => (
                <div key={card.id} className="p-3 rounded-xl bg-muted/30 border border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-lg",
                      card.type === 'metal' ? "bg-gradient-to-br from-gray-600 to-gray-800" : "bg-gradient-to-br from-blue-500 to-blue-700"
                    )}>
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{card.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        •••• {card.last_four_digits || "****"} · <span className="capitalize">{card.status}</span>
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-emerald-500">{card.balance.toLocaleString()} AED</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bank Accounts */}
        {client.accounts && client.accounts.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Landmark className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">{t("admin.clients.bankAccounts") || "Банк. счета"}</h4>
              <Badge variant="secondary" className="text-[10px]">{client.accounts.length}</Badge>
            </div>
            <div className="space-y-2">
              {client.accounts.map((acc) => (
                <div key={acc.id} className="p-3 rounded-xl bg-muted/30 border border-border/50 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{acc.bank_name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{acc.iban}</p>
                    <p className="text-[10px] text-muted-foreground">{acc.beneficiary}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-500">{acc.balance.toLocaleString()} AED</p>
                    <Badge variant={acc.is_active ? "default" : "destructive"} className="text-[10px]">
                      {acc.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Crypto Wallets */}
        {client.wallets && client.wallets.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Bitcoin className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">{t("admin.clients.cryptoWallets") || "Крипто кошельки"}</h4>
              <Badge variant="secondary" className="text-[10px]">{client.wallets.length}</Badge>
            </div>
            <div className="space-y-2">
              {client.wallets.map((w) => (
                <div key={w.id} className="p-3 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{w.token} ({w.network})</p>
                      <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[200px]">{w.address}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-500">{w.balance.toLocaleString()} {w.token}</p>
                      <Badge variant={w.is_active ? "default" : "destructive"} className="text-[10px]">
                        {w.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transaction History */}
        {client.transactions && client.transactions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">{t("admin.clients.transactionHistory") || "История транзакций"}</h4>
              <Badge variant="secondary" className="text-[10px]">{client.transactions.length}</Badge>
            </div>
            <div className="space-y-1.5">
              {displayedTx?.map((tx) => (
                <div key={tx.id} className="p-3 rounded-xl bg-muted/30 border border-border/50 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {TX_TYPE_LABELS[tx.type] || tx.type}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {tx.description || tx.merchant_name || tx.receiver_name || tx.sender_name || "—"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(tx.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className={cn("text-sm font-bold",
                      tx.type.includes("in") || tx.type.includes("topup") || tx.type.includes("top_up") || tx.type === "refund" || tx.type === "cashback"
                        ? "text-emerald-500" : "text-destructive"
                    )}>
                      {tx.type.includes("in") || tx.type.includes("topup") || tx.type.includes("top_up") ? "+" : "-"}{tx.amount.toLocaleString()} {tx.currency}
                    </p>
                    <Badge variant={tx.status === "completed" ? "default" : tx.status === "pending" ? "secondary" : "destructive"} className="text-[8px]">
                      {tx.status}
                    </Badge>
                    {tx.fee != null && tx.fee > 0 && (
                      <p className="text-[10px] text-muted-foreground">Fee: {tx.fee} {tx.currency}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {client.transactions.length > 5 && (
              <Button variant="ghost" size="sm" className="w-full" onClick={() => setShowAllTx(!showAllTx)}>
                {showAllTx ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                {showAllTx ? "Свернуть" : `Показать все (${client.transactions.length})`}
              </Button>
            )}
          </div>
        )}

        {/* Subscription Type */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h4 className="font-semibold">{t("admin.clients.subscriptionType")}</h4>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {SUBSCRIPTION_TYPES.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setSelectedSubscription(sub.id)}
                className={cn(
                  "relative p-3 rounded-xl border-2 transition-all duration-200 text-left",
                  selectedSubscription === sub.id
                    ? "border-primary bg-primary/10"
                    : "border-border/50 bg-muted/30 hover:border-border"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-xl shrink-0", sub.color)}>
                    {sub.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm">{t(`admin.clients.subscriptions.${sub.nameKey}`)}</span>
                      {selectedSubscription === sub.id && <CheckCircle className="w-3.5 h-3.5 text-primary" />}
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">{t(`admin.clients.subscriptions.${sub.descKey}`)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Referral Level */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            <h4 className="font-semibold">{t("admin.clients.referralLevel")}</h4>
          </div>
          <div className="space-y-2">
            {REFERRAL_LEVELS.map((level) => (
              <button
                key={level.id}
                onClick={() => setSelectedLevel(level.id)}
                className={cn(
                  "relative w-full p-4 rounded-2xl border-2 transition-all duration-200 text-left",
                  selectedLevel === level.id
                    ? "border-primary bg-primary/10"
                    : "border-border/50 bg-muted/30 hover:border-border"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn("w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center text-2xl shrink-0", level.color)}>
                    {level.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm">{level.name}</span>
                      {selectedLevel === level.id && (
                        <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0">
                          {t("admin.clients.current")}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{t(`admin.clients.levels.${level.descKey}`)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 justify-end">
                      <CreditCard className="w-3 h-3 text-primary" />
                      <span className="text-sm font-bold text-primary">{level.cardPercent}%</span>
                    </div>
                    <div className="flex items-center gap-1 justify-end mt-0.5">
                      <TrendingUp className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{level.txPercent}%</span>
                    </div>
                  </div>
                  {selectedLevel === level.id && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <CheckCircle className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <div className="mt-2 pt-2 border-t border-border/30 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{t("admin.clients.friendsRequired")}: {level.minFriends}{level.maxFriends !== Infinity ? `–${level.maxFriends}` : '+'}</span>
                  <span>Card {level.cardPercent}% · TX {level.txPercent}%</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Personal Fees */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Percent className="w-5 h-5 text-primary" />
            <h4 className="font-semibold">{t("admin.clients.personalFees")}</h4>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "topUpPercent", label: t("admin.clients.topUp") },
              { key: "transferPercent", label: t("admin.clients.transfers") },
              { key: "withdrawPercent", label: t("admin.clients.withdrawal") },
              { key: "conversionPercent", label: t("admin.clients.conversion") },
            ].map(({ key, label }) => (
              <div key={key} className="space-y-2">
                <Label className="text-xs text-muted-foreground">{label}</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={fees[key as keyof typeof fees]}
                    onChange={(e) => setFees({ ...fees, [key]: e.target.value })}
                    className="pr-8 rounded-xl"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Personal Exchange Rates */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            <h4 className="font-semibold">{t("admin.clients.personalRates")}</h4>
          </div>
          <div className="space-y-3">
            {[
              { pair: "USDT → AED", buyKey: "usdtAedBuy", sellKey: "usdtAedSell" },
              { pair: "AED → USD", buyKey: "aedUsdBuy", sellKey: "aedUsdSell" },
              { pair: "USD → AED", buyKey: "usdAedBuy", sellKey: "usdAedSell" },
            ].map(({ pair, buyKey, sellKey }) => (
              <div key={pair} className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{pair}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-muted-foreground">{t("admin.clients.buyRate")}</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={rates[buyKey as keyof typeof rates]}
                      onChange={(e) => setRates({ ...rates, [buyKey]: e.target.value })}
                      className="text-xs rounded-xl h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-muted-foreground">{t("admin.clients.sellRate")}</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={rates[sellKey as keyof typeof rates]}
                      onChange={(e) => setRates({ ...rates, [sellKey]: e.target.value })}
                      className="text-xs rounded-xl h-9"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Personal Limits */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-5 h-5 text-primary" />
            <h4 className="font-semibold">{t("admin.clients.personalLimits")}</h4>
          </div>

          <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("admin.clients.dailyLimits")}</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: "dailyTopUp", label: t("admin.clients.topUp") },
                { key: "dailyTransfer", label: t("admin.clients.transfers") },
                { key: "dailyWithdraw", label: t("admin.clients.withdrawal") },
              ].map(({ key, label }) => (
                <div key={key} className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground">{label}</Label>
                  <div className="relative">
                    <Input type="number" value={limits[key as keyof typeof limits]} onChange={(e) => setLimits({ ...limits, [key]: e.target.value })} className="text-xs pr-10 rounded-xl h-9" />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">AED</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("admin.clients.monthlyLimits")}</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: "monthlyTopUp", label: t("admin.clients.topUp") },
                { key: "monthlyTransfer", label: t("admin.clients.transfers") },
                { key: "monthlyWithdraw", label: t("admin.clients.withdrawal") },
              ].map(({ key, label }) => (
                <div key={key} className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground">{label}</Label>
                  <div className="relative">
                    <Input type="number" value={limits[key as keyof typeof limits]} onChange={(e) => setLimits({ ...limits, [key]: e.target.value })} className="text-xs pr-10 rounded-xl h-9" />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">AED</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("admin.clients.transactionLimit")}</p>
            <div className="relative">
              <Input type="number" value={limits.singleTransaction} onChange={(e) => setLimits({ ...limits, singleTransaction: e.target.value })} className="pr-12 rounded-xl" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">AED</span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold"
        >
          <Save className="w-5 h-5 mr-2" />
          {t("admin.clients.saveChanges")}
        </Button>
      </div>
    </MobileLayout>
  );
}

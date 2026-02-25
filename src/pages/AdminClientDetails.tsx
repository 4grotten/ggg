import { useState, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ThemeSwitcher } from "@/components/dashboard/ThemeSwitcher";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { apiRequest } from "@/services/api/apiClient";
import { BackendClientDetail } from "@/hooks/useAdminManagement";
import { CardTransactionsList } from "@/components/card/CardTransactionsList";
import { Transaction as AppTransaction, TransactionGroup as AppTransactionGroup } from "@/types/transaction";
import { format } from "date-fns";

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

const isIncomeTx = (type: string): boolean => {
  const t = type.toLowerCase();
  return t.includes("topup") || t.includes("top_up") || t.includes("transfer_in") ||
    t.includes("incoming") || t === "refund" || t === "cashback" || t.includes("deposit");
};

const mapTypeToAppType = (type: string): AppTransaction["type"] => {
  const t = type.toLowerCase();
  if (t === "topup" || t === "top_up" || t === "bank_topup" || t === "crypto_topup") return "topup";
  if (t === "card_to_card" || t === "card_transfer") return "card_transfer";
  if (t === "bank_withdrawal" || t === "bank_transfer") return "bank_transfer";
  if (t === "bank_transfer_incoming" || t === "transfer_in") return "bank_transfer_incoming";
  if (t === "crypto_to_card") return "crypto_to_card";
  if (t === "crypto_to_iban" || t === "card_to_iban") return "crypto_to_iban" as any;
  if (t === "crypto_to_crypto") return "crypto_withdrawal";
  if (t === "crypto_withdrawal" || t === "crypto_send") return "crypto_withdrawal";
  if (t === "crypto_deposit") return "crypto_deposit";
  if (t === "card_activation") return "card_activation" as any;
  if (t === "card_payment" || t === "payment") return "payment";
  if (t === "fee") return "payment";
  if (t === "refund" || t === "cashback") return "topup";
  return "payment";
};

export default function AdminClientDetails() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { t } = useTranslation();

  // Fetch full client detail from backend
  const { data: client, isLoading } = useQuery({
    queryKey: ["admin-client-detail", userId],
    queryFn: async () => {
      if (!userId) throw new Error("No user ID");
      const res = await apiRequest<BackendClientDetail>(`/admin/users/${userId}/detail/`);
      if (res.error || !res.data) throw new Error(res.error?.detail || "Failed");
      return res.data;
    },
    enabled: !!userId,
  });

  const [selectedLevel, setSelectedLevel] = useState("R1");
  const [selectedSubscription, setSelectedSubscription] = useState("free");
  const [isVIP, setIsVIP] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showAllTx, setShowAllTx] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null);
  const [expandedWallet, setExpandedWallet] = useState<string | null>(null);
  const [showSaveAlert, setShowSaveAlert] = useState(false);

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
    usdAedBuy: "3.68", usdAedSell: "3.67",
  });

  // Initial values for change detection
  const initialValues = useRef({
    selectedLevel: "R1",
    selectedSubscription: "free",
    isVIP: false,
    isBlocked: false,
    limits: { dailyTopUp: "50000", monthlyTopUp: "500000", dailyTransfer: "25000", monthlyTransfer: "250000", dailyWithdraw: "20000", monthlyWithdraw: "200000", singleTransaction: "10000" },
    fees: { topUpPercent: "2.5", transferPercent: "1.5", withdrawPercent: "2.0", conversionPercent: "1.0" },
    rates: { usdtAedBuy: "3.65", usdtAedSell: "3.69", usdAedBuy: "3.68", usdAedSell: "3.67" },
  });

  const getChanges = (): { label: string; from: string; to: string }[] => {
    const changes: { label: string; from: string; to: string }[] = [];
    const init = initialValues.current;

    if (selectedLevel !== init.selectedLevel) changes.push({ label: t("admin.clients.referralLevel") || "Реферальный уровень", from: init.selectedLevel, to: selectedLevel });
    if (selectedSubscription !== init.selectedSubscription) changes.push({ label: t("admin.clients.subscriptionType") || "Подписка", from: init.selectedSubscription, to: selectedSubscription });
    if (isVIP !== init.isVIP) changes.push({ label: "VIP", from: init.isVIP ? "Да" : "Нет", to: isVIP ? "Да" : "Нет" });
    if (isBlocked !== init.isBlocked) changes.push({ label: t("admin.clients.blockStatus") || "Блокировка", from: init.isBlocked ? "Да" : "Нет", to: isBlocked ? "Да" : "Нет" });

    const feeLabels: Record<string, string> = { topUpPercent: t("admin.clients.topUp") || "Top Up", transferPercent: t("admin.clients.transfers") || "Переводы", withdrawPercent: t("admin.clients.withdrawal") || "Вывод", conversionPercent: t("admin.clients.conversion") || "Конвертация" };
    for (const key of Object.keys(fees) as (keyof typeof fees)[]) {
      if (fees[key] !== init.fees[key]) changes.push({ label: `${t("admin.clients.personalFees") || "Комиссия"}: ${feeLabels[key]}`, from: `${init.fees[key]}%`, to: `${fees[key]}%` });
    }

    const limitLabels: Record<string, string> = { dailyTopUp: "Daily Top Up", monthlyTopUp: "Monthly Top Up", dailyTransfer: "Daily Transfer", monthlyTransfer: "Monthly Transfer", dailyWithdraw: "Daily Withdraw", monthlyWithdraw: "Monthly Withdraw", singleTransaction: "Single TX" };
    for (const key of Object.keys(limits) as (keyof typeof limits)[]) {
      if (limits[key] !== init.limits[key]) changes.push({ label: `${t("admin.clients.personalLimits") || "Лимит"}: ${limitLabels[key]}`, from: `${init.limits[key]} AED`, to: `${limits[key]} AED` });
    }

    const rateLabels: Record<string, string> = { usdtAedBuy: "USDT→AED Buy", usdtAedSell: "USDT→AED Sell", usdAedBuy: "USD→AED Buy", usdAedSell: "USD→AED Sell" };
    for (const key of Object.keys(rates) as (keyof typeof rates)[]) {
      if (rates[key] !== init.rates[key]) changes.push({ label: rateLabels[key], from: init.rates[key], to: rates[key] });
    }

    return changes;
  };

  const handleSaveClick = () => {
    const changes = getChanges();
    if (changes.length === 0) {
      toast.info(t("admin.clients.noChanges") || "Нет изменений для сохранения");
      return;
    }
    setShowSaveAlert(true);
  };

  const handleConfirmSave = () => {
    setShowSaveAlert(false);
    toast.success(t("admin.clients.settingsSaved"));
    navigate(-1);
  };

  const txGroups = useMemo((): AppTransactionGroup[] => {
    const txList = showAllTx ? client?.transactions : client?.transactions?.slice(0, 3);
    if (!txList || txList.length === 0) return [];
    const sorted = [...txList].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const map = new Map<string, AppTransaction[]>();
    for (const tx of sorted) {
      const d = new Date(tx.created_at);
      const key = format(d, "dd.MM.yyyy");
      if (!map.has(key)) map.set(key, []);
      const incoming = isIncomeTx(tx.type);
      map.get(key)!.push({
        id: tx.id,
        merchant: TX_TYPE_LABELS[tx.type] || tx.type,
        time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        amountUSDT: tx.amount,
        amountLocal: tx.amount,
        localCurrency: tx.currency,
        color: incoming ? "#22C55E" : "#007AFF",
        type: mapTypeToAppType(tx.type),
        status: tx.status === "completed" ? "settled" : tx.status === "pending" ? "processing" : undefined,
        recipientName: tx.receiver_name,
        senderName: tx.sender_name,
        description: tx.description || TX_TYPE_LABELS[tx.type] || tx.type,
        fee: tx.fee,
        metadata: { originalApiType: tx.type, isIncoming: incoming },
        createdAt: tx.created_at,
      });
    }
    return Array.from(map.entries()).map(([date, txs]) => ({
      date,
      totalSpend: txs.filter(t => !isIncomeTx(t.type || "")).reduce((s, t) => s + t.amountLocal, 0),
      transactions: txs,
    }));
  }, [client?.transactions, showAllTx]);

  if (!userId) {
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

        {/* Transaction History */}
        {client.transactions && client.transactions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">{t("admin.clients.transactionHistory") || "История транзакций"}</h4>
              <span className="text-xs text-muted-foreground">{t("admin.clients.lastTransactions", "последние 3 транзакции")}</span>
            </div>
            <CardTransactionsList groups={txGroups} />
            {client.transactions.length > 3 && !showAllTx && (
              <Button variant="outline" size="sm" className="w-full rounded-xl" onClick={() => setShowAllTx(true)}>
                Посмотреть всю историю ({client.transactions.length})
              </Button>
            )}
            {showAllTx && client.transactions.length > 3 && (
              <Button variant="ghost" size="sm" className="w-full" onClick={() => setShowAllTx(false)}>
                <ChevronUp className="w-4 h-4 mr-1" />
                Свернуть
              </Button>
            )}
            <Button
              variant="default"
              className="w-full rounded-xl mt-2"
              onClick={() => navigate(`/settings/admin/clients/details/${userId}/history`)}
            >
              <Receipt className="w-4 h-4 mr-2" />
              {t("admin.clients.fullHistory", "История транзакций")}
            </Button>
          </div>
        )}

        {client.cards && client.cards.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">{t("admin.clients.cards") || "Карты"}</h4>
              <Badge variant="secondary" className="text-[10px]">{client.cards.length}</Badge>
            </div>
            <div className="space-y-2">
              {client.cards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => setExpandedCard(expandedCard === card.id ? null : card.id)}
                  className="w-full text-left p-3 rounded-xl bg-muted/30 border border-border/50 transition-all"
                >
                  <div className="flex items-center justify-between">
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
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-emerald-500">{card.balance.toLocaleString()} AED</p>
                      <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", expandedCard === card.id && "rotate-180")} />
                    </div>
                  </div>
                  {expandedCard === card.id && (
                    <div className="mt-3 pt-3 border-t border-border/30 grid grid-cols-2 gap-2 text-xs">
                      {card.card_number && <div className="col-span-2"><span className="text-muted-foreground">Card Number:</span> <span className="font-mono">{card.card_number}</span></div>}
                      {card.cardholder_name && <div className="col-span-2"><span className="text-muted-foreground">Cardholder:</span> {card.cardholder_name}</div>}
                      {card.expiry_date && <div><span className="text-muted-foreground">Expiry:</span> {card.expiry_date}</div>}
                      <div><span className="text-muted-foreground">Type:</span> <span className="capitalize">{card.type}</span></div>
                      <div><span className="text-muted-foreground">Status:</span> <span className="capitalize">{card.status}</span></div>
                      <div><span className="text-muted-foreground">Balance:</span> {card.balance.toLocaleString()} AED</div>
                      {card.last_four_digits && <div><span className="text-muted-foreground">Last 4:</span> {card.last_four_digits}</div>}
                      <div className="col-span-2"><span className="text-muted-foreground">ID:</span> <span className="font-mono text-[10px]">{card.id}</span></div>
                      <div className="col-span-2"><span className="text-muted-foreground">Created:</span> {new Date(card.created_at).toLocaleString()}</div>
                    </div>
                  )}
                </button>
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
                <button
                  key={acc.id}
                  onClick={() => setExpandedAccount(expandedAccount === acc.id ? null : acc.id)}
                  className="w-full text-left p-3 rounded-xl bg-muted/30 border border-border/50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{acc.bank_name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{acc.iban.slice(0, 8)}••••</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-emerald-500">{acc.balance.toLocaleString()} AED</p>
                      <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", expandedAccount === acc.id && "rotate-180")} />
                    </div>
                  </div>
                  {expandedAccount === acc.id && (
                    <div className="mt-3 pt-3 border-t border-border/30 space-y-1.5 text-xs">
                      <div><span className="text-muted-foreground">IBAN:</span> <span className="font-mono">{acc.iban}</span></div>
                      <div><span className="text-muted-foreground">Bank:</span> {acc.bank_name}</div>
                      <div><span className="text-muted-foreground">Beneficiary:</span> {acc.beneficiary}</div>
                      <div><span className="text-muted-foreground">Balance:</span> {acc.balance.toLocaleString()} AED</div>
                      <div><span className="text-muted-foreground">Status:</span> <Badge variant={acc.is_active ? "default" : "destructive"} className="text-[10px]">{acc.is_active ? "Active" : "Inactive"}</Badge></div>
                    </div>
                  )}
                </button>
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
                <button
                  key={w.id}
                  onClick={() => setExpandedWallet(expandedWallet === w.id ? null : w.id)}
                  className="w-full text-left p-3 rounded-xl bg-muted/30 border border-border/50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{w.token} ({w.network})</p>
                      <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[200px]">{w.address.slice(0, 10)}••••{w.address.slice(-6)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-emerald-500">{w.balance.toLocaleString()} {w.token}</p>
                      <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", expandedWallet === w.id && "rotate-180")} />
                    </div>
                  </div>
                  {expandedWallet === w.id && (
                    <div className="mt-3 pt-3 border-t border-border/30 space-y-1.5 text-xs">
                      <div><span className="text-muted-foreground">Network:</span> {w.network}</div>
                      <div><span className="text-muted-foreground">Token:</span> {w.token}</div>
                      <div className="break-all"><span className="text-muted-foreground">Address:</span> <span className="font-mono text-[10px]">{w.address}</span></div>
                      <div><span className="text-muted-foreground">Balance:</span> {w.balance.toLocaleString()} {w.token}</div>
                      <div><span className="text-muted-foreground">Status:</span> <Badge variant={w.is_active ? "default" : "destructive"} className="text-[10px]">{w.is_active ? "Active" : "Inactive"}</Badge></div>
                      <div><span className="text-muted-foreground">Created:</span> {new Date(w.created_at).toLocaleString()}</div>
                    </div>
                  )}
                </button>
              ))}
            </div>
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
          onClick={handleSaveClick}
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold"
        >
          <Save className="w-5 h-5 mr-2" />
          {t("admin.clients.saveChanges")}
        </Button>
      </div>

      {/* Confirmation Alert */}
      <AlertDialog open={showSaveAlert} onOpenChange={setShowSaveAlert}>
        <AlertDialogContent className="max-w-[320px] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Подтвердить изменения</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-2">
                <p className="text-sm text-muted-foreground">Следующие параметры будут изменены:</p>
                <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                  {getChanges().map((change, i) => (
                    <div key={i} className="flex flex-col gap-0.5 p-2.5 rounded-xl bg-muted/50 border border-border/50">
                      <span className="text-xs font-medium text-foreground">{change.label}</span>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground line-through">{change.from}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-semibold text-primary">{change.to}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3 mt-4">
            <AlertDialogCancel className="flex-1 mt-0 h-11 rounded-2xl">{t("common.cancel") || "Отмена"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave} className="flex-1 h-11 rounded-2xl bg-primary text-primary-foreground font-semibold">
              <Save className="w-4 h-4 mr-1.5" />
              Сохранить изменения
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MobileLayout>
  );
}

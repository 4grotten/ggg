import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Phone, CreditCard, TrendingUp, Percent, Shield, Award, Save, ArrowUpDown, CheckCircle, Crown, Sparkles } from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ThemeSwitcher } from "@/components/dashboard/ThemeSwitcher";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";

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

interface ClientState {
  id: string;
  name: string;
  phone: string;
  avatarUrl?: string;
  isVerified: boolean;
  cardsCount: number;
  referralLevel: string | null;
  balance: number;
  registrationDate: string;
  role?: "admin" | "moderator" | "user";
  accountsCount?: number;
  cryptoWalletsCount?: number;
  totalCryptoBalance?: number;
}

export default function AdminClientDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const client = location.state as ClientState | null;

  const [selectedLevel, setSelectedLevel] = useState(client?.referralLevel || "R1");
  const [selectedSubscription, setSelectedSubscription] = useState("free");
  const [isVIP, setIsVIP] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const [limits, setLimits] = useState({
    dailyTopUp: "50000",
    monthlyTopUp: "500000",
    dailyTransfer: "25000",
    monthlyTransfer: "250000",
    dailyWithdraw: "20000",
    monthlyWithdraw: "200000",
    singleTransaction: "10000",
  });

  const [fees, setFees] = useState({
    topUpPercent: "2.5",
    transferPercent: "1.5",
    withdrawPercent: "2.0",
    conversionPercent: "1.0",
  });

  const handleSave = () => {
    toast.success(t("admin.clients.settingsSaved"));
    navigate(-1);
  };

  if (!client) {
    navigate("/settings/admin/clients");
    return null;
  }

  return (
    <MobileLayout
      title={client.name || t("admin.clients.settingsTitle")}
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
                {client.avatarUrl ? (
                  <img src={client.avatarUrl} alt={client.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold text-xl">
                    {(client.name || "?").charAt(0)}
                  </div>
                )}
              </div>
              {client.isVerified && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg truncate">{client.name}</h3>
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
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-muted-foreground">{t("admin.clients.balance")}</p>
              <p className="text-lg font-bold text-emerald-500">{client.balance.toLocaleString()} AED</p>
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

        {/* Personal Limits */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-5 h-5 text-primary" />
            <h4 className="font-semibold">{t("admin.clients.personalLimits")}</h4>
          </div>

          {/* Daily Limits */}
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
                    <Input
                      type="number"
                      value={limits[key as keyof typeof limits]}
                      onChange={(e) => setLimits({ ...limits, [key]: e.target.value })}
                      className="text-xs pr-10 rounded-xl h-9"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">AED</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Limits */}
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
                    <Input
                      type="number"
                      value={limits[key as keyof typeof limits]}
                      onChange={(e) => setLimits({ ...limits, [key]: e.target.value })}
                      className="text-xs pr-10 rounded-xl h-9"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">AED</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Single Transaction */}
          <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("admin.clients.transactionLimit")}</p>
            <div className="relative">
              <Input
                type="number"
                value={limits.singleTransaction}
                onChange={(e) => setLimits({ ...limits, singleTransaction: e.target.value })}
                className="pr-12 rounded-xl"
              />
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

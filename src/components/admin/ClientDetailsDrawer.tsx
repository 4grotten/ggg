import { useState } from "react";
import { Phone, User, CreditCard, TrendingUp, Percent, Shield, Award, ChevronRight, Save, Wallet, ArrowUpDown, Calendar, CheckCircle, XCircle, Crown } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ClientData {
  id: string;
  name: string;
  phone: string;
  avatarUrl?: string;
  isVerified: boolean;
  cardsCount: number;
  referralLevel: string;
  balance: number;
  registrationDate: string;
}

interface ClientDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ClientData | null;
}

// Referral levels configuration
const REFERRAL_LEVELS = [
  { id: "R1", name: "Стартовый", color: "from-gray-400 to-gray-500", percent: 5 },
  { id: "R2", name: "Базовый", color: "from-lime-400 to-lime-500", percent: 7 },
  { id: "R3", name: "Продвинутый", color: "from-blue-400 to-blue-500", percent: 10 },
  { id: "R4", name: "Эксперт", color: "from-purple-400 to-purple-500", percent: 12 },
  { id: "R5", name: "Мастер", color: "from-amber-400 to-amber-500", percent: 15 },
  { id: "R6", name: "Легенда", color: "from-rose-400 to-rose-500", percent: 20 },
];

export function ClientDetailsDrawer({ open, onOpenChange, client }: ClientDetailsDrawerProps) {
  // Local state for editable fields
  const [selectedLevel, setSelectedLevel] = useState(client?.referralLevel || "R1");
  const [isVIP, setIsVIP] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  
  // Limits state
  const [limits, setLimits] = useState({
    dailyTopUp: "50000",
    monthlyTopUp: "500000",
    dailyTransfer: "25000",
    monthlyTransfer: "250000",
    dailyWithdraw: "20000",
    monthlyWithdraw: "200000",
    singleTransaction: "10000",
  });

  // Fees state
  const [fees, setFees] = useState({
    topUpPercent: "2.5",
    transferPercent: "1.5",
    withdrawPercent: "2.0",
    conversionPercent: "1.0",
  });

  const handleSave = () => {
    toast.success("Настройки клиента сохранены");
    onOpenChange(false);
  };

  const currentLevelData = REFERRAL_LEVELS.find(l => l.id === selectedLevel);

  if (!client) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[95vh]">
        <DrawerHeader className="border-b border-border/50 pb-4">
          <DrawerTitle className="text-lg font-bold">Настройки клиента</DrawerTitle>
        </DrawerHeader>
        
        <div className="overflow-y-auto px-4 pb-8 pt-4 space-y-6">
          {/* Client Header Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-muted/30 border border-border/50 p-4">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary" />
            
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg ring-2 ring-primary/20">
                  {client.avatarUrl ? (
                    <img src={client.avatarUrl} alt={client.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold text-xl">
                      {client.name.charAt(0)}
                    </div>
                  )}
                </div>
                {client.isVerified && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg truncate">{client.name}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{client.phone}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {isVIP && (
                    <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] px-2 py-0.5 border-0">
                      <Crown className="w-3 h-3 mr-1" />
                      VIP
                    </Badge>
                  )}
                  {isBlocked && (
                    <Badge variant="destructive" className="text-[10px] px-2 py-0.5">
                      Заблокирован
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Balance */}
              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground">Баланс</p>
                <p className="text-lg font-bold text-emerald-500">{client.balance.toLocaleString()} AED</p>
              </div>
            </div>
          </div>

          {/* Quick Status Toggles */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium">VIP статус</span>
              </div>
              <Switch checked={isVIP} onCheckedChange={setIsVIP} />
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-destructive" />
                <span className="text-sm font-medium">Блокировка</span>
              </div>
              <Switch checked={isBlocked} onCheckedChange={setIsBlocked} />
            </div>
          </div>

          {/* Referral Level Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">Реферальный уровень</h4>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {REFERRAL_LEVELS.map((level) => (
                <button
                  key={level.id}
                  onClick={() => setSelectedLevel(level.id)}
                  className={cn(
                    "relative p-3 rounded-2xl border-2 transition-all duration-200 text-center",
                    selectedLevel === level.id
                      ? "border-primary bg-primary/10"
                      : "border-border/50 bg-muted/30 hover:border-border"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm",
                    level.color
                  )}>
                    {level.id}
                  </div>
                  <p className="text-xs font-medium truncate">{level.name}</p>
                  <p className="text-[10px] text-muted-foreground">{level.percent}%</p>
                  
                  {selectedLevel === level.id && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            
            {currentLevelData && (
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                <p className="text-xs text-center">
                  Текущий бонус: <span className="font-bold text-primary">{currentLevelData.percent}%</span> от оборота рефералов
                </p>
              </div>
            )}
          </div>

          {/* Personal Fees Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">Персональные комиссии</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Пополнение</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={fees.topUpPercent}
                    onChange={(e) => setFees({ ...fees, topUpPercent: e.target.value })}
                    className="pr-8 rounded-xl"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Переводы</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={fees.transferPercent}
                    onChange={(e) => setFees({ ...fees, transferPercent: e.target.value })}
                    className="pr-8 rounded-xl"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Вывод</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={fees.withdrawPercent}
                    onChange={(e) => setFees({ ...fees, withdrawPercent: e.target.value })}
                    className="pr-8 rounded-xl"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Конвертация</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={fees.conversionPercent}
                    onChange={(e) => setFees({ ...fees, conversionPercent: e.target.value })}
                    className="pr-8 rounded-xl"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Limits Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">Персональные лимиты</h4>
            </div>
            
            {/* Daily Limits */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Дневные лимиты</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground">Пополнение</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={limits.dailyTopUp}
                      onChange={(e) => setLimits({ ...limits, dailyTopUp: e.target.value })}
                      className="text-xs pr-10 rounded-xl h-9"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">AED</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground">Переводы</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={limits.dailyTransfer}
                      onChange={(e) => setLimits({ ...limits, dailyTransfer: e.target.value })}
                      className="text-xs pr-10 rounded-xl h-9"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">AED</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground">Вывод</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={limits.dailyWithdraw}
                      onChange={(e) => setLimits({ ...limits, dailyWithdraw: e.target.value })}
                      className="text-xs pr-10 rounded-xl h-9"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">AED</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Monthly Limits */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Месячные лимиты</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground">Пополнение</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={limits.monthlyTopUp}
                      onChange={(e) => setLimits({ ...limits, monthlyTopUp: e.target.value })}
                      className="text-xs pr-10 rounded-xl h-9"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">AED</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground">Переводы</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={limits.monthlyTransfer}
                      onChange={(e) => setLimits({ ...limits, monthlyTransfer: e.target.value })}
                      className="text-xs pr-10 rounded-xl h-9"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">AED</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground">Вывод</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={limits.monthlyWithdraw}
                      onChange={(e) => setLimits({ ...limits, monthlyWithdraw: e.target.value })}
                      className="text-xs pr-10 rounded-xl h-9"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">AED</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Single Transaction Limit */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Лимит на транзакцию</p>
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
            Сохранить изменения
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

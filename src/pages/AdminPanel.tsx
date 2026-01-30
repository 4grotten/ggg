import { ArrowLeft, DollarSign, Percent, TrendingUp, Shield, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminSettings } from "@/hooks/useAdminSettings";
import { useUserRole } from "@/hooks/useUserRole";
import { useState, useEffect } from "react";
import { AdminSetting } from "@/types/admin";

// Settings field configuration for better UI
const exchangeRateFields = [
  { key: "usdt_to_aed_buy", label: "USDT → AED (покупка)", suffix: "AED" },
  { key: "usdt_to_aed_sell", label: "USDT → AED (продажа)", suffix: "AED" },
  { key: "usd_to_aed_buy", label: "USD → AED (покупка)", suffix: "AED" },
  { key: "usd_to_aed_sell", label: "USD → AED (продажа)", suffix: "AED" },
  { key: "aed_to_usd_buy", label: "AED → USD (покупка)", suffix: "USD" },
  { key: "aed_to_usd_sell", label: "AED → USD (продажа)", suffix: "USD" },
];

const feeFields = [
  { key: "top_up_crypto_flat", label: "Крипто пополнение (фикс)", suffix: "USDT" },
  { key: "top_up_bank_percent", label: "Банковское пополнение", suffix: "%" },
  { key: "card_to_card_percent", label: "Перевод карта → карта", suffix: "%" },
  { key: "bank_transfer_percent", label: "Банковский перевод", suffix: "%" },
  { key: "network_fee_percent", label: "Сетевая комиссия", suffix: "%" },
  { key: "currency_conversion_percent", label: "Конвертация валюты", suffix: "%" },
  { key: "virtual_card_annual", label: "Виртуальная карта (год)", suffix: "AED" },
  { key: "virtual_card_replacement", label: "Замена виртуальной карты", suffix: "AED" },
  { key: "metal_card_annual", label: "Металлическая карта (год)", suffix: "AED" },
  { key: "metal_card_replacement", label: "Замена металлической карты", suffix: "AED" },
  { key: "virtual_account_opening", label: "Открытие виртуального счёта", suffix: "AED" },
];

const limitFields = [
  { key: "top_up_crypto_min", label: "Мин. крипто пополнение", suffix: "USDT", group: "min" },
  { key: "top_up_bank_min", label: "Мин. банковское пополнение", suffix: "AED", group: "min" },
  { key: "transfer_min", label: "Мин. перевод", suffix: "AED", group: "min" },
  { key: "withdrawal_min", label: "Мин. вывод", suffix: "AED", group: "min" },
  { key: "top_up_crypto_max", label: "Макс. крипто пополнение", suffix: "USDT", group: "max" },
  { key: "top_up_bank_max", label: "Макс. банковское пополнение", suffix: "AED", group: "max" },
  { key: "transfer_max", label: "Макс. перевод", suffix: "AED", group: "max" },
  { key: "withdrawal_max", label: "Макс. вывод", suffix: "AED", group: "max" },
  { key: "daily_top_up_limit", label: "Дневной лимит пополнения", suffix: "AED", group: "daily" },
  { key: "daily_transfer_limit", label: "Дневной лимит переводов", suffix: "AED", group: "daily" },
  { key: "daily_withdrawal_limit", label: "Дневной лимит вывода", suffix: "AED", group: "daily" },
  { key: "monthly_top_up_limit", label: "Месячный лимит пополнения", suffix: "AED", group: "monthly" },
  { key: "monthly_transfer_limit", label: "Месячный лимит переводов", suffix: "AED", group: "monthly" },
  { key: "monthly_withdrawal_limit", label: "Месячный лимит вывода", suffix: "AED", group: "monthly" },
];

interface SettingsFieldProps {
  setting: AdminSetting;
  label: string;
  suffix: string;
  onUpdate: (key: string, value: number) => void;
  isPending: boolean;
  isMissing?: boolean;
}

function SettingsField({ setting, label, suffix, onUpdate, isPending, isMissing }: SettingsFieldProps) {
  const [localValue, setLocalValue] = useState(setting.value.toString());
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setLocalValue(setting.value.toString());
    setIsDirty(false);
  }, [setting.value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
    setIsDirty(e.target.value !== setting.value.toString());
  };

  const handleSave = () => {
    const numValue = parseFloat(localValue);
    if (!isNaN(numValue)) {
      onUpdate(setting.key, numValue);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={setting.key} className="text-sm font-medium flex items-center gap-2">
        {label}
        {isMissing && (
          <span className="text-xs text-amber-500 font-normal">(не в базе)</span>
        )}
      </Label>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            id={setting.key}
            type="number"
            step="0.01"
            value={localValue}
            onChange={handleChange}
            className={`pr-14 ${isMissing ? 'border-amber-500/50' : ''}`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {suffix}
          </span>
        </div>
        {isDirty && (
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isPending}
            className="shrink-0"
          >
            {isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Сохранить"}
          </Button>
        )}
      </div>
      {setting.description && (
        <p className="text-xs text-muted-foreground">{setting.description}</p>
      )}
    </div>
  );
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const { settings, isLoading, updateSetting, getSettingsByCategory } = useAdminSettings();

  const handleUpdate = (category: string) => (key: string, value: number) => {
    updateSetting.mutate({ category, key, value });
  };

  // Access denied screen
  if (!roleLoading && !isAdmin) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <Shield className="w-16 h-16 text-muted-foreground mb-4" />
          <h1 className="text-xl font-semibold text-center mb-2">Доступ запрещён</h1>
          <p className="text-muted-foreground text-center mb-6">
            У вас нет прав для доступа к административной панели
          </p>
          <Button onClick={() => navigate("/settings")}>
            Вернуться в настройки
          </Button>
        </div>
      </MobileLayout>
    );
  }

  const renderSettingsGroup = (
    category: string,
    fields: { key: string; label: string; suffix: string }[]
  ) => {
    const categorySettings = getSettingsByCategory(category);
    
    if (categorySettings.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Загрузка настроек...</p>
          <p className="text-xs mt-1">Если данные не появляются, проверьте подключение к базе</p>
        </div>
      );
    }
    
    return fields.map((field) => {
      const setting = categorySettings.find((s) => s.key === field.key);
      
      // If setting doesn't exist in DB, show it with default 0 value
      const settingToUse: AdminSetting = setting || {
        id: `temp-${field.key}`,
        category: category as 'exchange_rates' | 'fees' | 'limits',
        key: field.key,
        value: 0,
        description: null,
        updated_at: new Date().toISOString(),
        updated_by: null,
      };

      return (
        <SettingsField
          key={field.key}
          setting={settingToUse}
          label={field.label}
          suffix={field.suffix}
          onUpdate={handleUpdate(category)}
          isPending={updateSetting.isPending}
          isMissing={!setting}
        />
      );
    });
  };

  return (
    <MobileLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen bg-background"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b">
          <div className="flex items-center gap-3 px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/settings")}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Административная панель</h1>
              <p className="text-xs text-muted-foreground">Управление настройками системы</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 pb-24">
          {isLoading || roleLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : (
            <Tabs defaultValue="rates" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="rates" className="text-xs">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Курсы
                </TabsTrigger>
                <TabsTrigger value="fees" className="text-xs">
                  <Percent className="w-4 h-4 mr-1" />
                  Комиссии
                </TabsTrigger>
                <TabsTrigger value="limits" className="text-xs">
                  <DollarSign className="w-4 h-4 mr-1" />
                  Лимиты
                </TabsTrigger>
              </TabsList>

              {/* Exchange Rates Tab */}
              <TabsContent value="rates">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Курсы валют
                    </CardTitle>
                    <CardDescription>
                      Настройка курсов обмена для покупки и продажи
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {renderSettingsGroup("exchange_rates", exchangeRateFields)}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Fees Tab */}
              <TabsContent value="fees">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Percent className="w-5 h-5 text-primary" />
                      Комиссии
                    </CardTitle>
                    <CardDescription>
                      Настройка комиссий по всем типам операций
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {renderSettingsGroup("fees", feeFields)}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Limits Tab */}
              <TabsContent value="limits">
                <div className="space-y-4">
                  {/* Minimum Limits */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Минимальные суммы</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {renderSettingsGroup(
                        "limits",
                        limitFields.filter((f) => f.group === "min")
                      )}
                    </CardContent>
                  </Card>

                  {/* Maximum Limits */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Максимальные суммы</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {renderSettingsGroup(
                        "limits",
                        limitFields.filter((f) => f.group === "max")
                      )}
                    </CardContent>
                  </Card>

                  {/* Daily Limits */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Дневные лимиты</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {renderSettingsGroup(
                        "limits",
                        limitFields.filter((f) => f.group === "daily")
                      )}
                    </CardContent>
                  </Card>

                  {/* Monthly Limits */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Месячные лимиты</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {renderSettingsGroup(
                        "limits",
                        limitFields.filter((f) => f.group === "monthly")
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </motion.div>
    </MobileLayout>
  );
}

import { useState } from "react";
import { Plus, Landmark, Clock, Trash2, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";

export interface BankRecipient {
  id: string;
  iban: string;
  name: string;
  bankName: string;
  lastUsed: string; // ISO date
}

const STORAGE_KEY = "bank_recipients";

export const getBankRecipients = (): BankRecipient[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveBankRecipient = (recipient: Omit<BankRecipient, "id" | "lastUsed">) => {
  const existing = getBankRecipients();
  const cleanIban = recipient.iban.replace(/\s/g, "");
  const idx = existing.findIndex((r) => r.iban.replace(/\s/g, "") === cleanIban);
  
  if (idx >= 0) {
    existing[idx].lastUsed = new Date().toISOString();
    existing[idx].name = recipient.name;
    existing[idx].bankName = recipient.bankName;
  } else {
    existing.unshift({
      id: crypto.randomUUID(),
      iban: cleanIban,
      name: recipient.name,
      bankName: recipient.bankName,
      lastUsed: new Date().toISOString(),
    });
  }
  
  // Keep max 20 recipients
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(0, 20)));
};

export const removeBankRecipient = (id: string) => {
  const existing = getBankRecipients();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.filter((r) => r.id !== id)));
};

interface BankRecipientsListProps {
  onSelectRecipient: (recipient: BankRecipient) => void;
  onAddNew: () => void;
}

export const BankRecipientsList = ({ onSelectRecipient, onAddNew }: BankRecipientsListProps) => {
  const { t } = useTranslation();
  const [recipients, setRecipients] = useState(getBankRecipients);
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? recipients.filter(
        (r) =>
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          r.iban.includes(search.replace(/\s/g, ""))
      )
    : recipients;

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeBankRecipient(id);
    setRecipients(getBankRecipients());
  };

  const formatIbanDisplay = (iban: string) => {
    const clean = iban.replace(/\s/g, "");
    return clean.match(/.{1,4}/g)?.join(" ") || clean;
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return t("common.today", "Сегодня");
    if (days === 1) return t("common.yesterday", "Вчера");
    if (days < 30) return `${days}д назад`;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      {/* Add new recipient button */}
      <button
        onClick={onAddNew}
        className="w-full flex items-center gap-3 p-4 bg-primary/10 hover:bg-primary/15 rounded-2xl transition-colors border border-primary/20"
      >
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
          <Plus className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="text-left">
          <p className="text-base font-semibold text-foreground">
            {t("send.addNewRecipient", "Новый получатель")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("send.enterIbanManually", "Ввести IBAN вручную")}
          </p>
        </div>
      </button>

      {/* Recipients list */}
      {recipients.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              {t("send.recentRecipients", "Недавние получатели")}
            </h3>
            <span className="text-xs text-muted-foreground">{recipients.length}</span>
          </div>

          {recipients.length > 3 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("send.searchRecipient", "Поиск по имени или IBAN")}
                className="h-11 rounded-xl bg-secondary border-0 pl-10 text-sm"
              />
            </div>
          )}

          <div className="space-y-1">
            {filtered.map((recipient) => (
              <button
                key={recipient.id}
                onClick={() => onSelectRecipient(recipient)}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-muted/60 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-purple-500/15 flex items-center justify-center shrink-0">
                  <Landmark className="w-5 h-5 text-purple-500" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-base font-medium text-foreground truncate">
                    {recipient.name}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {formatIbanDisplay(recipient.iban)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo(recipient.lastUsed)}
                    </p>
                    <p className="text-xs text-muted-foreground">{recipient.bankName}</p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(recipient.id, e)}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
              </button>
            ))}

            {filtered.length === 0 && search && (
              <p className="text-center text-sm text-muted-foreground py-6">
                {t("send.noRecipientsFound", "Получатели не найдены")}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

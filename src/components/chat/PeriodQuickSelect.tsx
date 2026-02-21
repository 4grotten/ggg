import { motion } from "framer-motion";
import { Calendar } from "lucide-react";

interface PeriodQuickSelectProps {
  onSelect: (period: string) => void;
}

const periods = [
  { label: "📅 Сегодня", value: "за сегодня" },
  { label: "📆 Неделя", value: "за последнюю неделю" },
  { label: "🗓 Месяц", value: "за последний месяц" },
  { label: "📊 3 месяца", value: "за последние 3 месяца" },
];

export const PeriodQuickSelect = ({ onSelect }: PeriodQuickSelectProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 pt-3 border-t border-border/30"
    >
      <p className="text-[11px] text-muted-foreground mb-2 flex items-center gap-1">
        <Calendar className="w-3 h-3" />
        Выбрать период:
      </p>
      <div className="flex flex-col gap-1.5">
        {periods.map((p, i) => (
          <motion.button
            key={p.value}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSelect(`Покажи транзакции ${p.value}`)}
            className="text-left text-sm px-3 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 active:scale-[0.98] transition-all font-medium"
          >
            {p.label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

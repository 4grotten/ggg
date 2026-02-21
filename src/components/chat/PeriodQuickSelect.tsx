import { motion } from "framer-motion";

interface PeriodQuickSelectProps {
  onSelect: (period: string) => void;
}

const periods = [
  { label: "Сегодня", value: "за сегодня" },
  { label: "Неделя", value: "за последнюю неделю" },
  { label: "Месяц", value: "за последний месяц" },
  { label: "3 месяца", value: "за последние 3 месяца" },
];

export const PeriodQuickSelect = ({ onSelect }: PeriodQuickSelectProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-2 pt-3 mt-3 border-t border-border/30"
    >
      {periods.map((p) => (
        <button
          key={p.value}
          onClick={() => onSelect(`Покажи транзакции ${p.value}`)}
          className="text-xs px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border/50 transition-colors"
        >
          {p.label}
        </button>
      ))}
    </motion.div>
  );
};

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface DateWheelPickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  minYear?: number;
  maxYear?: number;
}

const ITEM_HEIGHT = 44;

const WheelColumn = ({
  items,
  selectedIndex,
  onSelect,
}: {
  items: { value: number; label: string }[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeout = useRef<NodeJS.Timeout>();
  const isScrollingRef = useRef(false);

  useEffect(() => {
    if (containerRef.current && !isScrollingRef.current) {
      containerRef.current.scrollTop = selectedIndex * ITEM_HEIGHT;
    }
  }, [selectedIndex]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    
    isScrollingRef.current = true;
    
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    scrollTimeout.current = setTimeout(() => {
      if (!containerRef.current) return;
      
      const scrollTop = containerRef.current.scrollTop;
      const index = Math.round(scrollTop / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(items.length - 1, index));
      
      containerRef.current.scrollTo({
        top: clampedIndex * ITEM_HEIGHT,
        behavior: "smooth",
      });
      
      onSelect(clampedIndex);
      
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 100);
    }, 80);
  }, [items.length, onSelect]);

  return (
    <div className="relative h-[220px] flex-1 overflow-hidden">
      {/* iOS-style gradient overlays */}
      <div className="absolute inset-x-0 top-0 h-[88px] bg-gradient-to-b from-secondary via-secondary/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-[88px] bg-gradient-to-t from-secondary via-secondary/80 to-transparent z-10 pointer-events-none" />
      
      {/* iOS-style selection highlight with borders */}
      <div 
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[44px] pointer-events-none z-5"
        style={{ marginTop: 0 }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-border/50" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-border/50" />
      </div>
      
      {/* Scrollable items - vertical only */}
      <div
        ref={containerRef}
        className="h-full overflow-y-auto overflow-x-hidden scrollbar-hide touch-pan-y"
        onScroll={handleScroll}
        style={{ 
          paddingTop: ITEM_HEIGHT * 2,
          paddingBottom: ITEM_HEIGHT * 2,
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {items.map((item, index) => (
          <div
            key={`${item.value}-${index}`}
            className={cn(
              "h-[44px] flex items-center justify-center text-xl font-normal transition-all duration-100 select-none",
              index === selectedIndex 
                ? "text-foreground" 
                : "text-muted-foreground/40"
            )}
            onClick={() => {
              if (containerRef.current) {
                containerRef.current.scrollTo({
                  top: index * ITEM_HEIGHT,
                  behavior: "smooth",
                });
              }
              onSelect(index);
            }}
          >
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export const DateWheelPicker = ({
  value,
  onChange,
  minYear = 2020,
  maxYear = new Date().getFullYear(),
}: DateWheelPickerProps) => {
  const currentDate = value || new Date();
  
  const [selectedDay, setSelectedDay] = useState(currentDate.getDate());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
  
  const dayItems = Array.from({ length: daysInMonth }, (_, i) => ({
    value: i + 1,
    label: String(i + 1).padStart(2, "0"),
  }));

  // Use numeric month format (01, 02, ... 12)
  const monthItems = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: String(i + 1).padStart(2, "0"),
  }));

  const yearItems = Array.from({ length: maxYear - minYear + 1 }, (_, i) => ({
    value: minYear + i,
    label: String(minYear + i),
  }));

  useEffect(() => {
    // Adjust day if it exceeds days in selected month
    const maxDay = getDaysInMonth(selectedMonth, selectedYear);
    const adjustedDay = Math.min(selectedDay, maxDay);
    
    const newDate = new Date(selectedYear, selectedMonth, adjustedDay);
    onChange(newDate);
  }, [selectedDay, selectedMonth, selectedYear]);

  const handleDaySelect = (index: number) => {
    setSelectedDay(dayItems[index].value);
  };

  const handleMonthSelect = (index: number) => {
    setSelectedMonth(monthItems[index].value);
  };

  const handleYearSelect = (index: number) => {
    setSelectedYear(yearItems[index].value);
  };

  return (
    <div 
      className="flex bg-secondary rounded-xl overflow-hidden touch-pan-y"
      style={{ touchAction: 'pan-y' }}
    >
      <WheelColumn
        items={dayItems}
        selectedIndex={selectedDay - 1}
        onSelect={handleDaySelect}
      />
      <WheelColumn
        items={monthItems}
        selectedIndex={selectedMonth}
        onSelect={handleMonthSelect}
      />
      <WheelColumn
        items={yearItems}
        selectedIndex={selectedYear - minYear}
        onSelect={handleYearSelect}
      />
    </div>
  );
};
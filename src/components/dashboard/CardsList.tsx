import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CardMiniature } from "./CardMiniature";
import { useScreenLockContext } from "@/contexts/ScreenLockContext";
import { DataUnlockDialog } from "@/components/settings/DataUnlockDialog";

interface Card {
  id: string;
  type: "virtual" | "metal";
  name: string;
  lastFour?: string;
  isActive: boolean;
  balance?: number;
}

interface CardsListProps {
  cards: Card[];
  onCardClick?: (card: Card) => void;
}

const AnimatedNumber = ({ value, duration = 600 }: { value: number; duration?: number }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(value * easeOut);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <>{displayValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>;
};

export const CardsList = ({ cards, onCardClick }: CardsListProps) => {
  const navigate = useNavigate();
  const [visibleBalances, setVisibleBalances] = useState<Set<string>>(new Set());
  const [animationKeys, setAnimationKeys] = useState<Record<string, number>>({});
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);
  const [pendingCardId, setPendingCardId] = useState<string | null>(null);
  
  const { isHideDataEnabled, isEnabled: isScreenLockEnabled } = useScreenLockContext();

  const handleCardClick = (card: Card) => {
    if (onCardClick) {
      onCardClick(card);
    } else if (card.type === "virtual") {
      navigate("/card/virtual");
    } else if (card.type === "metal") {
      navigate("/card/metal");
    }
  };

  const toggleBalanceVisibility = (e: React.MouseEvent, cardId: string) => {
    e.stopPropagation();
    
    const isCurrentlyVisible = visibleBalances.has(cardId);
    
    if (!isCurrentlyVisible && isHideDataEnabled && isScreenLockEnabled) {
      // Require authentication before showing
      setPendingCardId(cardId);
      setShowUnlockDialog(true);
      return;
    }
    
    setVisibleBalances(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
        setAnimationKeys(keys => ({ ...keys, [cardId]: (keys[cardId] || 0) + 1 }));
      }
      return newSet;
    });
  };

  const handleUnlockSuccess = () => {
    if (pendingCardId) {
      setVisibleBalances(prev => {
        const newSet = new Set(prev);
        newSet.add(pendingCardId);
        setAnimationKeys(keys => ({ ...keys, [pendingCardId]: (keys[pendingCardId] || 0) + 1 }));
        return newSet;
      });
      setPendingCardId(null);
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => handleCardClick(card)}
            className={`relative rounded-2xl transition-all duration-200 active:scale-[0.98] ${
              !card.isActive ? "opacity-50" : ""
            }`}
          >
            {/* Eye icon in top right corner */}
            {card.balance !== undefined && (
              <div
                onClick={(e) => toggleBalanceVisibility(e, card.id)}
                className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/30 transition-colors"
              >
                {visibleBalances.has(card.id) ? (
                  <Eye className="w-3.5 h-3.5 text-white/80" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-white/80" />
                )}
              </div>
            )}

            {/* Card Miniature */}
            <CardMiniature type={card.type} />
            
            {/* Balance overlay at bottom */}
            {card.balance !== undefined && (
              <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5 pt-6 bg-gradient-to-t from-black/40 to-transparent rounded-b-2xl">
                <p className="text-sm font-semibold text-white text-left drop-shadow-sm">
                  {visibleBalances.has(card.id) 
                    ? <><AnimatedNumber key={animationKeys[card.id] || 0} value={card.balance} /> AED</>
                    : "••••••"
                  }
                </p>
              </div>
            )}
          </button>
        ))}
      </div>

      <DataUnlockDialog
        isOpen={showUnlockDialog}
        onClose={() => {
          setShowUnlockDialog(false);
          setPendingCardId(null);
        }}
        onSuccess={handleUnlockSuccess}
      />
    </>
  );
};

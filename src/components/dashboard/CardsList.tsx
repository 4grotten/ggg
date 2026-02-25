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
  const [pendingCardNavigation, setPendingCardNavigation] = useState<Card | null>(null);
  
  const { isHideDataEnabled, isEnabled } = useScreenLockContext();
  
  const requiresAuth = isHideDataEnabled && isEnabled;

  // Auto-show/hide all card balances based on toggle
  useEffect(() => {
    const hide = isHideDataEnabled && isEnabled;
    if (!hide) {
      setVisibleBalances(new Set(cards.map(c => c.id)));
    } else {
      setVisibleBalances(new Set());
    }
  }, [isHideDataEnabled, isEnabled, cards]);

  const handleCardClick = (card: Card) => {
    if (onCardClick) {
      onCardClick(card);
      return;
    }
    
    // Require auth before entering card page
    if (requiresAuth) {
      setPendingCardNavigation(card);
      setShowUnlockDialog(true);
      return;
    }
    
    if (card.type === "virtual") {
      navigate("/card/virtual");
    } else if (card.type === "metal") {
      navigate("/card/metal");
    }
  };

  const toggleBalanceVisibility = (e: React.MouseEvent, cardId: string) => {
    e.stopPropagation();
    
    const isCurrentlyVisible = visibleBalances.has(cardId);
    
    if (!isCurrentlyVisible && requiresAuth) {
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
    // Handle card navigation unlock
    if (pendingCardNavigation) {
      const card = pendingCardNavigation;
      setPendingCardNavigation(null);
      if (card.type === "virtual") {
        navigate("/card/virtual");
      } else if (card.type === "metal") {
        navigate("/card/metal");
      }
      return;
    }
    
    // Handle balance visibility unlock
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
                className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 p-1.5 sm:p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/50 transition-colors"
              >
                {visibleBalances.has(card.id) ? (
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                ) : (
                  <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                )}
              </div>
            )}

            {/* Card Miniature */}
            <div className="relative overflow-hidden rounded-2xl">
              <CardMiniature type={card.type} />
              
              {/* Fantasy glint overlay */}
              <div 
                className="absolute inset-0 animate-fantasy-glint pointer-events-none"
                style={{
                  background: "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.1) 35%, rgba(200,180,255,0.25) 42%, rgba(180,220,255,0.3) 50%, rgba(255,200,255,0.25) 58%, rgba(255,255,255,0.1) 65%, transparent 80%)",
                  animationDelay: `${Math.random() * 2}s`,
                }}
              />
            </div>
            
            {/* Balance overlay at bottom */}
            {card.balance !== undefined && (
              <div className="absolute bottom-0 left-0 right-0 pl-3 pr-2 pb-2 pt-4 sm:pl-5 sm:pr-3 sm:pb-3 sm:pt-6 bg-gradient-to-t from-black/40 to-transparent rounded-b-2xl">
                <p className="text-sm sm:text-lg font-bold text-white text-left drop-shadow-md">
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
          setPendingCardNavigation(null);
        }}
        onSuccess={handleUnlockSuccess}
      />
    </>
  );
};

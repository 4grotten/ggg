import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { HeroBanner } from "@/components/partner/HeroBanner";
import { ProgressSection } from "@/components/partner/ProgressSection";
import { ReferralBalance } from "@/components/partner/ReferralBalance";
import { InviteButton } from "@/components/partner/InviteButton";
import { LevelCarousel } from "@/components/partner/LevelCarousel";
import { ReferralTransactions, MOCK_TRANSACTIONS } from "@/components/partner/ReferralTransactions";

const Partner = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [selectedLevelIndex, setSelectedLevelIndex] = useState(0);
  const [totalWithdrawn] = useState(150); // Mock withdrawn amount
  
  // Calculate stats from transactions
  const stats = useMemo(() => {
    const totalBalance = MOCK_TRANSACTIONS.reduce((sum, tx) => sum + tx.amount, 0);
    const uniqueUsers = new Set(MOCK_TRANSACTIONS.map(tx => tx.userName)).size;
    const cardPurchases = MOCK_TRANSACTIONS.filter(tx => tx.type === "card").length;
    
    return {
      balance: totalBalance,
      invited: uniqueUsers,
      cardPurchases
    };
  }, []);
  
  const handleLevelChange = useCallback((levelIndex: number) => {
    setSelectedLevelIndex(levelIndex);
  }, []);
  
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  return (
    <div className="min-h-screen bg-background flex flex-col max-w-[800px] mx-auto overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border max-w-[800px] mx-auto">
        <div className="flex items-center justify-between h-14 px-4">
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold">{t('partner.program', 'Партнёрская программа')}</h1>
          <LanguageSwitcher />
        </div>
      </header>
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-8 space-y-6 pt-14">
        {/* Hero Section */}
        <div className="relative px-4 pt-4">
          <HeroBanner />
          <InviteButton />
          <div className="mt-4">
            <ProgressSection selectedLevelIndex={selectedLevelIndex} />
          </div>
        </div>
        
        {/* Level Cards Carousel */}
        <LevelCarousel 
          currentFriends={stats.invited} 
          onLevelChange={handleLevelChange}
        />
        
        {/* Referral Balance */}
        <ReferralBalance 
          balance={stats.balance}
          invited={stats.invited}
          withdrawn={totalWithdrawn}
        />
        
        {/* Referral Transactions */}
        <ReferralTransactions />
      </div>
    </div>
  );
};

export default Partner;

import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, CreditCard } from "lucide-react";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/dashboard/ThemeSwitcher";
import { useTranslation } from "react-i18next";
import { HeroBanner } from "@/components/partner/HeroBanner";
import { ProgressSection } from "@/components/partner/ProgressSection";
import { ReferralBalance } from "@/components/partner/ReferralBalance";
import { InviteButton } from "@/components/partner/InviteButton";
import { LevelCarousel } from "@/components/partner/LevelCarousel";
import { ReferralTransactions, MOCK_TRANSACTIONS } from "@/components/partner/ReferralTransactions";
import { PartnerCallButton } from "@/components/partner/PartnerCallButton";
import { useVoiceCall } from "@/contexts/VoiceCallContext";
import { Button } from "@/components/ui/button";

const Partner = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isConnected, endCall } = useVoiceCall();
  
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
    // Disconnect call when leaving partner section
    if (isConnected) {
      endCall();
    }
    navigate('/');
  }, [navigate, isConnected, endCall]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Disconnect call when navigating away from partner section
  useEffect(() => {
    return () => {
      // Only disconnect if navigating outside partner section
      const isLeavingPartnerSection = !location.pathname.startsWith('/partner');
      if (isConnected && isLeavingPartnerSection) {
        endCall();
      }
    };
  }, [location.pathname, isConnected, endCall]);
  
  return (
    <div className="min-h-screen bg-background flex flex-col max-w-[800px] mx-auto overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border max-w-[800px] mx-auto">
        <div className="relative flex items-center justify-between h-14 px-4">
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center active:scale-95 transition-transform z-10"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-semibold">{t('partner.program', 'Партнёрская программа')}</h1>
          <div className="flex items-center gap-1">
            <ThemeSwitcher />
            <LanguageSwitcher />
            <PartnerCallButton />
          </div>
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
        
        {/* Subscribe Button */}
        <div className="px-4">
          <Button
            onClick={() => navigate('/partner/bonuses')}
            className="w-full h-14 rounded-2xl text-base font-semibold bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 hover:from-violet-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/30"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            {t('partner.subscribe', 'Подписаться')}
          </Button>
        </div>
        
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

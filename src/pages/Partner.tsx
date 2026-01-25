import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { HeroBanner } from "@/components/partner/HeroBanner";
import { ProgressSection } from "@/components/partner/ProgressSection";
import { ReferralBalance } from "@/components/partner/ReferralBalance";
import { ShareButtons } from "@/components/partner/ShareButtons";
import { InviteButton } from "@/components/partner/InviteButton";
import { LevelCarousel } from "@/components/partner/LevelCarousel";

const Partner = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Mock data - will be replaced with real data from API
  const [currentFriends] = useState(0);
  const [referralBalance] = useState(0);
  const [totalInvited] = useState(0);
  const [totalWithdrawn] = useState(0);
  const [selectedLevelIndex, setSelectedLevelIndex] = useState(0);
  
  const handleLevelChange = useCallback((levelIndex: number) => {
    setSelectedLevelIndex(levelIndex);
  }, []);
  
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);
  
  return (
    <div className="min-h-screen bg-background flex flex-col max-w-[800px] mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
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
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pb-28">
        {/* Hero Section */}
        <div className="relative px-4 pt-4 pb-6">
          <HeroBanner />
          <h2 className="text-xl font-bold text-center mb-4">
            {t('partner.inviteFriendsTitle', 'Приглашайте друзей')}
          </h2>
          <ProgressSection selectedLevelIndex={selectedLevelIndex} />
        </div>
        
        {/* Level Cards Carousel */}
        <LevelCarousel 
          currentFriends={currentFriends} 
          onLevelChange={handleLevelChange}
        />
        
        {/* Referral Balance */}
        <ReferralBalance 
          balance={referralBalance}
          invited={totalInvited}
          withdrawn={totalWithdrawn}
        />
        
        {/* Share Buttons */}
        <ShareButtons />
      </div>
      
      {/* Floating Invite Button with scroll animation */}
      <InviteButton scrollContainerRef={scrollContainerRef} />
    </div>
  );
};

export default Partner;

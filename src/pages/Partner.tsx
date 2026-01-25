import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Users, Send, Copy, Share2, Sparkles } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import partnerGrowthImage from "@/assets/partner-growth-hero.png";

// Partner levels configuration
const LEVELS = [
  { id: "R1", name: "R1", minFriends: 0, maxFriends: 10, cardPercent: 15, txPercent: 0.05, icon: "🌱" },
  { id: "R2", name: "R2", minFriends: 10, maxFriends: 30, cardPercent: 20, txPercent: 0.1, icon: "🌿" },
  { id: "R3", name: "R3", minFriends: 30, maxFriends: 50, cardPercent: 25, txPercent: 0.2, icon: "💎" },
  { id: "R4", name: "R4", minFriends: 50, maxFriends: 100, cardPercent: 30, txPercent: 0.3, icon: "👑" },
  { id: "Partner", name: "Партнёр", minFriends: 100, maxFriends: Infinity, cardPercent: 35, txPercent: 0.5, icon: "🚀" },
];

const Partner = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Mock data - will be replaced with real data from API
  const [currentFriends] = useState(0);
  const [referralBalance] = useState(0);
  const [totalInvited] = useState(0);
  const [totalWithdrawn] = useState(0);
  const [selectedLevelIndex, setSelectedLevelIndex] = useState(0);
  
  // Embla carousel for swipe
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: false,
    align: "center",
    containScroll: "trimSnaps"
  });
  
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedLevelIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);
  
  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);
  
  const appLink = "https://test.apofiz.com/EasyCard/";
  
  // Calculate current level
  const getCurrentLevelIndex = () => {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (currentFriends >= LEVELS[i].minFriends) {
        return i;
      }
    }
    return 0;
  };
  
  const currentLevelIndex = getCurrentLevelIndex();
  const currentLevel = LEVELS[currentLevelIndex];
  
  // Progress calculation
  const getProgressPercent = () => {
    const level = LEVELS[currentLevelIndex];
    if (level.maxFriends === Infinity) return 100;
    const progress = ((currentFriends - level.minFriends) / (level.maxFriends - level.minFriends)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(appLink);
    toast.success(t('partner.linkCopied'));
  };
  
  const handleShareTelegram = () => {
    const text = encodeURIComponent(t('partner.shareText'));
    const url = encodeURIComponent(appLink);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
  };
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Easy Card',
          text: t('partner.shareText'),
          url: appLink,
        });
      } catch (error) {
        // User cancelled
      }
    } else {
      handleCopyLink();
    }
  };
  
  
  const selectedLevel = LEVELS[selectedLevelIndex];
  
  return (
    <div className="min-h-screen bg-background flex flex-col max-w-[800px] mx-auto">
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <h1 className="text-lg font-bold">Easy Card</h1>
              <p className="text-xs text-muted-foreground">{t('partner.program', 'Партнёрская программа')}</p>
            </div>
            <div className="w-10" />
          </div>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-28">
          {/* Hero Section */}
          <div className="relative px-4 pt-4 pb-6">
            {/* Wide format growth image with pulsating green glow */}
            <motion.div 
              className="relative w-full rounded-2xl overflow-visible mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Pulsating green glow effect */}
              <motion.div 
                className="absolute -inset-3 rounded-3xl z-0"
                animate={{ 
                  opacity: [0.4, 0.7, 0.4],
                  scale: [0.98, 1.02, 0.98]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                style={{ 
                  background: "radial-gradient(ellipse at center, rgba(191, 255, 0, 0.5) 0%, rgba(127, 255, 0, 0.3) 40%, transparent 70%)",
                  filter: "blur(20px)"
                }}
              />
              
              <img 
                src={partnerGrowthImage} 
                alt={t('partner.inviteFriendsTitle', 'Приглашайте друзей')}
                className="relative z-10 w-full h-auto aspect-video object-cover rounded-2xl"
                style={{ 
                  boxShadow: "0 0 30px rgba(191, 255, 0, 0.3)"
                }}
              />
            </motion.div>
            <h2 className="text-xl font-bold text-center">
              {t('partner.inviteFriendsTitle', 'Приглашайте друзей')}
            </h2>
            
            {/* Progress milestones */}
            <div className="flex justify-between text-sm text-muted-foreground mb-2 px-2">
              <span>10 {t('partner.friends', 'друзей')}</span>
              <span>30 {t('partner.friends', 'друзей')}</span>
              <span>50 {t('partner.friends', 'друзей')}</span>
            </div>
            
            {/* Progress bar */}
            <div className="relative h-2 bg-muted rounded-full mb-2 overflow-hidden">
              <motion.div
                className="absolute left-0 top-0 h-full rounded-full"
                style={{
                  background: "linear-gradient(90deg, #BFFF00 0%, #7FFF00 100%)",
                  boxShadow: "0 0 10px rgba(191, 255, 0, 0.5)"
                }}
                initial={{ width: "0%" }}
                animate={{ width: `${(currentLevelIndex / (LEVELS.length - 1)) * 100}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
              
              {/* Progress indicator dot */}
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-background"
                style={{
                  background: "linear-gradient(135deg, #BFFF00 0%, #7FFF00 100%)",
                  boxShadow: "0 0 12px rgba(191, 255, 0, 0.8)",
                  left: `calc(${(currentLevelIndex / (LEVELS.length - 1)) * 100}% - 8px)`
                }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            
            {/* Level labels */}
            <div className="flex justify-between text-xs text-muted-foreground px-1">
              {LEVELS.map((level, idx) => (
                <span 
                  key={level.id}
                  className={idx <= currentLevelIndex ? "text-foreground font-medium" : ""}
                >
                  {level.name}
                </span>
              ))}
            </div>
          </div>
          
          {/* Level Cards Carousel with Swipe */}
          <div className="px-4 mb-6">
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex gap-4">
                {LEVELS.map((level, idx) => (
                  <div 
                    key={level.id}
                    className="flex-[0_0_100%] min-w-0"
                  >
                    <div className="relative">
                      {/* Current level badge */}
                      {idx === currentLevelIndex && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute -top-3 left-1/2 -translate-x-1/2 z-10"
                        >
                          <span 
                            className="px-3 py-1 rounded-full text-xs font-bold text-black flex items-center gap-1"
                            style={{ background: "linear-gradient(135deg, #BFFF00 0%, #7FFF00 100%)" }}
                          >
                            <Sparkles className="w-3 h-3" />
                            {t('partner.currentLevel', 'Текущий уровень')}
                          </span>
                        </motion.div>
                      )}
                      
                      <div
                        className="relative bg-card/50 backdrop-blur-xl rounded-3xl p-5 border border-border/50 overflow-hidden"
                        style={{
                          boxShadow: idx === currentLevelIndex 
                            ? "0 0 30px rgba(191, 255, 0, 0.2)" 
                            : "none"
                        }}
                      >
                        {/* Decorative gradient */}
                        <div 
                          className="absolute top-0 right-0 w-32 h-32 opacity-20"
                          style={{
                            background: "radial-gradient(circle at top right, rgba(191, 255, 0, 0.5) 0%, transparent 70%)"
                          }}
                        />
                        
                        {/* Level header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{level.icon}</span>
                            <span className="text-xl font-bold">{level.name}</span>
                          </div>
                          {level.maxFriends !== Infinity && (
                            <span className="text-sm text-muted-foreground">
                              <span className="text-foreground font-bold">{currentFriends}</span>
                              /{level.maxFriends}
                            </span>
                          )}
                        </div>
                        
                        {/* Benefits */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-muted/50 rounded-2xl p-4 text-center">
                            <p className="text-xs text-muted-foreground mb-1">
                              {t('partner.cardIssuance', 'За выпуск карт')}
                            </p>
                            <p className="text-2xl font-bold" style={{ color: "#BFFF00" }}>
                              {level.cardPercent}%
                            </p>
                          </div>
                          <div className="bg-muted/50 rounded-2xl p-4 text-center">
                            <p className="text-xs text-muted-foreground mb-1">
                              {t('partner.fromTransactions', 'С транзакций')}
                            </p>
                            <p className="text-2xl font-bold" style={{ color: "#BFFF00" }}>
                              {level.txPercent}%
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Carousel dots */}
            <div className="flex justify-center gap-1.5 mt-3">
              {LEVELS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => emblaApi?.scrollTo(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === selectedLevelIndex 
                      ? "w-6 bg-[#BFFF00]" 
                      : "w-2 bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
          </div>
          
          {/* Referral Balance */}
          <div className="px-4 mb-6">
            <div className="bg-card/50 backdrop-blur-xl rounded-2xl p-5 border border-border/50">
              <p className="text-sm text-muted-foreground mb-1">
                {t('partner.referralBalance', 'Реферальный счёт')} (USDT)
              </p>
              <p className="text-4xl font-bold mb-4">{referralBalance}</p>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t('partner.invited', 'Приглашено')}
                  </p>
                  <p className="text-xl font-bold">{totalInvited}</p>
                </div>
                <div className="border-l border-border/50 pl-4">
                  <p className="text-xs text-muted-foreground">
                    {t('partner.withdrawn', 'Выведено')}
                  </p>
                  <p className="text-xl font-bold">{totalWithdrawn}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Share buttons row */}
          <div className="px-4 mb-6">
            <p className="text-sm text-muted-foreground text-center mb-3">
              {t('partner.shareVia', 'Поделиться через')}
            </p>
            <div className="flex justify-center gap-4">
              <motion.button
                onClick={handleShareTelegram}
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                className="relative w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #0088cc 0%, #00c6ff 100%)",
                  boxShadow: "0 8px 24px rgba(0, 136, 204, 0.4)",
                }}
              >
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                />
                <Send className="w-6 h-6 text-white relative z-10" />
              </motion.button>
              
              <motion.button
                onClick={handleCopyLink}
                whileHover={{ scale: 1.1, rotate: -5 }}
                whileTap={{ scale: 0.9 }}
                className="relative w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
                  boxShadow: "0 8px 24px rgba(124, 58, 237, 0.4)",
                }}
              >
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.3 }}
                />
                <Copy className="w-6 h-6 text-white relative z-10" />
              </motion.button>
              
              <motion.button
                onClick={handleShare}
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                className="relative w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
                  boxShadow: "0 8px 24px rgba(16, 185, 129, 0.4)",
                }}
              >
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.6 }}
                />
                <Share2 className="w-6 h-6 text-white relative z-10" />
              </motion.button>
            </div>
          </div>
        </div>
        
        {/* Floating Invite Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/80 to-transparent pb-6">
          <motion.button
            onClick={handleShare}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 font-bold rounded-2xl relative overflow-hidden flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(135deg, #BFFF00 0%, #7FFF00 100%)",
              boxShadow: "0 8px 32px rgba(127, 255, 0, 0.4)",
            }}
          >
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
            />
            <Users className="w-5 h-5 text-black relative z-10" />
            <span className="text-black relative z-10">
              {t('partner.inviteFriendsButton', 'Пригласить друзей')}
            </span>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default Partner;

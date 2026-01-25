import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Users, Send, Copy, Share2 } from "lucide-react";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import partnerGrowthImage from "@/assets/partner-network-hero.png";
import { LevelCarousel, LEVELS } from "@/components/partner/LevelCarousel";

const Partner = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Mock data - will be replaced with real data from API
  const [currentFriends] = useState(0);
  const [referralBalance] = useState(0);
  const [totalInvited] = useState(0);
  const [totalWithdrawn] = useState(0);
  const [selectedLevelIndex, setSelectedLevelIndex] = useState(0);
  
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
  
  const handleLevelChange = (levelIndex: number) => {
    setSelectedLevelIndex(levelIndex);
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col max-w-[800px] mx-auto">
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between h-14 px-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base font-semibold">{t('partner.program', 'Партнёрская программа')}</h1>
            <LanguageSwitcher />
          </div>
        </header>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-28">
          {/* Hero Section */}
          <div className="relative px-4 pt-4 pb-6">
            {/* Fantastic Hero Banner with Multi-layer Glow */}
            <div className="relative w-full rounded-2xl overflow-visible mb-4">
              {/* Outer glow layer - large soft pulse */}
              <motion.div 
                className="absolute -inset-8 rounded-[2rem] z-0"
                style={{ 
                  background: "radial-gradient(ellipse at center, rgba(16, 185, 129, 0.6) 0%, rgba(16, 185, 129, 0.2) 50%, transparent 80%)",
                  filter: "blur(30px)"
                }}
                animate={{
                  opacity: [0.3, 0.8, 0.3],
                  scale: [0.95, 1.08, 0.95]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              {/* Middle glow layer - intense core */}
              <motion.div 
                className="absolute -inset-4 rounded-3xl z-0"
                style={{ 
                  background: "radial-gradient(ellipse at center, rgba(34, 197, 94, 0.8) 0%, rgba(16, 185, 129, 0.4) 40%, transparent 70%)",
                  filter: "blur(16px)"
                }}
                animate={{
                  opacity: [0.5, 1, 0.5],
                  scale: [0.98, 1.04, 0.98]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }}
              />
              
              {/* Inner glow layer - sharp accent */}
              <motion.div 
                className="absolute -inset-2 rounded-2xl z-0"
                style={{ 
                  background: "radial-gradient(ellipse at center, rgba(74, 222, 128, 0.9) 0%, rgba(34, 197, 94, 0.5) 30%, transparent 60%)",
                  filter: "blur(8px)"
                }}
                animate={{
                  opacity: [0.6, 1, 0.6],
                  scale: [1, 1.02, 1]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.25
                }}
              />
              
              {/* Dark theme - Lime neon outer glow */}
              <motion.div 
                className="absolute -inset-8 rounded-[2rem] z-0 hidden dark:block"
                style={{ 
                  background: "radial-gradient(ellipse at center, rgba(191, 255, 0, 0.7) 0%, rgba(127, 255, 0, 0.3) 50%, transparent 80%)",
                  filter: "blur(30px)"
                }}
                animate={{
                  opacity: [0.3, 0.9, 0.3],
                  scale: [0.95, 1.08, 0.95]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              {/* Dark theme - Lime neon middle glow */}
              <motion.div 
                className="absolute -inset-4 rounded-3xl z-0 hidden dark:block"
                style={{ 
                  background: "radial-gradient(ellipse at center, rgba(191, 255, 0, 0.9) 0%, rgba(127, 255, 0, 0.5) 40%, transparent 70%)",
                  filter: "blur(16px)"
                }}
                animate={{
                  opacity: [0.5, 1, 0.5],
                  scale: [0.98, 1.04, 0.98]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }}
              />
              
              {/* Dark theme - Lime neon inner glow */}
              <motion.div 
                className="absolute -inset-2 rounded-2xl z-0 hidden dark:block"
                style={{ 
                  background: "radial-gradient(ellipse at center, rgba(212, 255, 31, 1) 0%, rgba(191, 255, 0, 0.6) 30%, transparent 60%)",
                  filter: "blur(8px)"
                }}
                animate={{
                  opacity: [0.6, 1, 0.6],
                  scale: [1, 1.02, 1]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.25
                }}
              />
              
              {/* Image with enhanced shadow */}
              <motion.img 
                src={partnerGrowthImage} 
                alt={t('partner.inviteFriendsTitle', 'Приглашайте друзей')}
                className="relative z-10 w-full h-auto rounded-2xl shadow-2xl"
                style={{
                  boxShadow: "0 0 40px rgba(16, 185, 129, 0.4), 0 0 80px rgba(16, 185, 129, 0.2)"
                }}
                loading="eager"
                animate={{
                  boxShadow: [
                    "0 0 30px rgba(16, 185, 129, 0.3), 0 0 60px rgba(16, 185, 129, 0.15)",
                    "0 0 50px rgba(16, 185, 129, 0.5), 0 0 100px rgba(16, 185, 129, 0.25)",
                    "0 0 30px rgba(16, 185, 129, 0.3), 0 0 60px rgba(16, 185, 129, 0.15)"
                  ]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </div>
            <h2 className="text-xl font-bold text-center">
              {t('partner.inviteFriendsTitle', 'Приглашайте друзей')}
            </h2>
            
            {/* Progress milestones */}
            <div className="flex justify-between text-sm text-muted-foreground mb-2 px-2">
              <span>10 {t('partner.friends', 'друзей')}</span>
              <span>50 {t('partner.friends', 'друзей')}</span>
              <span>100 {t('partner.friends', 'друзей')}</span>
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
                animate={{ width: `${(selectedLevelIndex / (LEVELS.length - 1)) * 100}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
              
              {/* Progress indicator dot */}
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-background"
                style={{
                  background: "linear-gradient(135deg, #BFFF00 0%, #7FFF00 100%)",
                  boxShadow: "0 0 12px rgba(191, 255, 0, 0.8)",
                }}
                animate={{ 
                  left: `calc(${(selectedLevelIndex / (LEVELS.length - 1)) * 100}% - 8px)`,
                  scale: [1, 1.15, 1]
                }}
                transition={{ 
                  left: { duration: 0.4, ease: "easeOut" },
                  scale: { duration: 2, repeat: Infinity }
                }}
              />
            </div>
            
            {/* Level labels */}
            <div className="flex justify-between text-xs text-muted-foreground px-1">
              {LEVELS.map((level, idx) => (
                <motion.span 
                  key={level.id}
                  animate={{
                    color: idx <= selectedLevelIndex ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                    fontWeight: idx === selectedLevelIndex ? 600 : 400
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {level.name}
                </motion.span>
              ))}
            </div>
          </div>
          
          {/* Level Cards Carousel */}
          <LevelCarousel 
            currentFriends={currentFriends} 
            onLevelChange={handleLevelChange}
          />
          
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
            className="w-full py-4 font-bold rounded-2xl relative overflow-hidden flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-green-500 dark:from-[#BFFF00] dark:to-[#7FFF00] shadow-lg shadow-emerald-500/30 dark:shadow-[#7FFF00]/40"
          >
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
            />
            <Users className="w-5 h-5 text-white dark:text-black relative z-10" />
            <span className="text-white dark:text-black relative z-10">
              {t('partner.inviteFriendsButton', 'Пригласить друзей')}
            </span>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default Partner;

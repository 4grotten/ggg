import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, CreditCard, Wallet, ChevronRight, Sparkles, ChevronDown, Check, Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { VIRTUAL_CARD_ANNUAL_FEE, METAL_CARD_ANNUAL_FEE } from "@/lib/fees";
import { CardMiniature } from "./CardMiniature";
import { useCards } from "@/hooks/useCards";

interface OpenCardDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type CardType = "virtual" | "metal" | null;
type Step = "selectCard" | "selectPayment" | "payFromBalance";

export const OpenCardDrawer = ({ open, onOpenChange }: OpenCardDrawerProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("selectCard");
  const [selectedCard, setSelectedCard] = useState<CardType>(null);
  const [selectedPaymentCardId, setSelectedPaymentCardId] = useState<string | null>(null);
  const [showCardSelector, setShowCardSelector] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: cardsData } = useCards();
  const userCards = cardsData?.data || [];

  const handleCardSelect = (type: CardType) => {
    setSelectedCard(type);
    setStep("selectPayment");
  };

  const handlePaymentSelect = (method: "balance" | "crypto" | "bank") => {
    if (method === "crypto") {
      onOpenChange(false);
      navigate(`/open-card/pay-crypto?type=${selectedCard}`);
    } else if (method === "bank") {
      onOpenChange(false);
      navigate(`/open-card/pay-bank?type=${selectedCard}`);
    } else {
      // Open balance payment step
      if (userCards.length > 0 && !selectedPaymentCardId) {
        setSelectedPaymentCardId(userCards[0].id);
      }
      setStep("payFromBalance");
    }
  };

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsProcessing(false);
    toast.success(t('openCard.paymentSuccess'));
    handleClose();
  };

  const handleBack = () => {
    if (step === "payFromBalance") {
      setStep("selectPayment");
    } else {
      setStep("selectCard");
      setSelectedCard(null);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep("selectCard");
      setSelectedCard(null);
      setSelectedPaymentCardId(null);
      setShowCardSelector(false);
      setIsProcessing(false);
    }, 300);
  };

  const cardIssuanceFee = selectedCard === "virtual" ? VIRTUAL_CARD_ANNUAL_FEE : METAL_CARD_ANNUAL_FEE;
  const selectedPaymentCard = userCards.find(c => c.id === selectedPaymentCardId);
  const hasEnoughBalance = selectedPaymentCard && (selectedPaymentCard.balance || 0) >= cardIssuanceFee;

  const formatBalance = (amount: number) => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent className="bg-background/95 backdrop-blur-xl border-t border-border/50 max-w-[800px] mx-auto">
        <DrawerHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-lg font-semibold">
              {step === "selectCard" ? t('openCard.title') : 
               step === "selectPayment" ? t('openCard.paymentTitle') :
               t('openCard.payFromBalance')}
            </DrawerTitle>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </DrawerHeader>

        <div className="p-4 pb-8">
          <AnimatePresence mode="wait">
            {step === "selectCard" ? (
              <motion.div
                key="selectCard"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <p className="text-sm text-muted-foreground mb-4">
                  {t('openCard.selectCardDescription')}
                </p>

                {/* Cards Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Virtual Card Option */}
                  <motion.button
                    onClick={() => handleCardSelect("virtual")}
                    className="relative group w-full"
                    whileTap={{ scale: 0.97 }}
                  >
                    <CardMiniature type="virtual" />
                    
                    {/* Overlay with info */}
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent rounded-b-2xl">
                      <div className="flex items-center justify-between">
                        <div className="text-left">
                          <span className="text-xs text-white/70 flex items-center gap-1">
                            <span className="px-1.5 py-0.5 rounded bg-lime-500/30 text-lime-300 text-[10px]">
                              {t('openCard.instant')}
                            </span>
                          </span>
                        </div>
                        <span className="text-sm font-bold text-white">
                          {VIRTUAL_CARD_ANNUAL_FEE.toFixed(0)} AED
                        </span>
                      </div>
                    </div>
                    
                    {/* Hover effect */}
                    <div className="absolute inset-0 rounded-2xl ring-2 ring-transparent group-hover:ring-primary/50 transition-all" />
                  </motion.button>

                  {/* Metal Card Option */}
                  <motion.button
                    onClick={() => handleCardSelect("metal")}
                    className="relative group w-full"
                    whileTap={{ scale: 0.97 }}
                  >
                    <CardMiniature type="metal" />
                    
                    {/* Overlay with info */}
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent rounded-b-2xl">
                      <div className="flex items-center justify-between">
                        <div className="text-left">
                          <span className="text-xs text-white/70 flex items-center gap-1">
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300 text-[10px] flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" />
                              {t('openCard.premium')}
                            </span>
                          </span>
                        </div>
                        <span className="text-sm font-bold text-white">
                          {METAL_CARD_ANNUAL_FEE.toFixed(0)} AED
                        </span>
                      </div>
                    </div>
                    
                    {/* Hover effect */}
                    <div className="absolute inset-0 rounded-2xl ring-2 ring-transparent group-hover:ring-primary/50 transition-all" />
                  </motion.button>
                </div>
              </motion.div>
            ) : step === "selectPayment" ? (
              <motion.div
                key="selectPayment"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Selected Card Summary */}
                <div className="p-4 rounded-2xl bg-muted/50 border border-border/50">
                  <div className="flex items-center gap-4">
                    <div className="w-20 shrink-0">
                      <CardMiniature type={selectedCard || "virtual"} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {selectedCard === "virtual" ? t('openCard.virtualCard') : t('openCard.metalCard')}
                      </p>
                      <p className="text-xs text-muted-foreground">{t('openCard.annualFee')}</p>
                      {/* Benefits */}
                      <div className="mt-2 space-y-0.5">
                        {selectedCard === "virtual" ? (
                          <>
                            {['virtualBenefit1', 'virtualBenefit2', 'virtualBenefit3'].map((key, index) => (
                              <motion.p
                                key={key}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.15 + index * 0.12, duration: 0.25 }}
                                className="text-[11px] text-muted-foreground"
                              >
                                • {t(`openCard.${key}`)}
                              </motion.p>
                            ))}
                          </>
                        ) : (
                          <>
                            {['metalBenefit1', 'metalBenefit2', 'metalBenefit3'].map((key, index) => (
                              <motion.p
                                key={key}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.15 + index * 0.12, duration: 0.25 }}
                                className="text-[11px] text-muted-foreground"
                              >
                                • {t(`openCard.${key}`)}
                              </motion.p>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                    <span className="text-xl font-bold text-primary">{cardIssuanceFee} AED</span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  {t('openCard.selectPaymentMethod')}
                </p>

                {/* Pay from Balance */}
                <button
                  onClick={() => handlePaymentSelect("balance")}
                  className="w-full p-4 rounded-2xl border border-border/50 bg-muted/30 hover:bg-muted/50 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-blue-500" />
                    </div>
                    <div className="flex-1 text-left">
                      <span className="font-semibold block">{t('openCard.payFromBalance')}</span>
                      <p className="text-sm text-muted-foreground">
                        {t('openCard.payFromBalanceDescription')}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                {/* Pay with Crypto */}
                <button
                  onClick={() => handlePaymentSelect("crypto")}
                  className="w-full p-4 rounded-2xl border border-border/50 bg-muted/30 hover:bg-muted/50 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-green-500" />
                    </div>
                    <div className="flex-1 text-left">
                      <span className="font-semibold block">{t('openCard.payWithCrypto')}</span>
                      <p className="text-sm text-muted-foreground">
                        {t('openCard.payWithCryptoDescription')}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                {/* Pay with Bank Transfer */}
                <button
                  onClick={() => handlePaymentSelect("bank")}
                  className="w-full p-4 rounded-2xl border border-border/50 bg-muted/30 hover:bg-muted/50 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-amber-500" />
                    </div>
                    <div className="flex-1 text-left">
                      <span className="font-semibold block">{t('openCard.payWithBank')}</span>
                      <p className="text-sm text-muted-foreground">
                        {t('openCard.payWithBankDescription')}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                {/* Back Button */}
                <button
                  onClick={handleBack}
                  className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← {t('common.back')}
                </button>
              </motion.div>
            ) : step === "payFromBalance" ? (
              <motion.div
                key="payFromBalance"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Payment Details */}
                <div className="p-4 rounded-2xl bg-muted/50 border border-border/50 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-16 shrink-0">
                      <CardMiniature type={selectedCard || "virtual"} />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">
                        {selectedCard === "virtual" ? t('openCard.virtualCard') : t('openCard.metalCard')}
                      </p>
                      <p className="text-xs text-muted-foreground">{t('openCard.annualServiceDescription')}</p>
                    </div>
                  </div>

                  {/* Fee Breakdown */}
                  <div className="space-y-2 pt-3 border-t border-border/50">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('openCard.annualFee')}</span>
                      <span className="font-medium">{formatBalance(cardIssuanceFee)} AED</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('openCard.servicePeriod')}</span>
                      <span className="font-medium">12 {t('openCard.months')}</span>
                    </div>
                    <div className="flex justify-between text-base pt-2 border-t border-border/50">
                      <span className="font-semibold">{t('openCard.totalToPay')}</span>
                      <span className="font-bold text-primary">{formatBalance(cardIssuanceFee)} AED</span>
                    </div>
                  </div>
                </div>

                {/* Card Selector */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">{t('openCard.payFromCard')}</label>
                  <div className="relative">
                    <button
                      onClick={() => setShowCardSelector(!showCardSelector)}
                      className="w-full p-4 rounded-2xl border border-border/50 bg-muted/30 hover:bg-muted/50 transition-all flex items-center gap-3"
                    >
                      {selectedPaymentCard ? (
                        <>
                          <div className="w-10 shrink-0">
                            <CardMiniature type={selectedPaymentCard.type} />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-medium text-sm">{selectedPaymentCard.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {t('card.cardBalance')}: {formatBalance(selectedPaymentCard.balance || 0)} AED
                            </p>
                          </div>
                        </>
                      ) : (
                        <span className="text-muted-foreground">{t('openCard.selectCard')}</span>
                      )}
                      <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${showCardSelector ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Card Dropdown */}
                    <AnimatePresence>
                      {showCardSelector && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-background border border-border/50 rounded-2xl overflow-hidden shadow-lg z-10"
                        >
                          {userCards.map((card) => (
                            <button
                              key={card.id}
                              onClick={() => {
                                setSelectedPaymentCardId(card.id);
                                setShowCardSelector(false);
                              }}
                              className="w-full p-3 hover:bg-muted/50 transition-colors flex items-center gap-3"
                            >
                              <div className="w-10 shrink-0">
                                <CardMiniature type={card.type} />
                              </div>
                              <div className="flex-1 text-left">
                                <p className="font-medium text-sm">{card.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatBalance(card.balance || 0)} AED
                                </p>
                              </div>
                              {selectedPaymentCardId === card.id && (
                                <Check className="w-5 h-5 text-primary" />
                              )}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Insufficient Balance Warning */}
                {selectedPaymentCard && !hasEnoughBalance && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive"
                  >
                    {t('openCard.insufficientBalance')}
                  </motion.div>
                )}

                {/* Confirm Button */}
                <button
                  onClick={handleConfirmPayment}
                  disabled={!hasEnoughBalance || isProcessing}
                  className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      {t('openCard.confirmPayment')} {formatBalance(cardIssuanceFee)} AED
                    </>
                  )}
                </button>

                {/* Back Button */}
                <button
                  onClick={handleBack}
                  className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← {t('common.back')}
                </button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

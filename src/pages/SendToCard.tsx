import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, CreditCard, Check, ClipboardPaste, X, Loader2, CheckCircle2, AlertCircle, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { PoweredByFooter } from "@/components/layout/PoweredByFooter";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CARD_TO_CARD_FEE_PERCENT } from "@/lib/fees";

// Transfer request/response types
interface TransferRequest {
  fromCardId: string;
  toCardNumber: string;
  recipientName: string;
  amount: number;
  fee: number;
  totalAmount: number;
}

interface TransferResponse {
  success: boolean;
  transactionId?: string;
  error?: string;
}

// API-ready function to submit card-to-card transfer
// TODO: Replace with actual API call
const submitTransfer = async (request: TransferRequest): Promise<TransferResponse> => {
  console.log("Submitting transfer:", request);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Mock successful response
  return {
    success: true,
    transactionId: `TXN-${Date.now()}`
  };
  
  // Example error response for testing:
  // return { success: false, error: "Transfer failed. Please try again." };
};

// Type for user card
interface UserCard {
  id: string;
  name: string;
  lastFour: string;
  balance: number;
  type: "virtual" | "metal";
}

// API-ready function to fetch user cards
// TODO: Replace with actual API call
const fetchUserCards = async (): Promise<{ success: boolean; cards: UserCard[]; error?: string }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 600));
  
  // Mock successful response
  const mockCards: UserCard[] = [
    { id: "1", name: "Visa Virtual", lastFour: "7617", balance: 213757.49, type: "virtual" },
    { id: "2", name: "Visa Metal", lastFour: "4521", balance: 256508.98, type: "metal" },
  ];
  
  return { success: true, cards: mockCards };
  
  // Example error response for testing:
  // return { success: false, cards: [], error: "Failed to load cards" };
};

// API-ready function to get recipient name by card number
// TODO: Replace with actual API call
const getRecipientName = async (cardNumber: string): Promise<{ found: boolean; name: string | null }> => {
  const cleanNumber = cardNumber.replace(/\s/g, "");
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  if (cleanNumber.length === 16) {
    // Card with all zeros - not found example
    if (cleanNumber === "0000000000000000") {
      return { found: false, name: null };
    }
    
    // Mock successful responses for demo
    const mockNames: Record<string, string> = {
      "4532890123457890": "JOHN SMITH",
      "5425233430109903": "ANNA JOHNSON",
    };
    
    // Return found for any valid 16-digit card (simulating real API)
    return { 
      found: true, 
      name: mockNames[cleanNumber] || "RECIPIENT NAME" 
    };
  }
  
  return { found: false, name: null };
};

// Format card number with spaces
const formatCardNumber = (value: string): string => {
  const cleaned = value.replace(/\D/g, "").slice(0, 16);
  const groups = cleaned.match(/.{1,4}/g);
  return groups ? groups.join(" ") : cleaned;
};

type Step = "card" | "amount" | "confirm";

const SendToCard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { toast } = useToast();
  
  // Check if this is a referral withdrawal
  const isReferralWithdrawal = location.state?.isReferralWithdrawal || false;
  const referralBalance = location.state?.referralBalance || 0;
  
  const [step, setStep] = useState<Step>("card");
  const [cardNumber, setCardNumber] = useState("");
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [recipientNotFound, setRecipientNotFound] = useState(false);
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  
  // Cards state
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>("");
  const [selectedDestinationCardId, setSelectedDestinationCardId] = useState<string>("");
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [cardsError, setCardsError] = useState<string | null>(null);

  const selectedCard = userCards.find((c) => c.id === selectedCardId);
  const selectedDestinationCard = userCards.find((c) => c.id === selectedDestinationCardId);
  
  // Use referral balance or card balance
  const availableBalance = isReferralWithdrawal ? referralBalance : (selectedCard?.balance || 0);
  
  // Fetch cards on mount for referral withdrawal, or on amount step for regular transfers
  useEffect(() => {
    const shouldFetchCards = isReferralWithdrawal 
      ? (step === "card" && userCards.length === 0)
      : (step === "amount" && userCards.length === 0);
      
    if (shouldFetchCards) {
      setIsLoadingCards(true);
      setCardsError(null);
      
      fetchUserCards().then((result) => {
        if (result.success && result.cards.length > 0) {
          setUserCards(result.cards);
          // For referral withdrawal, set destination card
          if (isReferralWithdrawal) {
            setSelectedDestinationCardId(result.cards[0].id);
          } else {
            setSelectedCardId(result.cards[0].id);
          }
        } else {
          setCardsError(result.error || t('send.failedToLoadCards'));
        }
        setIsLoadingCards(false);
      }).catch(() => {
        setCardsError(t('send.failedToLoadCards'));
        setIsLoadingCards(false);
      });
    }
  }, [step, userCards.length, t, isReferralWithdrawal]);
  const cleanCardNumber = cardNumber.replace(/\s/g, "");
  const isCardValid = cleanCardNumber.length === 16;
  
  // Parse amount removing commas for calculations
  const parseAmount = (value: string): number => {
    return parseFloat(value.replace(/,/g, "")) || 0;
  };
  
  const numericAmount = parseAmount(amount);
  const isAmountValid = numericAmount > 0 && numericAmount <= availableBalance;

  // Check recipient name when card number is complete
  useEffect(() => {
    if (isCardValid) {
      setIsLoading(true);
      setRecipientNotFound(false);
      
      getRecipientName(cardNumber).then((result) => {
        if (result.found && result.name) {
          setRecipientName(result.name);
          setRecipientNotFound(false);
        } else {
          setRecipientName(null);
          setRecipientNotFound(true);
        }
        setIsLoading(false);
      }).catch(() => {
        setRecipientName(null);
        setRecipientNotFound(true);
        setIsLoading(false);
      });
    } else {
      setRecipientName(null);
      setRecipientNotFound(false);
    }
  }, [cardNumber, isCardValid]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const formatted = formatCardNumber(text);
      setCardNumber(formatted);
    } catch (err) {
      console.error("Failed to read clipboard");
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove everything except digits and decimal point
    let value = e.target.value.replace(/[^0-9.]/g, "");
    
    // Prevent multiple decimals
    const parts = value.split(".");
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    
    // Format with thousand separators
    if (parts[0]) {
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    
    setAmount(parts.join("."));
  };

  const handleNext = () => {
    if (step === "card") {
      // For referral withdrawal, check if destination card is selected
      if (isReferralWithdrawal && selectedDestinationCardId) {
        setStep("amount");
      } else if (!isReferralWithdrawal && isCardValid && recipientName) {
        setStep("amount");
      }
    } else if (step === "amount" && isAmountValid) {
      setStep("confirm");
    }
  };

  const handleBack = () => {
    if (step === "amount") {
      setStep("card");
    } else if (step === "confirm") {
      setStep("amount");
    } else {
      navigate(-1);
    }
  };

  const handleConfirm = async () => {
    // For referral withdrawal, check destination card; for regular transfer, check source card and recipient
    if (isReferralWithdrawal) {
      if (!selectedDestinationCard) return;
    } else {
      if (!selectedCard || !recipientName) return;
    }
    
    setIsSubmitting(true);
    setTransferError(null);
    
    try {
      const request: TransferRequest = {
        fromCardId: isReferralWithdrawal ? "referral" : selectedCardId,
        toCardNumber: isReferralWithdrawal 
          ? `****${selectedDestinationCard?.lastFour}` 
          : cardNumber.replace(/\s/g, ""),
        recipientName: isReferralWithdrawal 
          ? (selectedDestinationCard?.name || "") 
          : (recipientName || ""),
        amount: numericAmount,
        fee: fee,
        totalAmount: totalAmount
      };
      
      const response = await submitTransfer(request);
      
      if (response.success) {
        setTransferSuccess(true);
        toast({
          title: t('send.transferSuccess'),
          description: t('send.transferSuccessDescription', { 
            amount: numericAmount.toFixed(2),
            recipient: recipientName 
          }),
        });
        
        // Navigate after short delay to show success
        setTimeout(() => {
          navigate(isReferralWithdrawal ? "/partner" : "/");
        }, 2000);
      } else {
        setTransferError(response.error || t('send.transferFailed'));
        toast({
          variant: "destructive",
          title: t('send.transferFailed'),
          description: response.error || t('send.tryAgainLater'),
        });
      }
    } catch (error) {
      console.error("Transfer error:", error);
      setTransferError(t('send.transferFailed'));
      toast({
        variant: "destructive",
        title: t('send.transferFailed'),
        description: t('send.tryAgainLater'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fee = numericAmount * (CARD_TO_CARD_FEE_PERCENT / 100);
  const totalAmount = numericAmount + fee;

  return (
    <MobileLayout
      header={
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm">{t('send.back')}</span>
        </button>
      }
      rightAction={<LanguageSwitcher />}
    >
      <div className="px-4 py-6 pb-32 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold">{t('send.sendToCard')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('send.easyCardTransfer').split('EASY CARD')[0]}
            <span className="font-bold text-primary text-base">EASY CARD</span>
            {t('send.easyCardTransfer').split('EASY CARD')[1]}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2">
          {["card", "amount", "confirm"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step === s
                    ? "bg-[#007AFF] text-white"
                    : ["card", "amount", "confirm"].indexOf(step) > i
                    ? "bg-green-500 text-white"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {["card", "amount", "confirm"].indexOf(step) > i ? (
                  <Check className="w-4 h-4" />
                ) : (
                  i + 1
                )}
              </div>
              {i < 2 && (
                <div
                  className={`w-8 h-0.5 ${
                    ["card", "amount", "confirm"].indexOf(step) > i
                      ? "bg-green-500"
                      : "bg-secondary"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Card Selection (Referral) or Card Number Input (Regular) */}
        {step === "card" && (
          <div className="space-y-4 animate-fade-in">
            {isReferralWithdrawal ? (
              <>
                {/* Referral Balance Source */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('send.fromAccount', 'С счёта')}</label>
                  <div className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">{t('partner.referralBalance', 'Реферальный счёт')}</p>
                        <p className="text-sm text-muted-foreground">
                          {referralBalance.toFixed(2)} AED
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Loading Cards State */}
                {isLoadingCards && (
                  <div className="bg-secondary rounded-xl p-6 flex items-center justify-center gap-3 animate-pulse">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-muted-foreground">{t('send.loadingCards')}</span>
                  </div>
                )}

                {/* Cards Error State */}
                {cardsError && !isLoadingCards && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                      <X className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-red-500">{t('send.failedToLoadCards')}</p>
                      <button 
                        onClick={() => {
                          setCardsError(null);
                          setIsLoadingCards(true);
                          fetchUserCards().then((result) => {
                            if (result.success && result.cards.length > 0) {
                              setUserCards(result.cards);
                              setSelectedDestinationCardId(result.cards[0].id);
                            } else {
                              setCardsError(result.error || t('send.failedToLoadCards'));
                            }
                            setIsLoadingCards(false);
                          }).catch(() => {
                            setCardsError(t('send.failedToLoadCards'));
                            setIsLoadingCards(false);
                          });
                        }}
                        className="text-sm text-primary hover:underline mt-1"
                      >
                        {t('send.tryAgain')}
                      </button>
                    </div>
                  </div>
                )}

                {/* Select Destination Card */}
                {!isLoadingCards && !cardsError && userCards.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('send.toCard', 'На карту')}</label>
                    <Select value={selectedDestinationCardId} onValueChange={setSelectedDestinationCardId}>
                      <SelectTrigger className="h-14 rounded-xl">
                        <SelectValue placeholder={t('send.selectCard')} />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        {userCards.map((card) => (
                          <SelectItem key={card.id} value={card.id} className="data-[state=checked]:text-white">
                            <div className="flex items-center justify-between w-full gap-4">
                              <span>{card.name} •••• {card.lastFour}</span>
                              <span className="text-muted-foreground group-data-[state=checked]:text-white/90">{card.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('send.cardNumber')}</label>
                  <div className="relative">
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="0000 0000 0000 0000"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      className="text-lg font-mono tracking-wider h-14 pr-12 no-underline decoration-transparent"
                      maxLength={19}
                    />
                    <button
                      type="button"
                      onClick={handlePasteFromClipboard}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-secondary transition-colors"
                      aria-label="Paste from clipboard"
                    >
                      <ClipboardPaste className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                {isLoading && (
                  <div className="bg-secondary rounded-xl p-4 animate-pulse">
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                )}

                {recipientName && !isLoading && (
                  <div className="bg-secondary rounded-xl p-4 flex items-center gap-3 animate-fade-in">
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('send.recipient')}</p>
                      <p className="font-semibold">{recipientName}</p>
                    </div>
                  </div>
                )}

                {recipientNotFound && !isLoading && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
                    <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                      <X className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-red-500">{t('send.recipientNotFound')}</p>
                      <p className="text-sm text-muted-foreground">{t('send.checkCardNumber')}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Step 2: Amount */}
        {step === "amount" && (
          <div className="space-y-4 animate-fade-in">
            {/* Destination Preview - for referral withdrawal show selected card */}
            {isReferralWithdrawal ? (
              <div className="bg-secondary rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#007AFF] flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium">{selectedDestinationCard?.name}</p>
                  <p className="text-sm text-muted-foreground">•••• {selectedDestinationCard?.lastFour}</p>
                </div>
              </div>
            ) : (
              <div className="bg-secondary rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#007AFF] flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium">{recipientName}</p>
                  <p className="text-sm text-muted-foreground no-underline decoration-transparent">{cardNumber}</p>
                </div>
              </div>
            )}

            {/* Select Source - Referral Balance or Cards */}
            {isReferralWithdrawal ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('send.fromAccount', 'С счёта')}</label>
                <div className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">{t('partner.referralBalance', 'Реферальный счёт')}</p>
                      <p className="text-sm text-muted-foreground">
                        {referralBalance.toFixed(2)} AED
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Loading Cards State */}
                {isLoadingCards && (
                  <div className="bg-secondary rounded-xl p-6 flex items-center justify-center gap-3 animate-pulse">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-muted-foreground">{t('send.loadingCards')}</span>
                  </div>
                )}

                {/* Cards Error State */}
                {cardsError && !isLoadingCards && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                      <X className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-red-500">{t('send.failedToLoadCards')}</p>
                      <button 
                        onClick={() => {
                          setCardsError(null);
                          setIsLoadingCards(true);
                          fetchUserCards().then((result) => {
                            if (result.success && result.cards.length > 0) {
                              setUserCards(result.cards);
                              setSelectedCardId(result.cards[0].id);
                            } else {
                              setCardsError(result.error || t('send.failedToLoadCards'));
                            }
                            setIsLoadingCards(false);
                          }).catch(() => {
                            setCardsError(t('send.failedToLoadCards'));
                            setIsLoadingCards(false);
                          });
                        }}
                        className="text-sm text-primary hover:underline mt-1"
                      >
                        {t('send.tryAgain')}
                      </button>
                    </div>
                  </div>
                )}

                {/* Select Source Card - Only show when cards loaded */}
                {!isLoadingCards && !cardsError && userCards.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('send.fromCard')}</label>
                    <Select value={selectedCardId} onValueChange={setSelectedCardId}>
                      <SelectTrigger className="h-14 rounded-xl">
                        <SelectValue placeholder={t('send.selectCard')} />
                      </SelectTrigger>
                      <SelectContent>
                        {userCards.map((card) => (
                          <SelectItem key={card.id} value={card.id} className="data-[state=checked]:text-white">
                            <div className="flex items-center justify-between w-full gap-4">
                              <span>{card.name} •••• {card.lastFour}</span>
                              <span className="text-muted-foreground group-data-[state=checked]:text-white/90">{card.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      {t('send.available')}: <span className="font-medium text-foreground">{selectedCard?.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED</span>
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Amount Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('send.amount')}</label>
              <div className="relative">
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={handleAmountChange}
                  className="text-2xl font-bold h-16 pr-28"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      // Max amount considering fee: balance = amount * (1 + fee/100)
                      const maxAmount = availableBalance / (1 + CARD_TO_CARD_FEE_PERCENT / 100);
                      const formatted = maxAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                      setAmount(formatted);
                    }}
                    className="px-2 py-1 text-xs font-bold bg-[#007AFF] text-white rounded-md hover:bg-[#0066DD] transition-colors"
                  >
                    MAX
                  </button>
                  <span className="text-muted-foreground font-medium">AED</span>
                </div>
              </div>
              {numericAmount > availableBalance && (
                <p className="text-sm text-red-500">{t('send.insufficientBalance')}</p>
              )}
              {numericAmount > 0 && numericAmount <= availableBalance && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{t('send.fee')} ({CARD_TO_CARD_FEE_PERCENT}%): {fee.toFixed(2)} AED</span>
                  <span>{t('send.total')}: {totalAmount.toFixed(2)} AED</span>
                </div>
              )}
            </div>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {[50, 100, 250, 500].map((quickAmount) => (
                <Button
                  key={quickAmount}
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setAmount(quickAmount.toString())}
                  disabled={quickAmount > (selectedCard?.balance || 0)}
                >
                  {quickAmount}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === "confirm" && (
          <div className="space-y-4 animate-fade-in">
            {/* Success State */}
            {transferSuccess && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 flex flex-col items-center gap-3 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <p className="text-lg font-semibold text-green-600">{t('send.transferSuccess')}</p>
                <p className="text-sm text-muted-foreground text-center">
                  {t('send.redirecting')}
                </p>
              </div>
            )}

            {/* Error State */}
            {transferError && !transferSuccess && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
                <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-500">{t('send.transferFailed')}</p>
                  <p className="text-sm text-muted-foreground">{transferError}</p>
                </div>
              </div>
            )}

            {/* Transfer Details */}
            {!transferSuccess && (
              <div className="bg-secondary rounded-2xl p-5 space-y-4">
                <div className="text-center pb-4 border-b border-border">
                  <p className="text-sm text-muted-foreground mb-1">{t('send.youreSending')}</p>
                  <p className="text-3xl font-bold">{numericAmount.toFixed(2)} AED</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('send.to')}</span>
                    <span className="font-medium">
                      {isReferralWithdrawal 
                        ? `${selectedDestinationCard?.name} •••• ${selectedDestinationCard?.lastFour}`
                        : recipientName
                      }
                    </span>
                  </div>
                  {!isReferralWithdrawal && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('send.card')}</span>
                      <span className="font-mono no-underline decoration-transparent">{cardNumber}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('send.from')}</span>
                    <span className="font-medium">
                      {isReferralWithdrawal 
                        ? t('partner.referralBalance', 'Реферальный счёт')
                        : `${selectedCard?.name} •••• ${selectedCard?.lastFour}`
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('send.fee')} ({CARD_TO_CARD_FEE_PERCENT}%)</span>
                    <span>{fee.toFixed(2)} AED</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-border">
                    <span className="font-medium">{t('send.total')}</span>
                    <span className="font-bold">{totalAmount.toFixed(2)} AED</span>
                  </div>
                </div>
              </div>
            )}

            {!transferSuccess && (
              <p className="text-xs text-center text-muted-foreground">
                {t('send.transferTerms')}
              </p>
            )}

            <PoweredByFooter />
          </div>
        )}

        {/* Footer for other steps */}
        {step !== "confirm" && (
          <div className="pt-4">
            <PoweredByFooter />
          </div>
        )}
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 max-w-[800px] mx-auto">
        {step === "card" && (
          <Button
            className="w-full h-14 text-base font-semibold bg-primary/90 hover:bg-primary text-white rounded-xl active:scale-95 backdrop-blur-2xl border-2 border-white/50 shadow-lg transition-all"
            disabled={isReferralWithdrawal 
              ? (!selectedDestinationCardId || isLoadingCards) 
              : (!isCardValid || !recipientName || isLoading)
            }
            onClick={handleNext}
          >
            {t('send.continue')}
          </Button>
        )}
        {step === "amount" && (
          <Button
            className="w-full h-14 text-base font-semibold bg-primary/90 hover:bg-primary text-white rounded-xl active:scale-95 backdrop-blur-2xl border-2 border-white/50 shadow-lg transition-all"
            disabled={!isAmountValid}
            onClick={handleNext}
          >
            {t('send.continue')}
          </Button>
        )}
        {step === "confirm" && !transferSuccess && (
          <Button
            className="w-full h-14 text-base font-semibold bg-primary/90 hover:bg-primary text-white rounded-xl active:scale-95 backdrop-blur-2xl border-2 border-white/50 shadow-lg transition-all"
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('send.processing')}
              </span>
            ) : (
              t('send.confirmTransfer')
            )}
          </Button>
        )}
      </div>
    </MobileLayout>
  );
};

export default SendToCard;

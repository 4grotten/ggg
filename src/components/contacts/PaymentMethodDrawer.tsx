/**
 * PaymentMethodDrawer - Step-by-step drawer for adding payment methods
 * Similar pattern to SendDrawer with animated items
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AnimatedDrawerItem, AnimatedDrawerContainer } from "@/components/ui/animated-drawer-item";
import { 
  CreditCard, 
  Building2, 
  Wallet, 
  Bitcoin, 
  ChevronRight, 
  ChevronLeft,
  X,
  Check,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { PaymentMethod, CRYPTO_NETWORKS } from "@/types/contact";
import { getCryptoIcon } from "@/components/icons/CryptoIcons";
import { toast } from "sonner";

interface PaymentMethodDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (payment: PaymentMethod) => void;
}

type Step = "type" | "network" | "details";

const PAYMENT_TYPES = [
  {
    id: "card" as const,
    icon: CreditCard,
    iconBg: "bg-primary",
    labelKey: "contacts.paymentTypes.card",
    subtitleKey: "contacts.paymentTypes.cardSubtitle",
  },
  {
    id: "iban" as const,
    icon: Building2,
    iconBg: "bg-purple-500",
    labelKey: "contacts.paymentTypes.iban",
    subtitleKey: "contacts.paymentTypes.ibanSubtitle",
  },
  {
    id: "crypto" as const,
    icon: Bitcoin,
    iconBg: "bg-orange-500",
    labelKey: "contacts.paymentTypes.crypto",
    subtitleKey: "contacts.paymentTypes.cryptoSubtitle",
  },
  {
    id: "wallet" as const,
    icon: Wallet,
    iconBg: "bg-green-500",
    labelKey: "contacts.paymentTypes.wallet",
    subtitleKey: "contacts.paymentTypes.walletSubtitle",
  },
  {
    id: "paypal" as const,
    icon: Wallet,
    iconBg: "bg-blue-500",
    labelKey: "contacts.paymentTypes.paypal",
    subtitleKey: "contacts.paymentTypes.paypalSubtitle",
  },
];

export const PaymentMethodDrawer = ({ 
  isOpen, 
  onClose, 
  onAdd 
}: PaymentMethodDrawerProps) => {
  const { t } = useTranslation();
  const { tap } = useHapticFeedback();
  
  const [step, setStep] = useState<Step>("type");
  const [selectedType, setSelectedType] = useState<PaymentMethod["type"] | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setStep("type");
    setSelectedType(null);
    setSelectedNetwork("");
    setLabel("");
    setValue("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSelectType = (type: PaymentMethod["type"]) => {
    tap();
    setSelectedType(type);
    
    if (type === "crypto") {
      setStep("network");
    } else {
      setStep("details");
    }
  };

  const handleSelectNetwork = (network: string) => {
    tap();
    setSelectedNetwork(network);
    setStep("details");
  };

  const handleBack = () => {
    tap();
    if (step === "details") {
      if (selectedType === "crypto") {
        setStep("network");
        setSelectedNetwork("");
      } else {
        setStep("type");
        setSelectedType(null);
      }
    } else if (step === "network") {
      setStep("type");
      setSelectedType(null);
    }
  };

  const handleSave = () => {
    if (!label.trim() || !value.trim() || !selectedType) {
      toast.error(t("contacts.paymentFieldsRequired"));
      return;
    }

    tap();
    setIsSaving(true);

    const newPayment: PaymentMethod = {
      id: `payment-${Date.now()}`,
      type: selectedType,
      label: label.trim(),
      value: value.trim(),
      network: selectedType === "crypto" ? selectedNetwork : undefined,
    };

    setTimeout(() => {
      onAdd(newPayment);
      setIsSaving(false);
      handleClose();
      toast.success(t("contacts.paymentAdded"));
    }, 300);
  };

  const getTitle = () => {
    switch (step) {
      case "type":
        return t("contacts.selectPaymentType");
      case "network":
        return t("contacts.selectNetwork");
      case "details":
        return t("contacts.enterDetails");
      default:
        return t("contacts.addPaymentMethod");
    }
  };

  const getPlaceholders = () => {
    switch (selectedType) {
      case "card":
        return { label: t("contacts.placeholders.cardLabel"), value: t("contacts.placeholders.cardValue") };
      case "iban":
        return { label: t("contacts.placeholders.ibanLabel"), value: t("contacts.placeholders.ibanValue") };
      case "crypto":
        return { label: t("contacts.placeholders.cryptoLabel"), value: t("contacts.placeholders.cryptoValue") };
      case "wallet":
        return { label: t("contacts.placeholders.walletLabel"), value: t("contacts.placeholders.walletValue") };
      case "paypal":
        return { label: t("contacts.placeholders.paypalLabel"), value: t("contacts.placeholders.paypalValue") };
      default:
        return { label: "", value: "" };
    }
  };

  const placeholders = getPlaceholders();

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DrawerContent className="bg-background/95 backdrop-blur-xl">
        <DrawerHeader className="relative flex items-center justify-center py-4">
          {step !== "type" && (
            <button
              onClick={handleBack}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-primary" />
            </button>
          )}
          <DrawerTitle className="text-center text-base font-semibold">
            {getTitle()}
          </DrawerTitle>
          <DrawerClose className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
            <X className="w-4 h-4 text-primary" />
          </DrawerClose>
        </DrawerHeader>
        
        <div className="px-4 pb-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Select Type */}
            {step === "type" && (
              <motion.div
                key="type"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <AnimatedDrawerContainer className="bg-muted/50 rounded-xl overflow-hidden">
                  {PAYMENT_TYPES.map((type, index) => (
                    <AnimatedDrawerItem key={type.id} index={index}>
                      <button
                        onClick={() => handleSelectType(type.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-4 hover:bg-muted/80 transition-colors",
                          index < PAYMENT_TYPES.length - 1 && "border-b border-border/50"
                        )}
                      >
                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", type.iconBg)}>
                          <type.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-base font-medium text-foreground">{t(type.labelKey)}</p>
                          <p className="text-sm text-muted-foreground">{t(type.subtitleKey)}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
                      </button>
                    </AnimatedDrawerItem>
                  ))}
                </AnimatedDrawerContainer>
              </motion.div>
            )}

            {/* Step 2: Select Network (for crypto) */}
            {step === "network" && (
              <motion.div
                key="network"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <AnimatedDrawerContainer className="bg-muted/50 rounded-xl overflow-hidden">
                  {CRYPTO_NETWORKS.map((network, index) => (
                    <AnimatedDrawerItem key={network.value} index={index}>
                      <button
                        onClick={() => handleSelectNetwork(network.value)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-4 hover:bg-muted/80 transition-colors",
                          index < CRYPTO_NETWORKS.length - 1 && "border-b border-border/50"
                        )}
                      >
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${network.color}20` }}>
                          {getCryptoIcon(network.value, 24)}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-base font-medium text-foreground">{network.label}</p>
                          <p className="text-sm text-muted-foreground">{network.subtitle}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
                      </button>
                    </AnimatedDrawerItem>
                  ))}
                </AnimatedDrawerContainer>
              </motion.div>
            )}

            {/* Step 3: Enter Details */}
            {step === "details" && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Selected type indicator */}
                <div className="bg-muted/50 rounded-xl p-4 flex items-center gap-3">
                  {PAYMENT_TYPES.find(t => t.id === selectedType) && (
                    <>
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        PAYMENT_TYPES.find(t => t.id === selectedType)?.iconBg
                      )}>
                        {(() => {
                          const Icon = PAYMENT_TYPES.find(t => t.id === selectedType)?.icon || CreditCard;
                          return <Icon className="w-5 h-5 text-white" />;
                        })()}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          {t(PAYMENT_TYPES.find(t => t.id === selectedType)?.labelKey || "")}
                        </p>
                        {selectedNetwork && (
                          <p className="text-sm text-muted-foreground">{selectedNetwork}</p>
                        )}
                      </div>
                      <Check className="w-5 h-5 text-primary" />
                    </>
                  )}
                </div>

                {/* Form fields */}
                <div className="space-y-3">
                  <Input
                    value={label}
                    onChange={e => setLabel(e.target.value)}
                    placeholder={placeholders.label}
                    className="h-12 rounded-xl bg-muted/50 border-0"
                  />
                  <Input
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    placeholder={placeholders.value}
                    className="h-12 rounded-xl bg-muted/50 border-0 font-mono"
                  />
                </div>

                {/* Save button */}
                <Button
                  onClick={handleSave}
                  disabled={!label.trim() || !value.trim() || isSaving}
                  className="w-full h-12 rounded-xl text-base font-semibold"
                >
                  {isSaving ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <Check className="w-5 h-5 mr-2" />
                  )}
                  {t("common.save")}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

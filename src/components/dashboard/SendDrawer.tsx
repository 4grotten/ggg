import { useNavigate } from "react-router-dom";
import { ChevronRight, QrCode, Landmark, CreditCard, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { AnimatedDrawerItem, AnimatedDrawerContainer } from "@/components/ui/animated-drawer-item";

interface SendDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SendDrawer = ({ open, onOpenChange }: SendDrawerProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const options = [
    {
      id: "card",
      icon: CreditCard,
      title: "Easy Card",
      subtitle: t("drawer.sendToCard"),
      iconBg: "bg-primary",
    },
    {
      id: "stablecoins",
      icon: QrCode,
      title: t("drawer.stablecoins"),
      subtitle: "USDT, USDC",
      iconBg: "bg-green-500",
    },
    {
      id: "bank",
      icon: Landmark,
      title: t("drawer.bankTransfer"),
      subtitle: "AED Wire",
      iconBg: "bg-purple-500",
    },
  ];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-background/95 backdrop-blur-xl">
        <DrawerHeader className="relative flex items-center justify-center py-4">
          <DrawerTitle className="text-center text-base font-semibold">
            {t("drawer.sendMoneyWith")}
          </DrawerTitle>
          <DrawerClose className="absolute right-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
            <X className="w-3.5 h-3.5 text-primary" />
          </DrawerClose>
        </DrawerHeader>
        
        <div className="px-4 pb-6">
          <AnimatedDrawerContainer className="bg-muted/50 rounded-xl overflow-hidden">
            {options.map((option, index) => (
              <AnimatedDrawerItem key={option.id} index={index}>
                <button
                  onClick={() => {
                    onOpenChange(false);
                    if (option.id === "card") {
                      navigate("/send-to-card");
                    } else if (option.id === "stablecoins") {
                      navigate("/send/crypto");
                    } else if (option.id === "bank") {
                      navigate("/send/bank");
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-muted/80 transition-colors ${
                    index < options.length - 1 ? 'border-b border-border/50' : ''
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full ${option.iconBg} flex items-center justify-center`}>
                    <option.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-base font-medium text-foreground">{option.title}</p>
                    <p className="text-sm text-muted-foreground">{option.subtitle}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
                </button>
              </AnimatedDrawerItem>
            ))}
          </AnimatedDrawerContainer>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { QRCodeSVG } from "qrcode.react";
import { 
  CreditCard, 
  Wallet, 
  ChevronRight, 
  Copy, 
  Share2, 
  Check, 
  User,
  Building2,
  ArrowLeft,
  Phone,
  Mail,
  AtSign,
  Globe,
  QrCode,
  Instagram,
  Send,
  Youtube,
  Twitter,
  Facebook,
  Linkedin,
  Github,
  Music2,
  MessageCircle,
  Gamepad2,
  Camera,
  Hash,
  Users,
  Video,
  LucideIcon,
  Sparkles,
  Contact,
  ScanLine
} from "lucide-react";
import { toast } from "sonner";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { useAuth } from "@/contexts/AuthContext";
import { useAvatar } from "@/contexts/AvatarContext";
import { getSocialNetworks, type SocialNetworkItem } from "@/services/api/authApi";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { SavedContact } from "@/types/contact";
import { AddContactDrawer } from "@/components/contacts/AddContactDrawer";
import { ContactsList } from "@/components/contacts/ContactsList";

interface ShareProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type ViewType = "main" | "businessCard" | "businessCardQR" | "card" | "account" | "crypto" | "asset" | "network" | "contacts";

// Social network detection with icons (same as SocialLinksInput)
interface SocialNetwork {
  id: string;
  name: string;
  patterns: string[];
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

const socialNetworks: SocialNetwork[] = [
  { id: "instagram", name: "Instagram", patterns: ["instagram.com", "instagr.am"], icon: Instagram, color: "text-pink-500", bgColor: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400" },
  { id: "telegram", name: "Telegram", patterns: ["t.me", "telegram.me", "telegram.org"], icon: Send, color: "text-blue-500", bgColor: "bg-blue-500" },
  { id: "tiktok", name: "TikTok", patterns: ["tiktok.com", "vm.tiktok.com"], icon: Music2, color: "text-foreground", bgColor: "bg-gradient-to-br from-cyan-400 via-black to-pink-500" },
  { id: "youtube", name: "YouTube", patterns: ["youtube.com", "youtu.be", "youtube.co"], icon: Youtube, color: "text-red-500", bgColor: "bg-red-500" },
  { id: "twitter", name: "X (Twitter)", patterns: ["twitter.com", "x.com"], icon: Twitter, color: "text-foreground", bgColor: "bg-black dark:bg-white" },
  { id: "facebook", name: "Facebook", patterns: ["facebook.com", "fb.com", "fb.me", "m.facebook.com"], icon: Facebook, color: "text-blue-600", bgColor: "bg-blue-600" },
  { id: "linkedin", name: "LinkedIn", patterns: ["linkedin.com", "lnkd.in"], icon: Linkedin, color: "text-blue-700", bgColor: "bg-blue-700" },
  { id: "github", name: "GitHub", patterns: ["github.com", "github.io"], icon: Github, color: "text-foreground", bgColor: "bg-gray-800 dark:bg-gray-200" },
  { id: "whatsapp", name: "WhatsApp", patterns: ["wa.me", "whatsapp.com", "api.whatsapp.com"], icon: MessageCircle, color: "text-green-500", bgColor: "bg-green-500" },
  { id: "snapchat", name: "Snapchat", patterns: ["snapchat.com", "snap.com"], icon: Camera, color: "text-yellow-400", bgColor: "bg-yellow-400" },
  { id: "discord", name: "Discord", patterns: ["discord.gg", "discord.com", "discordapp.com"], icon: Gamepad2, color: "text-indigo-500", bgColor: "bg-indigo-500" },
  { id: "twitch", name: "Twitch", patterns: ["twitch.tv", "twitch.com"], icon: Video, color: "text-purple-500", bgColor: "bg-purple-500" },
  { id: "reddit", name: "Reddit", patterns: ["reddit.com", "redd.it"], icon: Hash, color: "text-orange-500", bgColor: "bg-orange-500" },
  { id: "pinterest", name: "Pinterest", patterns: ["pinterest.com", "pin.it"], icon: Camera, color: "text-red-600", bgColor: "bg-red-600" },
  { id: "vk", name: "VK", patterns: ["vk.com", "vk.ru"], icon: Users, color: "text-blue-500", bgColor: "bg-blue-500" },
  { id: "ok", name: "OK", patterns: ["ok.ru", "odnoklassniki.ru"], icon: Users, color: "text-orange-500", bgColor: "bg-orange-500" },
  { id: "spotify", name: "Spotify", patterns: ["spotify.com", "open.spotify.com"], icon: Music2, color: "text-green-500", bgColor: "bg-green-500" },
];

// Social platform detection returning network info
const detectPlatform = (url: string): SocialNetwork => {
  const lowerUrl = url.toLowerCase();
  for (const network of socialNetworks) {
    for (const pattern of network.patterns) {
      if (lowerUrl.includes(pattern)) {
        return network;
      }
    }
  }
  return { id: "website", name: "Website", patterns: [], icon: Globe, color: "text-green-500", bgColor: "bg-green-500" };
};

interface BusinessCardField {
  id: string;
  label: string;
  value: string;
  icon: React.ReactNode;
  checked: boolean;
}

interface CardData {
  id: string;
  name: string;
  number: string;
  fullNumber: string;
  type: "virtual" | "metal";
  holder: string;
  expiry: string;
  cvv: string;
}

interface AccountData {
  id: string;
  name: string;
  iban: string;
  swift: string;
  bankName: string;
  currency: string;
}

interface CryptoAsset {
  id: string;
  name: string;
  symbol: string;
  color: string;
  iconType: "usdt" | "usdc" | "btc" | "eth";
  networks: CryptoNetwork[];
}

interface CryptoNetwork {
  id: string;
  name: string;
  address: string;
}

// Mock data - in real app would come from API/context
const mockCards: CardData[] = [
  {
    id: "1",
    name: "Virtual Card",
    number: "4532 •••• •••• 7823",
    fullNumber: "4532 8721 4563 7823",
    type: "virtual",
    holder: "JOHN DOE",
    expiry: "12/28",
    cvv: "***"
  },
  {
    id: "2", 
    name: "Metal Card",
    number: "5412 •••• •••• 3456",
    fullNumber: "5412 9087 6543 3456",
    type: "metal",
    holder: "JOHN DOE",
    expiry: "06/29",
    cvv: "***"
  }
];

const mockAccounts: AccountData[] = [
  {
    id: "1",
    name: "AED Account",
    iban: "AE07 0331 2345 6789 0123 456",
    swift: "ABORAEAD",
    bankName: "Abu Dhabi Commercial Bank",
    currency: "AED"
  }
];

const cryptoAssets: CryptoAsset[] = [
  {
    id: "usdt",
    name: "Tether",
    symbol: "USDT",
    color: "linear-gradient(135deg, #26A17B 0%, #1a7a5c 100%)",
    iconType: "usdt",
    networks: [
      { id: "trc20", name: "TRC20 (Tron)", address: "TJYxBLjN5gKPxTdMjrKPfpXUPe5BYUj9kD" },
      { id: "erc20", name: "ERC20 (Ethereum)", address: "0x742d35Cc6634C0532925a3b844Bc9e7595f1B2d1" },
      { id: "bep20", name: "BEP20 (BSC)", address: "0x8A2d35Cc6634C0532925a3b844Bc9e7595f1B2e2" }
    ]
  },
  {
    id: "usdc",
    name: "USD Coin",
    symbol: "USDC",
    color: "linear-gradient(135deg, #2775CA 0%, #1a5a9e 100%)",
    iconType: "usdc",
    networks: [
      { id: "erc20", name: "ERC20 (Ethereum)", address: "0x852d35Cc6634C0532925a3b844Bc9e7595f1C3e2" },
      { id: "bep20", name: "BEP20 (BSC)", address: "0x962d35Cc6634C0532925a3b844Bc9e7595f1D4f3" },
      { id: "polygon", name: "Polygon", address: "0xa72d35Cc6634C0532925a3b844Bc9e7595f1E5g4" }
    ]
  },
  {
    id: "btc",
    name: "Bitcoin",
    symbol: "BTC",
    color: "linear-gradient(135deg, #F7931A 0%, #c67515 100%)",
    iconType: "btc",
    networks: [
      { id: "btc", name: "Bitcoin Network", address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh" }
    ]
  },
  {
    id: "eth",
    name: "Ethereum",
    symbol: "ETH",
    color: "linear-gradient(135deg, #627EEA 0%, #4a63bb 100%)",
    iconType: "eth",
    networks: [
      { id: "erc20", name: "ERC20 (Ethereum)", address: "0x742d35Cc6634C0532925a3b844Bc9e7595f1B2d1" },
      { id: "bep20", name: "BEP20 (BSC)", address: "0x8A2d35Cc6634C0532925a3b844Bc9e7595f1B2e2" }
    ]
  }
];

// Crypto icon components
const CryptoIcon = ({ type, className = "w-5 h-5" }: { type: CryptoAsset["iconType"]; className?: string }) => {
  switch (type) {
    case "usdt":
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
          <path d="M17.922 17.383v-.002c-.11.008-.677.042-1.942.042-1.01 0-1.721-.03-1.971-.042v.003c-3.888-.171-6.79-.848-6.79-1.658 0-.809 2.902-1.486 6.79-1.66v2.644c.254.018.982.061 1.988.061 1.207 0 1.812-.05 1.925-.06v-2.643c3.88.173 6.775.85 6.775 1.658 0 .81-2.895 1.485-6.775 1.657m0-3.59v-2.366h5.414V7.819H8.595v3.608h5.414v2.365c-4.4.202-7.709 1.074-7.709 2.118 0 1.044 3.309 1.915 7.709 2.118v7.582h3.913v-7.584c4.393-.202 7.694-1.073 7.694-2.116 0-1.043-3.301-1.914-7.694-2.117" fill="white"/>
        </svg>
      );
    case "usdc":
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
          <path d="M16 6C10.477 6 6 10.477 6 16s4.477 10 10 10 10-4.477 10-10S21.523 6 16 6zm0 18.5c-4.687 0-8.5-3.813-8.5-8.5S11.313 7.5 16 7.5s8.5 3.813 8.5 8.5-3.813 8.5-8.5 8.5z" fill="white"/>
          <path d="M17.5 13.5c0-1.1-.9-1.5-2-1.7v3.4c1.1-.2 2-.6 2-1.7zm-3.5 5.2v-3.6c-1.3.2-2.2.8-2.2 1.8s.9 1.6 2.2 1.8z" fill="white"/>
          <path d="M16 4C9.373 4 4 9.373 4 16s5.373 12 12 12 12-5.373 12-12S22.627 4 16 4zm3 15.4c-.5 1.1-1.4 1.8-2.5 2v1.1h-1v-1.1c-2.1-.3-3-1.5-3.2-3h1.5c.1.8.6 1.5 1.7 1.7v-3.7c-2-.4-3.2-1.1-3.2-2.8 0-1.5 1.1-2.5 3.2-2.8V9.5h1v1.3c1.8.2 2.7 1.2 2.9 2.7h-1.5c-.1-.7-.5-1.2-1.4-1.4v3.5c2.1.4 3.3 1.1 3.3 2.9 0 .3-.1.6-.2.9h-.6z" fill="white"/>
        </svg>
      );
    case "btc":
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
          <path d="M21.329 14.69c.292-1.948-1.193-2.996-3.223-3.695l.659-2.64-1.608-.4-.641 2.571c-.423-.105-.857-.204-1.289-.303l.646-2.588-1.607-.4-.659 2.639c-.35-.08-.694-.159-1.027-.242l.002-.008-2.218-.553-.428 1.717s1.193.274 1.168.29c.651.163.769.593.749.935l-.75 3.009c.045.011.103.028.167.053l-.17-.042-1.052 4.217c-.08.197-.282.493-.738.38.016.024-1.169-.291-1.169-.291l-.798 1.84 2.093.522c.389.098.771.2 1.147.296l-.666 2.672 1.606.4.659-2.64c.439.119.865.228 1.282.333l-.657 2.63 1.608.4.665-2.668c2.745.52 4.808.31 5.677-2.173.7-1.999-.035-3.153-1.48-3.904 1.053-.243 1.845-.936 2.058-2.366zm-3.68 5.159c-.497 1.998-3.858.918-4.948.647l.883-3.54c1.09.272 4.582.811 4.066 2.893zm.497-5.186c-.453 1.817-3.25.893-4.157.667l.8-3.21c.907.226 3.825.648 3.357 2.543z" fill="white"/>
        </svg>
      );
    case "eth":
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
          <path d="M16 4L8 16.5l8 4.8 8-4.8L16 4z" fill="white" fillOpacity="0.6"/>
          <path d="M8 16.5l8 4.8v-9.4l-8 4.6z" fill="white"/>
          <path d="M16 21.3l8-4.8-8-4.6v9.4z" fill="white" fillOpacity="0.8"/>
          <path d="M8 18l8 10 8-10-8 4.8L8 18z" fill="white"/>
        </svg>
      );
  }
};

export const ShareProfileDrawer = ({ isOpen, onClose }: ShareProfileDrawerProps) => {
  const { t } = useTranslation();
  const { tap } = useHapticFeedback();
  const { user } = useAuth();
  const { avatarUrl } = useAvatar();
  const [currentView, setCurrentView] = useState<ViewType>("main");
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<AccountData | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<CryptoAsset | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<CryptoNetwork | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // Contacts state
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<SavedContact | null>(null);
  
  // Business card fields state
  const [businessCardFields, setBusinessCardFields] = useState<BusinessCardField[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialNetworkItem[]>([]);
  const [socialChecked, setSocialChecked] = useState<Record<number, boolean>>({});
  const [isLoadingSocial, setIsLoadingSocial] = useState(false);
  
  // Load social links when opening business card view
  useEffect(() => {
    if (currentView === "businessCard" && user?.id) {
      loadSocialLinks();
    }
  }, [currentView, user?.id]);
  
  // Initialize business card fields when opening
  useEffect(() => {
    if (currentView === "businessCard" && user) {
      const fields: BusinessCardField[] = [];
      
      if (user.full_name) {
        fields.push({
          id: "name",
          label: t("editProfile.fullName") || "Full Name",
          value: user.full_name,
          icon: <User className="w-4 h-4" />,
          checked: true
        });
      }
      
      if (user.phone_number) {
        fields.push({
          id: "phone",
          label: t("editProfile.phone") || "Phone",
          value: user.phone_number,
          icon: <Phone className="w-4 h-4" />,
          checked: true
        });
      }
      
      if (user.email) {
        fields.push({
          id: "email",
          label: t("editProfile.email") || "Email",
          value: user.email,
          icon: <Mail className="w-4 h-4" />,
          checked: true
        });
      }
      
      if (user.username) {
        fields.push({
          id: "username",
          label: t("editProfile.username") || "Username",
          value: `@${user.username}`,
          icon: <AtSign className="w-4 h-4" />,
          checked: true
        });
      }
      
      setBusinessCardFields(fields);
    }
  }, [currentView, user, t]);
  
  const loadSocialLinks = async () => {
    if (!user?.id) return;
    setIsLoadingSocial(true);
    try {
      const response = await getSocialNetworks(user.id);
      if (response.data) {
        setSocialLinks(response.data);
        // Initially all checked
        const checked: Record<number, boolean> = {};
        response.data.forEach(link => {
          checked[link.id] = true;
        });
        setSocialChecked(checked);
      }
    } catch (error) {
      console.error("Failed to load social links:", error);
    } finally {
      setIsLoadingSocial(false);
    }
  };
  
  const toggleField = (fieldId: string) => {
    tap();
    setBusinessCardFields(prev => 
      prev.map(field => 
        field.id === fieldId ? { ...field, checked: !field.checked } : field
      )
    );
  };
  
  const toggleSocialLink = (linkId: number) => {
    tap();
    setSocialChecked(prev => ({
      ...prev,
      [linkId]: !prev[linkId]
    }));
  };

  const handleClose = () => {
    setCurrentView("main");
    setSelectedCard(null);
    setSelectedAccount(null);
    setSelectedAsset(null);
    setSelectedNetwork(null);
    setBusinessCardFields([]);
    setSocialLinks([]);
    setSocialChecked({});
    onClose();
  };

  const handleBack = () => {
    if (currentView === "network") {
      setCurrentView("asset");
      setSelectedNetwork(null);
    } else if (currentView === "asset") {
      setCurrentView("crypto");
      setSelectedAsset(null);
    } else if (currentView === "businessCard" || currentView === "businessCardQR") {
      setCurrentView("main");
      setBusinessCardFields([]);
    } else if (currentView === "contacts") {
      setCurrentView("main");
    } else {
      setCurrentView("main");
      setSelectedCard(null);
      setSelectedAccount(null);
    }
  };

  const copyToClipboard = async (text: string, fieldName: string) => {
    tap();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast.success(t("toast.copied") || "Copied!");
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error(t("toast.copyFailed") || "Failed to copy");
    }
  };

  const handleShare = async (text: string, title: string) => {
    tap();
    
    // Always try native share first on mobile
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text
        });
        return; // Success - exit
      } catch (error: unknown) {
        // User cancelled or share failed - fallback to copy
        if (error instanceof Error && error.name === 'AbortError') {
          console.log("Share cancelled by user");
          return;
        }
      }
    }
    
    // Fallback: copy to clipboard
    await copyToClipboard(text, "share");
  };

  const handleShareBusinessCard = async () => {
    tap();
    
    // Build vCard data for sharing (same as QR code)
    const vCardData = buildVCardData();
    
    // Always try native share first on mobile with vCard file
    if (navigator.share) {
      try {
        // Create a vCard blob file for sharing
        const vCardBlob = new Blob([vCardData], { type: 'text/vcard' });
        const vCardFile = new File([vCardBlob], `${user?.full_name || 'contact'}.vcf`, { type: 'text/vcard' });
        
        // Check if sharing files is supported
        if (navigator.canShare && navigator.canShare({ files: [vCardFile] })) {
          await navigator.share({
            files: [vCardFile],
            title: t("settings.businessCard") || "Business Card"
          });
          return;
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log("Share cancelled by user");
          return;
        }
        // Fall through to text sharing
      }
    }
    
    // Fallback: share as text
    const selectedFields = businessCardFields.filter(f => f.checked);
    const selectedSocials = socialLinks.filter(link => socialChecked[link.id]);
    
    let businessCardText = `👤 ${user?.full_name || ""}\n\n`;
    
    // Add selected profile fields
    selectedFields.forEach(field => {
      businessCardText += `${field.label}: ${field.value}\n`;
    });
    
    // Add social links
    if (selectedSocials.length > 0) {
      businessCardText += `\n🔗 ${t("share.socialLinks") || "Social Links"}:\n`;
      selectedSocials.forEach(link => {
        const platform = detectPlatform(link.url);
        businessCardText += `${platform.name}: ${link.url}\n`;
      });
    }
    
    handleShare(businessCardText, t("settings.businessCard") || "Business Card");
  };

  const handleShareCard = (card: CardData) => {
    const cardData = `💳 ${card.name}

${t("card.number") || "Card Number"}: ${card.fullNumber}
${t("card.holder") || "Holder"}: ${card.holder}
${t("card.expiry") || "Expiry"}: ${card.expiry}

Easy Card UAE`;
    handleShare(cardData, `${card.name} - Easy Card`);
  };

  const handleShareAccount = (account: AccountData) => {
    const accountData = `🏦 ${account.name}

IBAN: ${account.iban}
SWIFT/BIC: ${account.swift}
Bank: ${account.bankName}
Currency: ${account.currency}

Easy Card UAE`;
    handleShare(accountData, `${account.name} - Easy Card`);
  };

  const handleShareCryptoWallet = (asset: CryptoAsset, network: CryptoNetwork) => {
    const walletData = `💰 ${asset.name} (${asset.symbol}) - ${network.name}

${t("crypto.walletAddress") || "Address"}: ${network.address}

${t("share.sendOnly") || "Send only"} ${asset.symbol} ${t("share.toThisAddress") || "to this address via"} ${network.name}.

Easy Card UAE`;
    handleShare(walletData, `${asset.symbol} ${network.name} - Easy Card`);
  };

  const getTitle = () => {
    switch (currentView) {
      case "businessCard":
        return t("settings.businessCard") || "Business Card";
      case "businessCardQR":
        return t("share.qrBusinessCard") || "QR Business Card";
      case "card":
        return selectedCard?.name || t("share.cardDetails") || "Card Details";
      case "account":
        return selectedAccount?.name || t("share.accountDetails") || "Account Details";
      case "crypto":
        return t("share.selectAsset") || "Select Asset";
      case "asset":
        return selectedAsset?.name || t("share.selectNetwork") || "Select Network";
      case "network":
        return `${selectedAsset?.symbol || ""} - ${selectedNetwork?.name || ""}`;
      default:
        return t("settings.share") || "Share";
    }
  };
  
  // Build vCard format for QR code - enables automatic contact saving when scanned
  const buildVCardData = () => {
    const selectedFields = businessCardFields.filter(f => f.checked);
    const selectedSocials = socialLinks.filter(link => socialChecked[link.id]);
    
    // Get field values by id
    const getFieldValue = (id: string) => selectedFields.find(f => f.id === id)?.value || "";
    
    const fullName = getFieldValue("name");
    const phone = getFieldValue("phone");
    const email = getFieldValue("email");
    const username = getFieldValue("username").replace("@", ""); // Remove @ prefix
    
    // Start vCard format
    let vcard = `BEGIN:VCARD\n`;
    vcard += `VERSION:3.0\n`;
    
    // Full name (FN is required in vCard 3.0)
    if (fullName) {
      vcard += `FN:${fullName}\n`;
      // Try to split name into parts for N field
      const nameParts = fullName.split(" ");
      if (nameParts.length >= 2) {
        vcard += `N:${nameParts.slice(1).join(" ")};${nameParts[0]};;;\n`;
      } else {
        vcard += `N:;${fullName};;;\n`;
      }
    } else {
      vcard += `FN:Contact\n`;
      vcard += `N:;Contact;;;\n`;
    }
    
    // Phone number
    if (phone) {
      vcard += `TEL;TYPE=CELL:${phone}\n`;
    }
    
    // Email
    if (email) {
      vcard += `EMAIL:${email}\n`;
    }
    
    // Note with username
    if (username) {
      vcard += `NOTE:Username: @${username}\n`;
    }
    
    // Add social links as URLs
    selectedSocials.forEach((link, index) => {
      const platform = detectPlatform(link.url);
      if (index === 0) {
        vcard += `URL:${link.url}\n`;
      } else {
        // Additional URLs as X-SOCIALPROFILE
        vcard += `X-SOCIALPROFILE;TYPE=${platform.name.toLowerCase()}:${link.url}\n`;
      }
    });
    
    
    vcard += `END:VCARD`;
    
    return vcard;
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="relative">
          {currentView !== "main" && (
            <button
              onClick={handleBack}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <DrawerTitle className="text-center">{getTitle()}</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* Main Menu */}
            {currentView === "main" && (
              <motion.div
                key="main"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-3"
              >
                {/* Business Card Button */}
                <button
                  onClick={() => {
                    tap();
                    setCurrentView("businessCard");
                  }}
                  className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-2xl hover:opacity-90 transition-opacity"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold">{t("settings.businessCard") || "Business Card"}</p>
                    <p className="text-sm opacity-80">{t("settings.shareContactInfo") || "Share your contact info"}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 opacity-80" />
                </button>

                {/* Saved Contacts Section */}
                <div className="bg-muted/50 rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-border/50">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("settings.savedContacts") || "Saved Contacts"}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      tap();
                      setEditingContact(null);
                      setIsAddContactOpen(true);
                    }}
                    className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)" }}
                    >
                      <Contact className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium">{t("settings.addContact") || "Add Contact"}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => {
                      tap();
                      setCurrentView("contacts");
                    }}
                    className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors border-t border-border/30"
                  >
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, #6366f1 0%, #a78bfa 100%)" }}
                    >
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium">{t("contacts.viewContacts") || "View Contacts"}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>

                {/* Cards Section */}
                <div className="bg-muted/50 rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-border/50">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("settings.cards") || "Cards"}
                    </p>
                  </div>
                  {mockCards.map((card) => (
                    <button
                      key={card.id}
                      onClick={() => {
                        tap();
                        setSelectedCard(card);
                        setCurrentView("card");
                      }}
                      className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{
                          background: card.type === "virtual" 
                            ? "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)"
                            : "linear-gradient(135deg, #71717a 0%, #27272a 100%)"
                        }}
                      >
                        <CreditCard className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium">{card.name}</p>
                        <p className="text-sm text-muted-foreground">{card.number}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </button>
                  ))}
                </div>

                {/* Accounts Section */}
                <div className="bg-muted/50 rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-border/50">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("settings.accounts") || "Accounts"}
                    </p>
                  </div>
                  {mockAccounts.map((account) => (
                    <button
                      key={account.id}
                      onClick={() => {
                        tap();
                        setSelectedAccount(account);
                        setCurrentView("account");
                      }}
                      className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
                      >
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium">{account.name}</p>
                        <p className="text-sm text-muted-foreground">{account.currency}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </button>
                  ))}
                </div>

                {/* Crypto Wallets Section */}
                <button
                  onClick={() => {
                    tap();
                    setCurrentView("crypto");
                  }}
                  className="w-full flex items-center gap-4 p-4 bg-muted/50 rounded-2xl hover:bg-muted/70 transition-colors"
                >
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" }}
                  >
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{t("settings.cryptoWallets") || "Crypto Wallets"}</p>
                    <p className="text-sm text-muted-foreground">{t("settings.selectNetwork") || "Select network to share"}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              </motion.div>
            )}

            {/* Business Card View with Checkboxes - Fantastic Design */}
            {currentView === "businessCard" && (
              <motion.div
                key="businessCard"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                {/* Hero Card with Avatar and Name - CSS Animated Blue Gradient */}
                <motion.div 
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
                  className="relative overflow-hidden rounded-3xl p-6 animate-gradient-shift"
                  style={{
                    background: "linear-gradient(-45deg, #3b82f6, #1e40af, #7c3aed, #2563eb)"
                  }}
                >
                  {/* Background decoration - CSS animated glow */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-white/10 rounded-full blur-3xl animate-glow-pulse" />
                    <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-purple-400/20 rounded-full blur-3xl animate-glow-pulse-alt" />
                    <div className="absolute top-4 right-4 animate-sparkle-rotate">
                      <Sparkles className="w-5 h-5 text-white/40" />
                    </div>
                  </div>
                  
                  <div className="relative z-10 flex items-center gap-4">
                    {/* Avatar with glow effect */}
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
                      className="relative"
                    >
                      <div className="absolute inset-0 bg-white/30 rounded-full blur-xl scale-110" />
                      <Avatar className="w-20 h-20 border-4 border-white/30 shadow-2xl relative">
                        <AvatarImage src={avatarUrl} alt={user?.full_name || "User"} />
                        <AvatarFallback className="bg-white/20 text-white text-2xl font-bold">
                          {user?.full_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </motion.div>
                    
                    {/* Name and Username */}
                    <div className="flex-1 min-w-0">
                      <motion.h3 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-xl font-bold text-white truncate"
                      >
                        {user?.full_name || t("share.noName")}
                      </motion.h3>
                      {user?.username && (
                        <motion.p 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 }}
                          className="text-white/70 text-sm"
                        >
                          @{user.username}
                        </motion.p>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Action Buttons - Solid Blue with Subtle Glow */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex gap-3"
                >
                  <button
                    onClick={handleShareBusinessCard}
                    disabled={businessCardFields.filter(f => f.checked).length === 0 && Object.values(socialChecked).filter(Boolean).length === 0}
                    className="flex-1 flex items-center justify-center gap-3 py-4 px-6 bg-primary text-primary-foreground rounded-2xl font-semibold shadow-[0_4px_14px_-3px_rgba(59,130,246,0.3)] hover:shadow-[0_6px_20px_-3px_rgba(59,130,246,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:scale-100"
                  >
                    <Share2 className="w-5 h-5" />
                    <span>{t("common.share")}</span>
                  </button>
                  <button
                    onClick={() => {
                      tap();
                      setCurrentView("businessCardQR");
                    }}
                    disabled={businessCardFields.filter(f => f.checked).length === 0 && Object.values(socialChecked).filter(Boolean).length === 0}
                    className="flex items-center justify-center gap-2 py-4 px-5 bg-primary text-primary-foreground rounded-2xl font-semibold shadow-[0_4px_14px_-3px_rgba(59,130,246,0.3)] hover:shadow-[0_6px_20px_-3px_rgba(59,130,246,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <QrCode className="w-5 h-5" />
                    <span className="text-sm">{t("share.qr")}</span>
                  </button>
                </motion.div>
                
                {/* Profile Fields */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-b from-muted/60 to-muted/40 backdrop-blur-sm rounded-2xl overflow-hidden border border-border/50"
                >
                  <div className="px-4 py-3 border-b border-border/30">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("share.profileData")}
                    </p>
                  </div>
                  {businessCardFields.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      {t("share.noProfileData")}
                    </div>
                  ) : (
                    businessCardFields.map((field, index) => (
                      <motion.div
                        key={field.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.35 + index * 0.05 }}
                        onClick={() => toggleField(field.id)}
                        className="w-full flex items-center gap-4 p-4 hover:bg-primary/5 transition-colors cursor-pointer active:bg-primary/10"
                      >
                        <motion.div 
                          animate={{ scale: field.checked ? 1 : 0.95, opacity: field.checked ? 1 : 0.7 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                          className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary shadow-sm"
                        >
                          {field.icon}
                        </motion.div>
                        <motion.div 
                          animate={{ opacity: field.checked ? 1 : 0.6 }}
                          transition={{ duration: 0.2 }}
                          className="flex-1 text-left"
                        >
                          <p className="text-xs text-muted-foreground font-medium">{field.label}</p>
                          <p className="font-semibold text-foreground">{field.value}</p>
                        </motion.div>
                        <motion.div
                          animate={{ scale: field.checked ? [1, 1.2, 1] : 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Checkbox 
                            checked={field.checked} 
                            className="h-5 w-5 pointer-events-none"
                          />
                        </motion.div>
                      </motion.div>
                    ))
                  )}
                </motion.div>

                {/* Social Links */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gradient-to-b from-muted/60 to-muted/40 backdrop-blur-sm rounded-2xl overflow-hidden border border-border/50"
                >
                  <div className="px-4 py-3 border-b border-border/30">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("share.socialLinks")}
                    </p>
                  </div>
                  {isLoadingSocial ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      {t("common.loading")}
                    </div>
                  ) : socialLinks.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      {t("share.noSocialLinks")}
                    </div>
                  ) : (
                    socialLinks.map((link, index) => {
                      const platform = detectPlatform(link.url);
                      const IconComponent = platform.icon;
                      const isChecked = socialChecked[link.id] ?? true;
                      return (
                        <motion.div
                          key={link.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.45 + index * 0.05 }}
                          onClick={() => toggleSocialLink(link.id)}
                          className="w-full flex items-center gap-4 p-4 hover:bg-primary/5 transition-colors cursor-pointer active:bg-primary/10"
                        >
                          <motion.div 
                            animate={{ scale: isChecked ? 1 : 0.95, opacity: isChecked ? 1 : 0.7 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            className={cn(
                              "w-11 h-11 rounded-xl flex items-center justify-center shadow-lg",
                              platform.bgColor
                            )}
                          >
                            <IconComponent className="w-5 h-5 text-white" />
                          </motion.div>
                          <motion.div 
                            animate={{ opacity: isChecked ? 1 : 0.6 }}
                            transition={{ duration: 0.2 }}
                            className="flex-1 text-left min-w-0"
                          >
                            <p className="font-semibold">{platform.name}</p>
                            <p className="text-sm text-muted-foreground truncate">{link.url}</p>
                          </motion.div>
                          <motion.div
                            animate={{ scale: isChecked ? [1, 1.2, 1] : 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Checkbox 
                              checked={isChecked} 
                              className="h-5 w-5 flex-shrink-0 pointer-events-none"
                            />
                          </motion.div>
                        </motion.div>
                      );
                    })
                  )}
                </motion.div>
              </motion.div>
            )}
            
            {/* Business Card QR View - Fantastic Design */}
            {currentView === "businessCardQR" && (
              <motion.div
                key="businessCardQR"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* QR Card with Avatar - CSS Animated Purple-Blue Gradient */}
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="relative overflow-hidden rounded-3xl p-6 animate-gradient-shift"
                  style={{
                    background: "linear-gradient(-45deg, #7c3aed, #3b82f6, #8b5cf6, #2563eb)",
                    backgroundSize: "400% 400%"
                  }}
                >
                  {/* CSS animated background decorations */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-white/10 rounded-full blur-3xl animate-floating-glow" />
                    <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-purple-500/20 rounded-full blur-3xl animate-floating-glow-alt" />
                    <div className="absolute top-4 right-4 animate-sparkle-rotate">
                      <Sparkles className="w-6 h-6 text-white/40" />
                    </div>
                    <div className="absolute bottom-4 left-4 animate-sparkle-rotate-reverse">
                      <Sparkles className="w-4 h-4 text-white/30" />
                    </div>
                  </div>
                  
                  <div className="relative z-10 flex flex-col items-center">
                    {/* Avatar with glow */}
                    <motion.div 
                      initial={{ scale: 0, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      transition={{ delay: 0.1, type: "spring" }}
                      className="relative mb-4"
                    >
                      <div className="absolute inset-0 bg-white/30 rounded-full blur-xl scale-125" />
                      <Avatar className="w-16 h-16 border-4 border-white/30 shadow-2xl relative">
                        <AvatarImage src={avatarUrl} alt={user?.full_name || "User"} />
                        <AvatarFallback className="bg-white/20 text-white text-xl font-bold">
                          {user?.full_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </motion.div>
                    
                    {/* Name */}
                    <motion.h3 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-lg font-bold text-white mb-4"
                    >
                      {user?.full_name || t("share.noName")}
                    </motion.h3>
                    
                    {/* QR Code */}
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3, type: "spring" }}
                      className="bg-white p-4 rounded-2xl shadow-2xl"
                    >
                      <QRCodeSVG 
                        value={buildVCardData()} 
                        size={180}
                        level="M"
                        includeMargin={false}
                      />
                    </motion.div>
                    
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="mt-4 text-sm text-white/70 text-center"
                    >
                      {t("share.scanQRToGetContact")}
                    </motion.p>
                  </div>
                </motion.div>
                
                {/* Selected items summary */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-b from-muted/60 to-muted/40 backdrop-blur-sm rounded-2xl p-4 space-y-2 border border-border/50"
                >
                  <p className="text-sm font-medium text-muted-foreground mb-3">
                    {t("share.includedInQR")}:
                  </p>
                  {businessCardFields.filter(f => f.checked).map((field, index) => (
                    <motion.div 
                      key={field.id} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + index * 0.05 }}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="font-medium">{field.label}:</span>
                      <span className="text-muted-foreground truncate">{field.value}</span>
                    </motion.div>
                  ))}
                  {socialLinks.filter(link => socialChecked[link.id]).map((link, index) => {
                    const platform = detectPlatform(link.url);
                    const IconComponent = platform.icon;
                    return (
                      <motion.div 
                        key={link.id} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.05 }}
                        className="flex items-center gap-2 text-sm"
                      >
                        <div className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center",
                          platform.bgColor
                        )}>
                          <IconComponent className="w-3 h-3 text-white" />
                        </div>
                        <span className="font-medium">{platform.name}</span>
                      </motion.div>
                    );
                  })}
                </motion.div>
                
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  onClick={handleShareBusinessCard}
                  className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-2xl font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] transition-all duration-200"
                >
                  <Share2 className="w-5 h-5" />
                  <span>{t("common.share")}</span>
                </motion.button>
              </motion.div>
            )}

            {/* Card Details View */}
            {currentView === "card" && selectedCard && (
              <motion.div
                key="card"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="bg-muted/50 rounded-2xl p-4 space-y-4">
                  <DetailRow 
                    label={t("card.number") || "Card Number"} 
                    value={selectedCard.number}
                    onCopy={() => copyToClipboard(selectedCard.number.replace(/\s/g, ""), "number")}
                    copied={copiedField === "number"}
                  />
                  <DetailRow 
                    label={t("card.holder") || "Card Holder"} 
                    value={selectedCard.holder}
                    onCopy={() => copyToClipboard(selectedCard.holder, "holder")}
                    copied={copiedField === "holder"}
                  />
                  <DetailRow 
                    label={t("card.expiry") || "Expiry"} 
                    value={selectedCard.expiry}
                    onCopy={() => copyToClipboard(selectedCard.expiry, "expiry")}
                    copied={copiedField === "expiry"}
                  />
                </div>

                <button
                  onClick={() => handleShareCard(selectedCard)}
                  className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-primary text-primary-foreground rounded-2xl font-semibold hover:bg-primary/90 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  <span>{t("common.share") || "Share"}</span>
                </button>
              </motion.div>
            )}

            {/* Account Details View */}
            {currentView === "account" && selectedAccount && (
              <motion.div
                key="account"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="bg-muted/50 rounded-2xl p-4 space-y-4">
                  <DetailRow 
                    label="IBAN" 
                    value={selectedAccount.iban}
                    onCopy={() => copyToClipboard(selectedAccount.iban.replace(/\s/g, ""), "iban")}
                    copied={copiedField === "iban"}
                  />
                  <DetailRow 
                    label="SWIFT/BIC" 
                    value={selectedAccount.swift}
                    onCopy={() => copyToClipboard(selectedAccount.swift, "swift")}
                    copied={copiedField === "swift"}
                  />
                  <DetailRow 
                    label={t("bank.name") || "Bank"} 
                    value={selectedAccount.bankName}
                    onCopy={() => copyToClipboard(selectedAccount.bankName, "bank")}
                    copied={copiedField === "bank"}
                  />
                </div>

                <button
                  onClick={() => handleShareAccount(selectedAccount)}
                  className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-primary text-primary-foreground rounded-2xl font-semibold hover:bg-primary/90 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  <span>{t("common.share") || "Share"}</span>
                </button>
              </motion.div>
            )}

            {/* Crypto Asset Selection */}
            {currentView === "crypto" && (
              <motion.div
                key="crypto"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                <p className="text-sm text-muted-foreground px-1">
                  {t("share.selectAssetDesc") || "Select an asset to share wallet address"}
                </p>
                {cryptoAssets.map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => {
                      tap();
                      setSelectedAsset(asset);
                      setCurrentView("asset");
                    }}
                    className="w-full flex items-center gap-4 p-4 bg-muted/50 rounded-2xl hover:bg-muted/70 transition-colors"
                  >
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: asset.color }}
                    >
                      <CryptoIcon type={asset.iconType} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium">{asset.name}</p>
                      <p className="text-sm text-muted-foreground">{asset.symbol}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </button>
                ))}
              </motion.div>
            )}

            {/* Network Selection for Asset */}
            {currentView === "asset" && selectedAsset && (
              <motion.div
                key="asset"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                <p className="text-sm text-muted-foreground px-1">
                  {t("share.selectNetworkFor") || "Select network for"} {selectedAsset.symbol}
                </p>
                {selectedAsset.networks.map((network) => (
                  <button
                    key={network.id}
                    onClick={() => {
                      tap();
                      setSelectedNetwork(network);
                      setCurrentView("network");
                    }}
                    className="w-full flex items-center gap-4 p-4 bg-muted/50 rounded-2xl hover:bg-muted/70 transition-colors"
                  >
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" }}
                    >
                      <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium">{network.name}</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {network.address.slice(0, 8)}...{network.address.slice(-6)}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </button>
                ))}
              </motion.div>
            )}

            {/* Network Wallet View with QR */}
            {currentView === "network" && selectedNetwork && selectedAsset && (
              <motion.div
                key="network"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Asset Header */}
                <div className="flex flex-col items-center">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
                    style={{ background: selectedAsset.color }}
                  >
                    <CryptoIcon type={selectedAsset.iconType} className="w-8 h-8" />
                  </div>
                  <p className="font-semibold text-lg">{selectedAsset.symbol}</p>
                  <p className="text-sm text-muted-foreground">{selectedNetwork.name}</p>
                </div>

                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-2xl">
                    <QRCodeSVG 
                      value={selectedNetwork.address} 
                      size={180}
                      level="H"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="bg-muted/50 rounded-2xl p-4">
                  <p className="text-sm text-muted-foreground mb-2">{t("crypto.walletAddress") || "Wallet Address"}</p>
                  <p className="font-mono text-sm break-all">{selectedNetwork.address}</p>
                </div>

                {/* Warning */}
                <p className="text-xs text-center text-muted-foreground">
                  {t("share.sendOnly") || "Send only"} {selectedAsset.symbol} {t("share.viaNetwork") || "via"} {selectedNetwork.name}
                </p>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => copyToClipboard(selectedNetwork.address, "address")}
                    className="flex-1 flex items-center justify-center gap-2 py-4 px-4 bg-muted rounded-2xl font-medium hover:bg-muted/80 transition-colors"
                  >
                    {copiedField === "address" ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <Copy className="w-5 h-5 text-primary" />
                    )}
                    <span>{t("common.copy") || "Copy"}</span>
                  </button>
                  <button
                    onClick={() => handleShareCryptoWallet(selectedAsset, selectedNetwork)}
                    className="flex-1 flex items-center justify-center gap-2 py-4 px-4 bg-primary text-primary-foreground rounded-2xl font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                    <span>{t("common.share") || "Share"}</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Contacts List View */}
            {currentView === "contacts" && (
              <motion.div
                key="contacts"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <ContactsList
                  onContactClick={(contact) => {
                    setEditingContact(contact);
                    setIsAddContactOpen(true);
                  }}
                  onAddClick={() => {
                    setEditingContact(null);
                    setIsAddContactOpen(true);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DrawerContent>

      {/* Add/Edit Contact Drawer */}
      <AddContactDrawer
        isOpen={isAddContactOpen}
        onClose={() => {
          setIsAddContactOpen(false);
          setEditingContact(null);
        }}
        editContact={editingContact}
        onSaved={() => {
          setIsAddContactOpen(false);
          setEditingContact(null);
        }}
      />
    </Drawer>
  );
};

// Helper component for detail rows
interface DetailRowProps {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
}

const DetailRow = ({ label, value, onCopy, copied }: DetailRowProps) => (
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
    <button
      onClick={onCopy}
      className="p-2 rounded-lg hover:bg-muted transition-colors"
    >
      {copied ? (
        <Check className="w-5 h-5 text-green-500" />
      ) : (
        <Copy className="w-5 h-5 text-primary" />
      )}
    </button>
  </div>
);

export default ShareProfileDrawer;

/**
 * ShareContactDrawer - Share a saved contact with QR code and native sharing
 * Similar to ShareProfileDrawer but for contacts
 */

import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { QRCodeSVG } from "qrcode.react";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  ChevronRight,
  Copy, 
  Share2, 
  Check, 
  User,
  Phone,
  Mail,
  Building2,
  Briefcase,
  QrCode,
  CreditCard,
  Wallet,
  Globe,
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
  UserPlus,
  MessageSquare,
  X,
  LucideIcon
} from "lucide-react";
import { toast } from "sonner";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { SavedContact, PaymentMethod } from "@/types/contact";
import { cn } from "@/lib/utils";

interface ShareContactDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  contact: SavedContact | null;
}

type ViewType = "main" | "qr";

interface ShareField {
  id: string;
  label: string;
  value: string;
  icon: React.ReactNode;
  checked: boolean;
}

// Social network detection with icons
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

export const ShareContactDrawer = ({ isOpen, onClose, contact }: ShareContactDrawerProps) => {
  const { t } = useTranslation();
  const { tap } = useHapticFeedback();
  const [currentView, setCurrentView] = useState<ViewType>("main");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Fields state
  const [shareFields, setShareFields] = useState<ShareField[]>([]);
  const [socialChecked, setSocialChecked] = useState<Record<string, boolean>>({});
  const [paymentChecked, setPaymentChecked] = useState<Record<string, boolean>>({});

  // Initialize fields when contact changes
  useMemo(() => {
    if (contact) {
      const fields: ShareField[] = [];

      fields.push({
        id: "name",
        label: t("contacts.fullName") || "Full Name",
        value: contact.full_name,
        icon: <User className="w-4 h-4" />,
        checked: true
      });

      if (contact.phone) {
        fields.push({
          id: "phone",
          label: t("contacts.phone") || "Phone",
          value: contact.phone,
          icon: <Phone className="w-4 h-4" />,
          checked: true
        });
      }

      if (contact.email) {
        fields.push({
          id: "email",
          label: t("contacts.email") || "Email",
          value: contact.email,
          icon: <Mail className="w-4 h-4" />,
          checked: true
        });
      }

      if (contact.company) {
        fields.push({
          id: "company",
          label: t("contacts.company") || "Company",
          value: contact.company,
          icon: <Building2 className="w-4 h-4" />,
          checked: true
        });
      }

      if (contact.position) {
        fields.push({
          id: "position",
          label: t("contacts.position") || "Position",
          value: contact.position,
          icon: <Briefcase className="w-4 h-4" />,
          checked: true
        });
      }

      setShareFields(fields);

      // Initialize social links
      const socials: Record<string, boolean> = {};
      (contact.social_links || []).forEach(link => {
        socials[link.id] = true;
      });
      setSocialChecked(socials);

      // Initialize payment methods
      const payments: Record<string, boolean> = {};
      (contact.payment_methods || []).forEach(pm => {
        payments[pm.id] = true;
      });
      setPaymentChecked(payments);
    }
  }, [contact, t]);

  const handleClose = () => {
    setCurrentView("main");
    onClose();
  };

  const handleBack = () => {
    setCurrentView("main");
  };

  const toggleField = (fieldId: string) => {
    tap();
    setShareFields(prev =>
      prev.map(field =>
        field.id === fieldId ? { ...field, checked: !field.checked } : field
      )
    );
  };

  const toggleSocialLink = (linkId: string) => {
    tap();
    setSocialChecked(prev => ({
      ...prev,
      [linkId]: !prev[linkId]
    }));
  };

  const togglePaymentMethod = (pmId: string) => {
    tap();
    setPaymentChecked(prev => ({
      ...prev,
      [pmId]: !prev[pmId]
    }));
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

  // Build vCard data
  const buildVCardData = (): string => {
    if (!contact) return "";

    const selectedFields = shareFields.filter(f => f.checked);
    const selectedSocials = (contact.social_links || []).filter(link => socialChecked[link.id]);
    const selectedPayments = (contact.payment_methods || []).filter(pm => paymentChecked[pm.id]);

    const getFieldValue = (id: string) => selectedFields.find(f => f.id === id)?.value || "";

    const fullName = getFieldValue("name");
    const phone = getFieldValue("phone");
    const email = getFieldValue("email");
    const company = getFieldValue("company");
    const position = getFieldValue("position");

    let vcard = `BEGIN:VCARD\n`;
    vcard += `VERSION:3.0\n`;

    // Full name
    if (fullName) {
      vcard += `FN:${fullName}\n`;
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

    // Phone
    if (phone) {
      vcard += `TEL;TYPE=CELL:${phone}\n`;
    }

    // Email
    if (email) {
      vcard += `EMAIL:${email}\n`;
    }

    // Company and position
    if (company || position) {
      if (company) {
        vcard += `ORG:${company}\n`;
      }
      if (position) {
        vcard += `TITLE:${position}\n`;
      }
    }

    // Add social links as URLs
    selectedSocials.forEach((link, index) => {
      const platform = detectPlatform(link.url);
      if (index === 0) {
        vcard += `URL:${link.url}\n`;
      } else {
        vcard += `X-SOCIALPROFILE;TYPE=${platform.name.toLowerCase()}:${link.url}\n`;
      }
    });

    // Add payment methods as notes
    if (selectedPayments.length > 0) {
      const paymentNote = selectedPayments.map(pm => `${pm.label}: ${pm.value}`).join("; ");
      vcard += `NOTE:Payment Methods - ${paymentNote}\n`;
    }

    vcard += `END:VCARD`;

    return vcard;
  };

  // Share contact via native share API
  const handleShareContact = async () => {
    tap();

    const vCardData = buildVCardData();

    if (navigator.share) {
      try {
        const vCardBlob = new Blob([vCardData], { type: 'text/vcard' });
        const vCardFile = new File([vCardBlob], `${contact?.full_name || 'contact'}.vcf`, { type: 'text/vcard' });

        if (navigator.canShare && navigator.canShare({ files: [vCardFile] })) {
          await navigator.share({
            files: [vCardFile],
            title: contact?.full_name || t("contacts.contact")
          });
          return;
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
      }
    }

    // Fallback: share as text
    const selectedFields = shareFields.filter(f => f.checked);
    const selectedSocials = (contact?.social_links || []).filter(link => socialChecked[link.id]);
    const selectedPayments = (contact?.payment_methods || []).filter(pm => paymentChecked[pm.id]);

    let contactText = `👤 ${contact?.full_name || ""}\n\n`;

    selectedFields.forEach(field => {
      if (field.id !== "name") {
        contactText += `${field.label}: ${field.value}\n`;
      }
    });

    if (selectedSocials.length > 0) {
      contactText += `\n🔗 ${t("contacts.socialLinks") || "Social Links"}:\n`;
      selectedSocials.forEach(link => {
        const platform = detectPlatform(link.url);
        contactText += `${platform.name}: ${link.url}\n`;
      });
    }

    if (selectedPayments.length > 0) {
      contactText += `\n💳 ${t("contacts.paymentMethods") || "Payment Methods"}:\n`;
      selectedPayments.forEach(pm => {
        contactText += `${pm.label}: ${pm.value}\n`;
      });
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: contact?.full_name,
          text: contactText
        });
        return;
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
      }
    }

    await copyToClipboard(contactText, "share");
  };

  // Add contact to phone contacts via data URI
  const handleAddToContacts = () => {
    tap();
    const vCardData = buildVCardData();
    // Create a data URI for vCard which triggers mobile contact add dialog
    const dataUri = `data:text/vcard;charset=utf-8,${encodeURIComponent(vCardData)}`;
    window.location.href = dataUri;
    toast.success(t("contacts.addedToContacts") || "Contact added");
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getPaymentIcon = (type: PaymentMethod["type"]) => {
    switch (type) {
      case "card": return <CreditCard className="w-4 h-4" />;
      case "iban": return <Building2 className="w-4 h-4" />;
      case "crypto":
      case "wallet":
      case "paypal":
        return <Wallet className="w-4 h-4" />;
      default: return <CreditCard className="w-4 h-4" />;
    }
  };

  const vCardData = buildVCardData();
  const hasAnySelection = shareFields.some(f => f.checked) ||
    Object.values(socialChecked).some(v => v) ||
    Object.values(paymentChecked).some(v => v);

  const renderMainView = () => (
    <motion.div
      key="main"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-4"
    >
      {/* Contact Card Preview */}
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
        </div>
        
        <div className="relative z-10 flex flex-col items-center gap-4">
          {/* Avatar with glow effect */}
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-white/30 rounded-full blur-xl scale-110" />
            <Avatar className="w-20 h-20 border-4 border-white/30 shadow-2xl relative">
              <AvatarImage src={contact?.avatar_url || undefined} />
              <AvatarFallback className="bg-white/20 text-white text-2xl font-bold">
                {contact ? getInitials(contact.full_name) : "?"}
              </AvatarFallback>
            </Avatar>
          </motion.div>
          
          <div className="text-center">
            <motion.h3 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl font-bold text-white"
            >
              {contact?.full_name}
            </motion.h3>
            {contact?.position && contact?.company && (
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-white/70 text-sm"
              >
                {contact.position} • {contact.company}
              </motion.p>
            )}
          </div>
          
          {/* Add to Contacts and Share buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex gap-3 w-full mt-2"
          >
            <Button
              onClick={handleAddToContacts}
              disabled={!hasAnySelection}
              className="flex-1 h-10 rounded-xl bg-blue-500 border-blue-600 text-white hover:bg-blue-600"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {t("contacts.addToContacts")}
            </Button>
            <Button
              onClick={handleShareContact}
              disabled={!hasAnySelection}
              className="flex-1 h-10 rounded-xl bg-blue-500 border-blue-600 text-white hover:bg-blue-600"
            >
              <Share2 className="w-4 h-4 mr-2" />
              {t("common.share") || "Share"}
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Select what to share */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground px-1">
          {t("contacts.selectToShare") || "Select what to share"}
        </p>

        {/* Basic fields */}
        <div className="bg-muted/50 rounded-2xl overflow-hidden">
          {shareFields.map((field) => (
            <button
              key={field.id}
              onClick={() => toggleField(field.id)}
              className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors border-b border-border/30 last:border-b-0"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                {field.icon}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm text-muted-foreground">{field.label}</p>
                <p className="font-medium">{field.value}</p>
              </div>
              <Checkbox
                checked={field.checked}
                onCheckedChange={() => toggleField(field.id)}
                className="data-[state=checked]:bg-primary"
              />
            </button>
          ))}
        </div>

        {/* Social links */}
        {contact?.social_links && contact.social_links.length > 0 && (
          <div className="bg-muted/50 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border/30">
              <p className="text-sm font-medium text-muted-foreground">
                {t("contacts.socialLinks") || "Social Links"}
              </p>
            </div>
            {contact.social_links.map((link) => {
              const platform = detectPlatform(link.url);
              const Icon = platform.icon;
              return (
                <button
                  key={link.id}
                  onClick={() => toggleSocialLink(link.id)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors border-b border-border/30 last:border-b-0"
                >
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white", platform.bgColor)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{platform.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{link.url}</p>
                  </div>
                  <Checkbox
                    checked={socialChecked[link.id] || false}
                    onCheckedChange={() => toggleSocialLink(link.id)}
                    className="data-[state=checked]:bg-primary"
                  />
                </button>
              );
            })}
          </div>
        )}

        {/* Payment methods */}
        {contact?.payment_methods && contact.payment_methods.length > 0 && (
          <div className="bg-muted/50 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border/30">
              <p className="text-sm font-medium text-muted-foreground">
                {t("contacts.paymentMethods") || "Payment Methods"}
              </p>
            </div>
            {contact.payment_methods.map((pm) => (
              <button
                key={pm.id}
                onClick={() => togglePaymentMethod(pm.id)}
                className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors border-b border-border/30 last:border-b-0"
              >
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-600">
                  {getPaymentIcon(pm.type)}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">{pm.label}</p>
                  <p className="text-sm text-muted-foreground font-mono truncate">{pm.value}</p>
                </div>
                <Checkbox
                  checked={paymentChecked[pm.id] || false}
                  onCheckedChange={() => togglePaymentMethod(pm.id)}
                  className="data-[state=checked]:bg-primary"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="space-y-3 pt-2">
        {/* QR Code button */}
        <button
          onClick={() => { tap(); setCurrentView("qr"); }}
          disabled={!hasAnySelection}
          className="w-full flex items-center justify-center gap-3 p-4 bg-muted/50 rounded-2xl hover:bg-muted/70 transition-colors disabled:opacity-50"
        >
          <QrCode className="w-5 h-5" />
          <span className="font-medium">{t("contacts.showQrCode") || "Show QR Code"}</span>
        </button>

        {/* Send data via SMS button */}
        <Button
          onClick={() => {
            tap();
            // Build contact text from selected fields
            const selectedFields = shareFields.filter(f => f.checked);
            const selectedSocials = (contact?.social_links || []).filter(link => socialChecked[link.id]);
            const selectedPayments = (contact?.payment_methods || []).filter(pm => paymentChecked[pm.id]);

            let contactText = `👤 ${contact?.full_name || ""}\n`;

            selectedFields.forEach(field => {
              if (field.id !== "name") {
                contactText += `${field.label}: ${field.value}\n`;
              }
            });

            if (selectedSocials.length > 0) {
              contactText += `\n🔗 ${t("contacts.socialLinks")}:\n`;
              selectedSocials.forEach(link => {
                const platform = detectPlatform(link.url);
                contactText += `${platform.name}: ${link.url}\n`;
              });
            }

            if (selectedPayments.length > 0) {
              contactText += `\n💳 ${t("contacts.paymentMethods")}:\n`;
              selectedPayments.forEach(pm => {
                contactText += `${pm.label}: ${pm.value}\n`;
              });
            }

            // Use Web Share API to open system share menu
            if (navigator.share) {
              navigator.share({
                title: contact?.full_name || t("contacts.contactData"),
                text: contactText,
              }).catch(() => {
                // User cancelled or share failed, fallback to SMS
                window.location.href = `sms:?body=${encodeURIComponent(contactText)}`;
              });
            } else {
              // Fallback for browsers without Web Share API
              window.location.href = `sms:?body=${encodeURIComponent(contactText)}`;
            }
          }}
          disabled={!hasAnySelection}
          variant="outline"
          className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 active:bg-emerald-600 transition-all group"
        >
          <MessageSquare className="w-5 h-5 mr-2 text-emerald-500 group-hover:text-white transition-colors" />
          <span className="flex-1 text-left">
            {t("contacts.sendDataViaSms")}
          </span>
        </Button>
      </div>
    </motion.div>
  );

  const renderQRView = () => (
    <motion.div
      key="qr"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* QR Code */}
      <div className="flex justify-center">
        <div className="bg-white p-6 rounded-3xl shadow-lg">
          <QRCodeSVG
            value={vCardData}
            size={220}
            level="M"
            includeMargin={false}
          />
        </div>
      </div>

      {/* Contact info */}
      <div className="text-center">
        <h3 className="text-lg font-semibold">{contact?.full_name}</h3>
        <p className="text-sm text-muted-foreground">
          {t("contacts.scanToSave") || "Scan to save contact"}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleAddToContacts}
          variant="outline"
          className="flex-1 h-12 rounded-xl"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          {t("contacts.addToContacts")}
        </Button>
        <Button
          onClick={handleShareContact}
          className="flex-1 h-12 rounded-xl"
        >
          <Share2 className="w-5 h-5 mr-2" />
          {t("common.share") || "Share"}
        </Button>
      </div>
    </motion.div>
  );

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="border-b border-border/50">
          <div className="flex items-center">
            <button
              onClick={currentView !== "main" ? handleBack : onClose}
              className="mr-3 w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
            <DrawerTitle className="flex-1">
              {currentView === "qr"
                ? (t("contacts.qrCode") || "QR Code")
                : (t("contacts.shareContact") || "Share Contact")}
            </DrawerTitle>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DrawerHeader>

        <div className="px-4 pb-8 overflow-y-auto max-h-[70vh]">
          <AnimatePresence mode="wait">
            {currentView === "main" && renderMainView()}
            {currentView === "qr" && renderQRView()}
          </AnimatePresence>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

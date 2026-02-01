/**
 * AddContactDrawer - Full form for adding/editing a contact
 * Similar to EditProfile with photo, socials, and payment methods
 */

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Camera, 
  User, 
  Phone, 
  Mail, 
  Building2, 
  Briefcase, 
  StickyNote,
  Plus,
  X,
  ChevronRight,
  CreditCard,
  Wallet,
  Loader2,
  Check,
  Trash2,
  Link2
} from "lucide-react";
import { toast } from "sonner";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { useSavedContacts } from "@/hooks/useSavedContacts";
import { SavedContact, PaymentMethod, ContactSocialLink, PAYMENT_METHOD_TYPES, CRYPTO_NETWORKS } from "@/types/contact";
import { SocialLinksInput, SocialLink } from "@/components/settings/SocialLinksInput";
import { AvatarCropDialog } from "@/components/settings/AvatarCropDialog";
import { cn } from "@/lib/utils";

interface AddContactDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  editContact?: SavedContact | null;
  onSaved?: (contact: SavedContact) => void;
}

type ViewType = "main" | "socials" | "payments" | "addPayment";

export const AddContactDrawer = ({ 
  isOpen, 
  onClose, 
  editContact,
  onSaved 
}: AddContactDrawerProps) => {
  const { t } = useTranslation();
  const { tap } = useHapticFeedback();
  const { createContact, updateContact, uploadAvatar, deleteContact } = useSavedContacts();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentView, setCurrentView] = useState<ViewType>("main");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [notes, setNotes] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Social links
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

  // Payment methods
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  // Add payment form
  const [newPaymentType, setNewPaymentType] = useState<PaymentMethod["type"]>("card");
  const [newPaymentLabel, setNewPaymentLabel] = useState("");
  const [newPaymentValue, setNewPaymentValue] = useState("");
  const [newPaymentNetwork, setNewPaymentNetwork] = useState("");

  // Avatar crop
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);

  // Initialize form with edit contact data
  useEffect(() => {
    if (editContact) {
      setFullName(editContact.full_name);
      setPhone(editContact.phone || "");
      setEmail(editContact.email || "");
      setCompany(editContact.company || "");
      setPosition(editContact.position || "");
      setNotes(editContact.notes || "");
      setAvatarUrl(editContact.avatar_url || null);
      setPaymentMethods(editContact.payment_methods || []);
      
      // Convert ContactSocialLink to SocialLink format
      const links: SocialLink[] = (editContact.social_links || []).map(link => ({
        id: link.id,
        url: link.url,
        networkId: link.networkId,
        networkName: link.networkName,
      }));
      setSocialLinks(links);
    } else {
      resetForm();
    }
  }, [editContact, isOpen]);

  const resetForm = () => {
    setFullName("");
    setPhone("");
    setEmail("");
    setCompany("");
    setPosition("");
    setNotes("");
    setAvatarUrl(null);
    setAvatarFile(null);
    setSocialLinks([]);
    setPaymentMethods([]);
    setCurrentView("main");
    resetPaymentForm();
  };

  const resetPaymentForm = () => {
    setNewPaymentType("card");
    setNewPaymentLabel("");
    setNewPaymentValue("");
    setNewPaymentNetwork("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleBack = () => {
    if (currentView === "addPayment") {
      setCurrentView("payments");
      resetPaymentForm();
    } else {
      setCurrentView("main");
    }
  };

  const handleAvatarClick = () => {
    tap();
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error(t("toast.selectImageFile"));
        return;
      }
      const url = URL.createObjectURL(file);
      setCropImageSrc(url);
      setIsCropDialogOpen(true);
    }
    e.target.value = '';
  };

  const handleCropComplete = async (croppedImage: string) => {
    setAvatarUrl(croppedImage);
    setCropImageSrc(null);
    setIsCropDialogOpen(false);
    
    // Convert to file for upload
    const response = await fetch(croppedImage);
    const blob = await response.blob();
    const croppedFile = new File([blob], 'contact-avatar.jpg', { type: 'image/jpeg' });
    setAvatarFile(croppedFile);
  };

  const handleAddPayment = () => {
    tap();
    if (!newPaymentLabel.trim() || !newPaymentValue.trim()) {
      toast.error(t("contacts.paymentFieldsRequired"));
      return;
    }

    const newPayment: PaymentMethod = {
      id: `payment-${Date.now()}`,
      type: newPaymentType,
      label: newPaymentLabel.trim(),
      value: newPaymentValue.trim(),
      network: newPaymentType === "crypto" ? newPaymentNetwork : undefined,
    };

    setPaymentMethods(prev => [...prev, newPayment]);
    setCurrentView("payments");
    resetPaymentForm();
    toast.success(t("contacts.paymentAdded"));
  };

  const handleRemovePayment = (id: string) => {
    tap();
    setPaymentMethods(prev => prev.filter(p => p.id !== id));
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      toast.error(t("contacts.nameRequired"));
      return;
    }

    setIsSaving(true);
    tap();

    try {
      let finalAvatarUrl = avatarUrl;

      // Upload avatar if new file
      if (avatarFile && editContact?.id) {
        const uploadedUrl = await uploadAvatar(avatarFile, editContact.id);
        if (uploadedUrl) finalAvatarUrl = uploadedUrl;
      }

      // Convert SocialLink to ContactSocialLink
      const contactSocialLinks: ContactSocialLink[] = socialLinks.map(link => ({
        id: link.id,
        networkId: link.networkId,
        networkName: link.networkName,
        url: link.url,
      }));

      const contactData = {
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        company: company.trim() || undefined,
        position: position.trim() || undefined,
        notes: notes.trim() || undefined,
        avatar_url: finalAvatarUrl || undefined,
        payment_methods: paymentMethods,
        social_links: contactSocialLinks,
      };

      let savedContact: SavedContact | null = null;

      if (editContact) {
        // Update existing
        const success = await updateContact(editContact.id, contactData);
        if (success) {
          savedContact = { ...editContact, ...contactData };
        }
      } else {
        // Create new
        savedContact = await createContact(contactData);
        
        // Upload avatar for new contact
        if (savedContact && avatarFile) {
          const uploadedUrl = await uploadAvatar(avatarFile, savedContact.id);
          if (uploadedUrl) {
            await updateContact(savedContact.id, { avatar_url: uploadedUrl });
            savedContact.avatar_url = uploadedUrl;
          }
        }
      }

      if (savedContact) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          onSaved?.(savedContact!);
          handleClose();
        }, 1000);
      }
    } catch (error) {
      console.error("Failed to save contact:", error);
      toast.error(t("contacts.saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editContact) return;
    
    tap();
    setIsDeleting(true);

    try {
      const success = await deleteContact(editContact.id);
      if (success) {
        handleClose();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const initials = fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || "?";

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

  const renderMainView = () => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6 px-4 pb-8"
    >
      {/* Avatar */}
      <div className="flex justify-center pt-4">
        <div className="relative">
          <button onClick={handleAvatarClick} className="group relative">
            <Avatar className="w-24 h-24 border-4 border-primary/20">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary/20 to-primary/10">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-8 h-8 text-white" />
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Basic Info */}
      <div className="space-y-4">
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder={t("contacts.fullName")}
            className="pl-10 h-12 rounded-xl"
          />
        </div>

        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder={t("contacts.phone")}
            type="tel"
            className="pl-10 h-12 rounded-xl"
          />
        </div>

        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={t("contacts.email")}
            type="email"
            className="pl-10 h-12 rounded-xl"
          />
        </div>

        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={company}
            onChange={e => setCompany(e.target.value)}
            placeholder={t("contacts.company")}
            className="pl-10 h-12 rounded-xl"
          />
        </div>

        <div className="relative">
          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={position}
            onChange={e => setPosition(e.target.value)}
            placeholder={t("contacts.position")}
            className="pl-10 h-12 rounded-xl"
          />
        </div>

        <div className="relative">
          <StickyNote className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
          <Textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={t("contacts.notes")}
            className="pl-10 min-h-[80px] rounded-xl resize-none"
          />
        </div>
      </div>

      {/* Social Links Button */}
      <button
        onClick={() => { tap(); setCurrentView("socials"); }}
        className="w-full flex items-center justify-between p-4 bg-muted/50 rounded-2xl hover:bg-muted/70 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <Link2 className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <p className="font-medium text-foreground">{t("contacts.socialLinks")}</p>
            <p className="text-sm text-muted-foreground">
              {socialLinks.length > 0 
                ? t("contacts.linksCount", { count: socialLinks.length })
                : t("contacts.addLinks")}
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </button>

      {/* Payment Methods Button */}
      <button
        onClick={() => { tap(); setCurrentView("payments"); }}
        className="w-full flex items-center justify-between p-4 bg-muted/50 rounded-2xl hover:bg-muted/70 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <p className="font-medium text-foreground">{t("contacts.paymentMethods")}</p>
            <p className="text-sm text-muted-foreground">
              {paymentMethods.length > 0 
                ? t("contacts.methodsCount", { count: paymentMethods.length })
                : t("contacts.addMethods")}
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </button>

      {/* Delete Button (for edit mode) */}
      {editContact && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="w-full flex items-center justify-center gap-2 p-4 text-destructive hover:bg-destructive/10 rounded-2xl transition-colors"
        >
          {isDeleting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Trash2 className="w-5 h-5" />
          )}
          <span>{t("contacts.deleteContact")}</span>
        </button>
      )}

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={isSaving || !fullName.trim()}
        className="w-full h-14 rounded-2xl text-lg font-semibold"
      >
        {isSaving ? (
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
        ) : showSuccess ? (
          <Check className="w-5 h-5 mr-2" />
        ) : null}
        {editContact ? t("common.save") : t("contacts.addContact")}
      </Button>
    </motion.div>
  );

  const renderSocialsView = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="px-4 pb-8"
    >
      <SocialLinksInput
        links={socialLinks}
        onChange={setSocialLinks}
        placeholder={t("contacts.pasteSocialLink")}
      />
    </motion.div>
  );

  const renderPaymentsView = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4 px-4 pb-8"
    >
      {/* Existing payments */}
      <AnimatePresence mode="popLayout">
        {paymentMethods.map((payment, index) => (
          <motion.div
            key={payment.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-3 p-4 bg-muted/50 rounded-2xl group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              {getPaymentIcon(payment.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground">{payment.label}</p>
              <p className="text-sm text-muted-foreground truncate">
                {payment.value}
                {payment.network && ` (${payment.network})`}
              </p>
            </div>
            <button
              onClick={() => handleRemovePayment(payment.id)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Add payment button */}
      <button
        onClick={() => { tap(); setCurrentView("addPayment"); }}
        className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-2xl hover:bg-muted/50 transition-colors text-muted-foreground"
      >
        <Plus className="w-5 h-5" />
        <span>{t("contacts.addPaymentMethod")}</span>
      </button>
    </motion.div>
  );

  const renderAddPaymentView = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4 px-4 pb-8"
    >
      {/* Payment type selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">{t("contacts.paymentType")}</label>
        <div className="grid grid-cols-3 gap-2">
          {PAYMENT_METHOD_TYPES.map(type => (
            <button
              key={type.value}
              onClick={() => { tap(); setNewPaymentType(type.value as PaymentMethod["type"]); }}
              className={cn(
                "p-3 rounded-xl border-2 transition-all text-sm font-medium",
                newPaymentType === type.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50"
              )}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Crypto network selector */}
      {newPaymentType === "crypto" && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">{t("contacts.network")}</label>
          <div className="grid grid-cols-2 gap-2">
            {CRYPTO_NETWORKS.map(network => (
              <button
                key={network.value}
                onClick={() => { tap(); setNewPaymentNetwork(network.value); }}
                className={cn(
                  "p-3 rounded-xl border-2 transition-all text-sm",
                  newPaymentNetwork === network.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                )}
              >
                {network.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Label input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">{t("contacts.paymentLabel")}</label>
        <Input
          value={newPaymentLabel}
          onChange={e => setNewPaymentLabel(e.target.value)}
          placeholder={t("contacts.paymentLabelPlaceholder")}
          className="h-12 rounded-xl"
        />
      </div>

      {/* Value input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">{t("contacts.paymentValue")}</label>
        <Input
          value={newPaymentValue}
          onChange={e => setNewPaymentValue(e.target.value)}
          placeholder={t("contacts.paymentValuePlaceholder")}
          className="h-12 rounded-xl"
        />
      </div>

      {/* Add button */}
      <Button
        onClick={handleAddPayment}
        disabled={!newPaymentLabel.trim() || !newPaymentValue.trim()}
        className="w-full h-12 rounded-xl"
      >
        <Plus className="w-5 h-5 mr-2" />
        {t("contacts.addPaymentMethod")}
      </Button>
    </motion.div>
  );

  const getTitle = () => {
    switch (currentView) {
      case "socials": return t("contacts.socialLinks");
      case "payments": return t("contacts.paymentMethods");
      case "addPayment": return t("contacts.addPaymentMethod");
      default: return editContact ? t("contacts.editContact") : t("contacts.addContact");
    }
  };

  return (
    <>
      <Drawer open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DrawerContent className="max-h-[95vh]">
          <DrawerHeader className="border-b border-border/50">
            <div className="flex items-center">
              {currentView !== "main" && (
                <button
                  onClick={handleBack}
                  className="mr-3 w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"
                >
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
              )}
              <DrawerTitle className="flex-1">{getTitle()}</DrawerTitle>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </DrawerHeader>

          <div className="overflow-y-auto max-h-[80vh]">
            <AnimatePresence mode="wait">
              {currentView === "main" && renderMainView()}
              {currentView === "socials" && renderSocialsView()}
              {currentView === "payments" && renderPaymentsView()}
              {currentView === "addPayment" && renderAddPaymentView()}
            </AnimatePresence>
          </div>
        </DrawerContent>
      </Drawer>

      <AvatarCropDialog
        open={isCropDialogOpen}
        onOpenChange={setIsCropDialogOpen}
        imageSrc={cropImageSrc || ""}
        onCropComplete={handleCropComplete}
      />
    </>
  );
};

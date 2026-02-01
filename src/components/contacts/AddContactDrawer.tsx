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
  X,
  ChevronRight,
  CreditCard,
  Wallet,
  Loader2,
  Check,
  Trash2,
  Link2,
  Plus,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { useSavedContacts } from "@/hooks/useSavedContacts";
import { SavedContact, PaymentMethod, ContactSocialLink } from "@/types/contact";
import { SocialLinksInput, SocialLink } from "@/components/settings/SocialLinksInput";
import { AvatarCropDialog } from "@/components/settings/AvatarCropDialog";
import { PaymentMethodDrawer } from "./PaymentMethodDrawer";
import { ImageUploadDrawer } from "./ImageUploadDrawer";
import { ExtractedContactData } from "@/hooks/useContactExtraction";
import { cn } from "@/lib/utils";

interface AddContactDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  editContact?: SavedContact | null;
  onSaved?: (contact: SavedContact) => void;
  onBack?: () => void;
}

type ViewType = "main" | "socials" | "payments";

export const AddContactDrawer = ({ 
  isOpen, 
  onClose, 
  editContact,
  onSaved,
  onBack
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

  // Payment drawer state
  const [isPaymentDrawerOpen, setIsPaymentDrawerOpen] = useState(false);

  // Image upload drawer state
  const [isImageUploadOpen, setIsImageUploadOpen] = useState(false);

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
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleBack = () => {
    setCurrentView("main");
  };

  const handleAddPaymentMethod = (payment: PaymentMethod) => {
    setPaymentMethods(prev => [...prev, payment]);
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

  const handleRemovePayment = (id: string) => {
    tap();
    setPaymentMethods(prev => prev.filter(p => p.id !== id));
  };

  // Handle extracted contact data from AI
  const handleExtractedData = async (data: ExtractedContactData) => {
    if (data.full_name) setFullName(data.full_name);
    if (data.phone) setPhone(data.phone);
    if (data.email) setEmail(data.email);
    if (data.company) setCompany(data.company);
    if (data.position) setPosition(data.position);
    if (data.notes) setNotes(data.notes);
    
    // Set avatar from extracted image (if found)
    if (data.avatar_url && data.avatar_url.startsWith('data:')) {
      setAvatarUrl(data.avatar_url);
      // Convert base64 to file for upload
      try {
        const response = await fetch(data.avatar_url);
        const blob = await response.blob();
        const file = new File([blob], 'contact-avatar.jpg', { type: 'image/jpeg' });
        setAvatarFile(file);
      } catch (err) {
        console.error('Failed to convert avatar to file:', err);
      }
    }
    
    // Set payment methods
    if (data.payment_methods && data.payment_methods.length > 0) {
      setPaymentMethods(prev => [...prev, ...data.payment_methods!]);
    }
    
    // Convert and set social links
    if (data.social_links && data.social_links.length > 0) {
      const links: SocialLink[] = data.social_links.map(link => ({
        id: link.id,
        url: link.url,
        networkId: link.networkId,
        networkName: link.networkName,
      }));
      setSocialLinks(prev => [...prev, ...links]);
    }
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
      <div className="flex justify-center pt-4 pb-2">
        <div className="relative">
          <button onClick={handleAvatarClick} className="relative group">
            <Avatar className="w-28 h-28 ring-4 ring-background shadow-xl overflow-hidden">
              <AvatarImage src={avatarUrl || undefined} className="object-cover" />
              <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-primary/20 to-primary/10">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-8 h-8 text-white" />
            </div>
            {/* Edit badge */}
            <div className="absolute bottom-0 right-0 w-9 h-9 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-background">
              <Camera className="w-4 h-4 text-primary-foreground" />
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

      {/* Smart Scan Button - only show when adding new contact */}
      {!editContact && (
        <button
          onClick={() => {
            tap();
            setIsImageUploadOpen(true);
          }}
          className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl hover:from-primary/15 hover:to-primary/10 transition-colors border border-primary/20"
        >
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)" }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium text-foreground">{t("settings.scanBusinessCard")}</p>
            <p className="text-sm text-muted-foreground">{t("settings.scanBusinessCardDescription")}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      )}

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
        onClick={() => { tap(); setIsPaymentDrawerOpen(true); }}
        className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-2xl hover:bg-muted/50 transition-colors text-muted-foreground"
      >
        <Plus className="w-5 h-5" />
        <span>{t("contacts.addPaymentMethod")}</span>
      </button>
    </motion.div>
  );

  const getTitle = () => {
    switch (currentView) {
      case "socials": return t("contacts.socialLinks");
      case "payments": return t("contacts.paymentMethods");
      default: return editContact ? t("contacts.editContact") : t("contacts.addContact");
    }
  };

  return (
    <>
      <Drawer open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DrawerContent className="max-h-[95vh]">
          <DrawerHeader className="border-b border-border/50">
            <div className="flex items-center">
              {/* Back button - show when in subview OR when editing contact in main view */}
              {(currentView !== "main" || (currentView === "main" && editContact && onBack)) && (
                <button
                  onClick={currentView !== "main" ? handleBack : onBack}
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

      <PaymentMethodDrawer
        isOpen={isPaymentDrawerOpen}
        onClose={() => setIsPaymentDrawerOpen(false)}
        onAdd={handleAddPaymentMethod}
      />

      <ImageUploadDrawer
        isOpen={isImageUploadOpen}
        onClose={() => setIsImageUploadOpen(false)}
        onExtracted={handleExtractedData}
      />
    </>
  );
};

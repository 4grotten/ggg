/**
 * AddContactDrawer - Full form for adding/editing a contact
 * Similar to EditProfile with photo, socials, and payment methods
 */

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
  const [phones, setPhones] = useState<string[]>([""]);
  const [emails, setEmails] = useState<string[]>([""]);
  const [companies, setCompanies] = useState<string[]>([""]);
  const [positions, setPositions] = useState<string[]>([""]);
  const [notesList, setNotesList] = useState<string[]>([""]);
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

  // Helper: split stored single string into array
  const splitField = (val: string | undefined) => {
    if (!val) return [""];
    const parts = val.split('\n').filter(Boolean);
    return parts.length ? parts : [""];
  };

  // Track if data has changed (for edit mode)
  const hasChanges = editContact ? (
    fullName !== editContact.full_name ||
    phones.join('\n') !== (editContact.phone || "") ||
    emails.join('\n') !== (editContact.email || "") ||
    companies.join('\n') !== (editContact.company || "") ||
    positions.join('\n') !== (editContact.position || "") ||
    notesList.join('\n') !== (editContact.notes || "") ||
    avatarUrl !== (editContact.avatar_url || null) ||
    avatarFile !== null ||
    JSON.stringify(paymentMethods) !== JSON.stringify(editContact.payment_methods || []) ||
    JSON.stringify(socialLinks.map(l => ({ id: l.id, url: l.url, networkId: l.networkId, networkName: l.networkName }))) !== 
      JSON.stringify((editContact.social_links || []).map(l => ({ id: l.id, url: l.url, networkId: l.networkId, networkName: l.networkName })))
  ) : false;

  // Initialize form with edit contact data
  useEffect(() => {
    if (editContact) {
      setFullName(editContact.full_name);
      setPhones(splitField(editContact.phone));
      setEmails(splitField(editContact.email));
      setCompanies(splitField(editContact.company));
      setPositions(splitField(editContact.position));
      setNotesList(splitField(editContact.notes));
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
    setPhones([""]);
    setEmails([""]);
    setCompanies([""]);
    setPositions([""]);
    setNotesList([""]);
    setAvatarUrl(null);
    setAvatarFile(null);
    setSocialLinks([]);
    setPaymentMethods([]);
    setCurrentView("main");
  };

  // Multi-value helpers
  const updateArrayItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number, value: string) => {
    setter(prev => prev.map((v, i) => i === index ? value : v));
  };
  const addArrayItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    tap();
    setter(prev => [...prev, ""]);
  };
  const removeArrayItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number) => {
    tap();
    setter(prev => prev.length > 1 ? prev.filter((_, i) => i !== index) : [""]);
  };
  const firstNonEmpty = (arr: string[]) => arr.map(s => (s || '').trim()).find(Boolean) || undefined;
  const allNonEmpty = (arr: string[]) => arr.map(s => (s || '').trim()).filter(Boolean);

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
    // Helper: normalize string | string[] into string[]
    const toArray = (val: string | string[] | undefined): string[] => {
      if (!val) return [];
      return Array.isArray(val) ? val : [val];
    };

    if (data.full_name) setFullName(data.full_name);

    const extractedPhones = toArray(data.phone);
    if (extractedPhones.length) {
      setPhones(prev => {
        const cleaned = prev.filter(p => p.trim());
        return cleaned.length ? [...cleaned, ...extractedPhones] : extractedPhones;
      });
    }

    const extractedEmails = toArray(data.email);
    if (extractedEmails.length) {
      setEmails(prev => {
        const cleaned = prev.filter(e => e.trim());
        return cleaned.length ? [...cleaned, ...extractedEmails] : extractedEmails;
      });
    }

    const extractedCompanies = toArray(data.company);
    if (extractedCompanies.length) {
      setCompanies(prev => {
        const cleaned = prev.filter(c => c.trim());
        return cleaned.length ? [...cleaned, ...extractedCompanies] : extractedCompanies;
      });
    }

    const extractedPositions = toArray(data.position);
    if (extractedPositions.length) {
      setPositions(prev => {
        const cleaned = prev.filter(p => p.trim());
        return cleaned.length ? [...cleaned, ...extractedPositions] : extractedPositions;
      });
    }

    const extractedNotes = toArray(data.notes);
    if (extractedNotes.length) {
      setNotesList(prev => {
        const cleaned = prev.filter(n => n.trim());
        return cleaned.length ? [...cleaned, ...extractedNotes] : extractedNotes;
      });
    }
    
    // Set avatar from extracted image (if found)
    if (data.avatar_url) {
      setAvatarUrl(data.avatar_url);
      // Convert to file for upload if it's a data URL
      if (data.avatar_url.startsWith('data:')) {
        try {
          const response = await fetch(data.avatar_url);
          const blob = await response.blob();
          const file = new File([blob], 'contact-avatar.jpg', { type: 'image/jpeg' });
          setAvatarFile(file);
        } catch (err) {
          console.error('Failed to convert avatar to file:', err);
        }
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

      // Convert SocialLink to ContactSocialLink, fix invalid URLs
      const contactSocialLinks: ContactSocialLink[] = socialLinks
        .filter(link => link.url && link.url.trim())
        .map(link => {
          let url = link.url.trim();
          // Ensure URLs have a protocol
          if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('tel:') && !url.startsWith('mailto:')) {
            // Skip obviously invalid URLs like "@username"
            if (url.startsWith('@') || (!url.includes('.') && !url.includes('/'))) {
              url = `https://${link.networkId}.com/${url.replace('@', '')}`;
            } else {
              url = `https://${url}`;
            }
          }
          return {
            id: link.id,
            networkId: link.networkId,
            networkName: link.networkName,
            url,
          };
        });

      // API accepts single string per field — send first value, extras go to notes
      const phoneValues = allNonEmpty(phones);
      const emailValues = allNonEmpty(emails);
      const companyValues = allNonEmpty(companies);
      const positionValues = allNonEmpty(positions);
      const notesValues = allNonEmpty(notesList);

      // Collect extra values into notes
      const extraParts: string[] = [];
      if (phoneValues.length > 1) {
        extraParts.push(`📱 ${phoneValues.slice(1).join(', ')}`);
      }
      if (emailValues.length > 1) {
        extraParts.push(`📧 ${emailValues.slice(1).join(', ')}`);
      }
      if (companyValues.length > 1) {
        extraParts.push(`🏢 ${companyValues.slice(1).join(', ')}`);
      }
      if (positionValues.length > 1) {
        extraParts.push(`💼 ${positionValues.slice(1).join(', ')}`);
      }

      const mainNotes = notesValues.join('\n');
      const extraNotes = extraParts.length > 0 ? extraParts.join('\n') : '';
      const combinedNotes = [mainNotes, extraNotes].filter(Boolean).join('\n---\n') || undefined;

      const contactData = {
        full_name: (fullName || '').trim(),
        phone: phoneValues[0] || undefined,
        email: emailValues[0] || undefined,
        company: companyValues[0] || undefined,
        position: positionValues[0] || undefined,
        notes: combinedNotes,
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
    <div className="space-y-6 px-4 pb-8 animate-fade-in">
      {/* Avatar - Premium style with CSS animated glow */}
      <div className="flex justify-center pt-6 pb-4">
        <div className="relative animate-scale-in">
          {/* Animated glow ring - CSS animation */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary via-purple-500 to-pink-500 blur-xl animate-pulse-slow" />
          
          <button onClick={handleAvatarClick} className="relative group">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/50 via-purple-500/50 to-pink-500/50 blur-md opacity-60" />
            <Avatar className="relative w-32 h-32 ring-4 ring-white/30 shadow-2xl overflow-hidden">
              <AvatarImage src={avatarUrl || undefined} className="object-cover" />
              <AvatarFallback className="text-4xl font-bold bg-gradient-to-br from-primary/30 via-purple-500/20 to-pink-500/20 text-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Camera className="w-10 h-10 text-white drop-shadow-lg" />
            </div>
            {/* Floating camera badge */}
            <div className="absolute -bottom-1 -right-1 w-11 h-11 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center shadow-xl border-3 border-background hover:scale-110 hover:rotate-6 transition-transform duration-200">
              <Camera className="w-5 h-5 text-white" />
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

      {/* Smart Scan Button - CSS animated style */}
      <button
        onClick={() => {
          tap();
          setIsImageUploadOpen(true);
        }}
        className="w-full relative overflow-hidden rounded-2xl shadow-lg group active:scale-[0.98] transition-transform duration-150"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 animate-shimmer" />
        <div className="relative flex items-center gap-4 p-4">
          <div className="w-12 h-12 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white animate-spin-slow" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-bold text-white text-lg drop-shadow">
              {editContact ? t("contacts.loadInfoWithAI") : t("settings.scanBusinessCard")}
            </p>
            <p className="text-sm text-white/80">
              {editContact ? t("contacts.loadInfoWithAIDescription") : t("settings.scanBusinessCardDescription")}
            </p>
          </div>
          <ChevronRight className="w-6 h-6 text-white/80 animate-bounce-x" />
        </div>
      </button>

      {/* Basic Info - Premium glassmorphism inputs */}
      <div className="space-y-4">
        {/* Form section header */}
        <div className="flex items-center gap-3 px-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {t("settings.personalDetails")}
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
        </div>
        
        <div className="space-y-3">
          {/* Name input */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-purple-500/5 to-pink-500/10 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur-lg" />
            <div className="relative bg-muted/50 rounded-2xl border border-border/50 group-focus-within:border-primary/50 transition-colors duration-200 overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-primary/10 to-transparent flex items-center justify-center">
                <User className="w-5 h-5 text-primary/70" />
              </div>
              <Input
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder={t("contacts.fullName")}
                className="pl-14 h-14 rounded-2xl bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base font-medium"
              />
            </div>
          </div>

          {/* Phone inputs */}
          {phones.map((phoneVal, idx) => (
            <div key={`phone-${idx}`} className="relative group flex items-center gap-2">
              <div className="flex-1 relative bg-muted/50 rounded-2xl border border-border/50 group-focus-within:border-primary/50 transition-colors duration-200 overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-emerald-500/10 to-transparent flex items-center justify-center">
                  <Phone className="w-5 h-5 text-emerald-600/70" />
                </div>
                <Input
                  value={phoneVal}
                  onChange={e => updateArrayItem(setPhones, idx, e.target.value)}
                  placeholder={t("contacts.phone")}
                  type="tel"
                  className="pl-14 h-14 rounded-2xl bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
                />
              </div>
              {phones.length > 1 && (
                <button onClick={() => removeArrayItem(setPhones, idx)} className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              {idx === phones.length - 1 && (
                <button onClick={() => addArrayItem(setPhones)} className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-primary/60 hover:text-primary hover:bg-primary/10 transition-colors">
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}

          {/* Email inputs */}
          {emails.map((emailVal, idx) => (
            <div key={`email-${idx}`} className="relative group flex items-center gap-2">
              <div className="flex-1 relative bg-muted/50 rounded-2xl border border-border/50 group-focus-within:border-primary/50 transition-colors duration-200 overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-blue-500/10 to-transparent flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600/70" />
                </div>
                <Input
                  value={emailVal}
                  onChange={e => updateArrayItem(setEmails, idx, e.target.value)}
                  placeholder={t("contacts.email")}
                  type="email"
                  className="pl-14 h-14 rounded-2xl bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
                />
              </div>
              {emails.length > 1 && (
                <button onClick={() => removeArrayItem(setEmails, idx)} className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              {idx === emails.length - 1 && (
                <button onClick={() => addArrayItem(setEmails)} className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-primary/60 hover:text-primary hover:bg-primary/10 transition-colors">
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}

          {/* Company inputs */}
          {companies.map((companyVal, idx) => (
            <div key={`company-${idx}`} className="relative group flex items-center gap-2">
              <div className="flex-1 relative bg-muted/50 rounded-2xl border border-border/50 group-focus-within:border-primary/50 transition-colors duration-200 overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-amber-500/10 to-transparent flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-amber-600/70" />
                </div>
                <Input
                  value={companyVal}
                  onChange={e => updateArrayItem(setCompanies, idx, e.target.value)}
                  placeholder={t("contacts.company")}
                  className="pl-14 h-14 rounded-2xl bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
                />
              </div>
              {companies.length > 1 && (
                <button onClick={() => removeArrayItem(setCompanies, idx)} className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              {idx === companies.length - 1 && (
                <button onClick={() => addArrayItem(setCompanies)} className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-primary/60 hover:text-primary hover:bg-primary/10 transition-colors">
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}

          {/* Position inputs */}
          {positions.map((positionVal, idx) => (
            <div key={`position-${idx}`} className="relative group flex items-center gap-2">
              <div className="flex-1 relative bg-muted/50 rounded-2xl border border-border/50 group-focus-within:border-primary/50 transition-colors duration-200 overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-violet-500/10 to-transparent flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-violet-600/70" />
                </div>
                <Input
                  value={positionVal}
                  onChange={e => updateArrayItem(setPositions, idx, e.target.value)}
                  placeholder={t("contacts.position")}
                  className="pl-14 h-14 rounded-2xl bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
                />
              </div>
              {positions.length > 1 && (
                <button onClick={() => removeArrayItem(setPositions, idx)} className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              {idx === positions.length - 1 && (
                <button onClick={() => addArrayItem(setPositions)} className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-primary/60 hover:text-primary hover:bg-primary/10 transition-colors">
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}

          {/* Notes inputs */}
          {notesList.map((noteVal, idx) => (
            <div key={`note-${idx}`} className="relative group flex items-center gap-2">
              <div className="flex-1 relative bg-muted/50 rounded-2xl border border-border/50 group-focus-within:border-primary/50 transition-colors duration-200 overflow-hidden">
                <div className="absolute left-0 top-0 w-12 h-14 bg-gradient-to-r from-rose-500/10 to-transparent flex items-center justify-center">
                  <StickyNote className="w-5 h-5 text-rose-600/70" />
                </div>
                <Textarea
                  value={noteVal}
                  onChange={e => updateArrayItem(setNotesList, idx, e.target.value)}
                  placeholder={t("contacts.notes")}
                  className="pl-14 pt-4 min-h-[100px] rounded-2xl bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base resize-none"
                />
              </div>
              {notesList.length > 1 && (
                <button onClick={() => removeArrayItem(setNotesList, idx)} className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              {idx === notesList.length - 1 && (
                <button onClick={() => addArrayItem(setNotesList)} className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-primary/60 hover:text-primary hover:bg-primary/10 transition-colors">
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Social Links Button - CSS optimized */}
      <button
        onClick={() => { tap(); setCurrentView("socials"); }}
        className="w-full relative overflow-hidden rounded-2xl group active:scale-[0.98] transition-all duration-150"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-muted/80 via-muted/60 to-muted/40 backdrop-blur-xl" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute inset-0 ring-1 ring-inset ring-border/50 group-hover:ring-primary/30 rounded-2xl transition-all duration-200" />
        
        <div className="relative flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-105 group-hover:rotate-3 transition-transform duration-200">
              <Link2 className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-foreground">{t("contacts.socialLinks")}</p>
              <p className="text-sm text-muted-foreground">
                {socialLinks.length > 0 
                  ? t("contacts.linksCount", { count: socialLinks.length })
                  : t("contacts.addLinks")}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-primary animate-bounce-x" />
        </div>
      </button>

      {/* Payment Methods Button - CSS optimized */}
      <button
        onClick={() => { tap(); setCurrentView("payments"); }}
        className="w-full relative overflow-hidden rounded-2xl group active:scale-[0.98] transition-all duration-150"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-muted/80 via-muted/60 to-muted/40 backdrop-blur-xl" />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute inset-0 ring-1 ring-inset ring-border/50 group-hover:ring-emerald-500/30 rounded-2xl transition-all duration-200" />
        
        <div className="relative flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 flex items-center justify-center shadow-lg group-hover:scale-105 group-hover:-rotate-3 transition-transform duration-200">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-foreground">{t("contacts.paymentMethods")}</p>
              <p className="text-sm text-muted-foreground">
                {paymentMethods.length > 0 
                  ? t("contacts.methodsCount", { count: paymentMethods.length })
                  : t("contacts.addMethods")}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-emerald-600 animate-bounce-x" />
        </div>
      </button>

      {/* Delete Button (for edit mode) - CSS optimized */}
      {editContact && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="w-full relative overflow-hidden rounded-2xl group active:scale-[0.98] transition-all duration-150"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent" />
          <div className="absolute inset-0 ring-1 ring-inset ring-destructive/20 group-hover:ring-destructive/40 rounded-2xl transition-all duration-200" />
          
          <div className="relative flex items-center justify-center gap-3 p-4 text-destructive">
            {isDeleting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Trash2 className="w-5 h-5" />
            )}
            <span className="font-semibold">{t("contacts.deleteContact")}</span>
          </div>
        </button>
      )}

      {/* Save Button - CSS gradient style */}
      <div>
        <Button
          onClick={handleSave}
          disabled={isSaving || !fullName.trim()}
          className="w-full h-14 rounded-2xl text-lg font-bold bg-gradient-to-r from-primary via-purple-600 to-primary hover:from-primary/90 hover:via-purple-600/90 hover:to-primary/90 shadow-xl relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-shimmer" />
          <span className="relative flex items-center gap-2">
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : showSuccess ? (
              <Check className="w-5 h-5" />
            ) : null}
            {editContact ? t("common.save") : t("contacts.addContact")}
          </span>
        </Button>
      </div>
    </div>
  );

  const renderSocialsView = () => (
    <div className="px-4 pb-8 animate-fade-in">
      <SocialLinksInput
        links={socialLinks}
        onChange={setSocialLinks}
        placeholder={t("contacts.pasteSocialLink")}
      />
    </div>
  );

  const renderPaymentsView = () => (
    <div className="space-y-4 px-4 pb-8 animate-fade-in">
      {/* Section header */}
      <div className="flex items-center gap-3 px-1 mb-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center">
          <CreditCard className="w-4 h-4 text-emerald-600" />
        </div>
        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {t("contacts.paymentMethods")}
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
      </div>
      
      {/* Existing payments - CSS optimized cards */}
      <div className="space-y-3">
        {paymentMethods.map((payment) => (
          <div
            key={payment.id}
            className="relative overflow-hidden rounded-2xl group animate-fade-in"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-muted/80 via-muted/60 to-muted/40 backdrop-blur-xl" />
            <div className="absolute inset-0 ring-1 ring-inset ring-border/50 rounded-2xl" />
            
            <div className="relative flex items-center gap-4 p-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-lg group-hover:scale-105 group-hover:rotate-3 transition-transform duration-200">
                {getPaymentIcon(payment.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">{payment.label}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {payment.value}
                  {payment.network && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-xs font-medium text-primary">
                      {payment.network}
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => handleRemovePayment(payment.id)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:scale-110 hover:rotate-90 transition-all duration-200 opacity-0 group-hover:opacity-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add payment button - CSS optimized dashed style */}
      <button
        onClick={() => { tap(); setIsPaymentDrawerOpen(true); }}
        className="w-full relative overflow-hidden rounded-2xl group active:scale-[0.98] transition-all duration-150"
      >
        <div className="absolute inset-0 border-2 border-dashed border-border group-hover:border-primary/50 rounded-2xl transition-colors duration-200" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="relative flex items-center justify-center gap-3 p-5 text-muted-foreground group-hover:text-primary transition-colors duration-200">
          <Plus className="w-6 h-6 animate-spin-slow" />
          <span className="font-semibold">{t("contacts.addPaymentMethod")}</span>
        </div>
      </button>
    </div>
  );

  const getTitle = () => {
    switch (currentView) {
      case "socials": return t("contacts.socialLinks");
      case "payments": return t("contacts.paymentMethods");
      default: return editContact ? t("contacts.contactSettings") : t("contacts.addContact");
    }
  };

  return (
    <>
      <Drawer open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DrawerContent className="max-h-[95vh]">
          <DrawerHeader className="border-b border-border/50">
            <div className="grid grid-cols-[auto,1fr,auto] items-center gap-2">
              {/* Back button - show when in subview OR when editing contact in main view */}
              <div className="flex items-center">
                {(currentView !== "main" || (currentView === "main" && editContact && onBack)) && (
                  <button
                    onClick={currentView !== "main" ? handleBack : onBack}
                    className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"
                  >
                    <ChevronRight className="w-5 h-5 rotate-180" />
                  </button>
                )}
              </div>
              <DrawerTitle className="text-left">{getTitle()}</DrawerTitle>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
              >
                <Plus className="w-5 h-5 text-primary rotate-45" />
              </button>
            </div>
          </DrawerHeader>

          <div className="overflow-y-auto max-h-[80vh]">
            {currentView === "main" && renderMainView()}
            {currentView === "socials" && renderSocialsView()}
            {currentView === "payments" && renderPaymentsView()}
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

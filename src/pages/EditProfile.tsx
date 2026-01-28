import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AvatarCropDialog } from "@/components/settings/AvatarCropDialog";
import { useAvatar } from "@/contexts/AvatarContext";
import { useAuth } from "@/contexts/AuthContext";
import { Camera, Check, ChevronDown, ChevronRight, Lock, Eye, EyeOff, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { AnimatedDrawerItem, AnimatedDrawerContainer } from "@/components/ui/animated-drawer-item";
import { DateWheelPicker } from "@/components/ui/date-wheel-picker";
import { changePassword, getUserEmail, forgotPasswordEmail, getSocialNetworks, addSocialNetwork, deleteSocialNetwork, type SocialNetworkItem } from "@/services/api/authApi";
import { PasswordMatchInput } from "@/components/settings/PasswordMatchInput";
import { SocialLinksInput, SocialLink, migrateSocialLinks } from "@/components/settings/SocialLinksInput";

const profileSchemaBase = z.object({
  full_name: z.string().min(1).min(2).max(100),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  date_of_birth: z.string().optional(),
  gender: z.enum(["male", "female", ""]).optional(),
});

type ProfileFormData = z.infer<typeof profileSchemaBase>;

const EditProfile = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { avatarUrl, setAvatarUrl } = useAvatar();
  const { user, isAuthenticated, updateAvatar, updateUserProfile, refreshUser } = useAuth();
  
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isGenderOpen, setIsGenderOpen] = useState(false);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date | undefined>(undefined);
  const [showFlash, setShowFlash] = useState(false);
  const [avatarKey, setAvatarKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Password change state
  const [isPasswordDrawerOpen, setIsPasswordDrawerOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  
  // Forgot password email state
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);
  
  // Social media state
  const [isSocialDrawerOpen, setIsSocialDrawerOpen] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [isSavingSocial, setIsSavingSocial] = useState(false);
  const [isLoadingSocial, setIsLoadingSocial] = useState(false);
  const [originalSocialLinks, setOriginalSocialLinks] = useState<SocialNetworkItem[]>([]);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Create schema with localized messages
  const profileSchema = z.object({
    full_name: z.string()
      .min(1, t("editProfile.validation.nameRequired", "Name is required"))
      .min(2, t("editProfile.validation.nameTooShort", "Name must be at least 2 characters"))
      .max(100, t("editProfile.validation.nameTooLong", "Name must be less than 100 characters")),
    username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional().or(z.literal("")),
    email: z.string().email().optional().or(z.literal("")),
    date_of_birth: z.string().optional(),
    gender: z.enum(["male", "female", ""]).optional(),
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || "",
      username: user?.username || "",
      email: user?.email || "",
      date_of_birth: user?.date_of_birth || "",
      gender: (user?.gender as "male" | "female" | "") || "",
    },
  });

  // Update form when user data loads
  useEffect(() => {
    if (user) {
      form.reset({
        full_name: user.full_name || "",
        username: user.username || "",
        email: user.email || "",
        date_of_birth: user.date_of_birth || "",
        gender: (user.gender as "male" | "female" | "") || "",
      });
    }
  }, [user, form]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth/phone");
    }
  }, [isAuthenticated, navigate]);

  const displayAvatar = user?.avatar?.medium || user?.avatar?.file || avatarUrl;
  const initials = (user?.full_name || "U").split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error(t("toast.selectImageFile"));
        return;
      }
      setPendingFile(file);
      const url = URL.createObjectURL(file);
      setCropImageSrc(url);
      setIsCropDialogOpen(true);
    }
    event.target.value = '';
  };

  const handleCropComplete = async (croppedImage: string) => {
    setAvatarUrl(croppedImage);
    setCropImageSrc(null);
    setIsCropDialogOpen(false);
    
    if (isAuthenticated) {
      setIsUploadingAvatar(true);
      try {
        // Convert base64 cropped image to File
        const response = await fetch(croppedImage);
        const blob = await response.blob();
        const croppedFile = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
        
        await updateAvatar(croppedFile);
        await refreshUser(); // Refresh to get updated avatar URL
        
        // Trigger flash effect and avatar animation
        setShowFlash(true);
        setAvatarKey(prev => prev + 1);
        setTimeout(() => setShowFlash(false), 400);
        
        toast.success(t("toast.avatarUpdated"));
      } catch (error) {
        console.error('Failed to upload avatar:', error);
        toast.error(t("toast.avatarUploadFailed") || "Failed to upload avatar");
      } finally {
        setIsUploadingAvatar(false);
        setPendingFile(null);
      }
    } else {
      // Trigger flash for local preview
      setShowFlash(true);
      setAvatarKey(prev => prev + 1);
      setTimeout(() => setShowFlash(false), 400);
      
      toast.success(t("toast.avatarUpdated"));
      setPendingFile(null);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setIsSaving(true);
    try {
      await updateUserProfile({
        full_name: data.full_name,
        username: data.username || undefined,
        email: data.email || undefined,
        date_of_birth: data.date_of_birth || undefined,
        gender: data.gender || undefined,
        avatar_id: user?.avatar?.id,
      });
      
      // Show success animation before navigating
      setIsSaving(false);
      setShowSuccessAnimation(true);
      
      // Wait for animation, then navigate
      setTimeout(() => {
        navigate("/settings");
      }, 1200);
      
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(t("editProfile.saveFailed") || "Failed to update profile");
      setIsSaving(false);
    }
  };

  const genderOptions = [
    { value: "male", label: t("auth.profile.male") },
    { value: "female", label: t("auth.profile.female") },
    { value: "", label: t("auth.profile.notSelected") || "Не выбран" },
  ];

  const selectedGenderLabel = genderOptions.find(g => g.value === form.watch("gender"))?.label || t("editProfile.selectGender");

  const handleChangePassword = async () => {
    setPasswordError("");
    
    if (!currentPassword) {
      setPasswordError(t("editProfile.changePassword.currentRequired"));
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError(t("auth.resetPassword.passwordTooShort"));
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError(t("auth.resetPassword.passwordsNotMatch"));
      return;
    }
    
    setIsChangingPassword(true);
    try {
      const response = await changePassword(currentPassword, newPassword);
      if (response.error) {
        setPasswordError(typeof response.error === 'string' ? response.error : t("editProfile.changePassword.error"));
      } else {
        toast.success(t("editProfile.changePassword.success"));
        setIsPasswordDrawerOpen(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error: any) {
      setPasswordError(error.message || t("editProfile.changePassword.error"));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const resetPasswordForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setUserEmail(null);
    setResetEmailSent(false);
  };

  // Check if user has email when drawer opens
  const handlePasswordDrawerOpen = async (open: boolean) => {
    setIsPasswordDrawerOpen(open);
    if (open) {
      // Check for linked email
      setIsCheckingEmail(true);
      try {
        const response = await getUserEmail();
        if (response.data?.email) {
          setUserEmail(response.data.email);
        }
      } catch (error) {
        console.error('Failed to check email:', error);
      } finally {
        setIsCheckingEmail(false);
      }
    } else {
      resetPasswordForm();
    }
  };

  const handleForgotPasswordEmail = async () => {
    if (!userEmail) return;
    
    setIsSendingResetEmail(true);
    try {
      const response = await forgotPasswordEmail();
      if (response.error) {
        toast.error(t("editProfile.changePassword.emailSendError"));
      } else {
        setResetEmailSent(true);
        toast.success(t("editProfile.changePassword.emailSent"));
      }
    } catch (error) {
      toast.error(t("editProfile.changePassword.emailSendError"));
    } finally {
      setIsSendingResetEmail(false);
    }
  };

  // Load social links from API when drawer opens
  const handleSocialDrawerOpen = async (open: boolean) => {
    setIsSocialDrawerOpen(open);
    if (open && user?.id) {
      setIsLoadingSocial(true);
      try {
        const response = await getSocialNetworks(user.id);
        if (response.data) {
          setOriginalSocialLinks(response.data);
          // Convert API format to SocialLink format
          const links: SocialLink[] = response.data.map((item) => ({
            id: `api-${item.id}`,
            url: item.url,
            networkId: detectNetworkFromUrl(item.url),
            networkName: getNetworkNameFromUrl(item.url),
            apiId: item.id, // Store API id for deletion
          }));
          setSocialLinks(links);
        }
      } catch (error) {
        console.error('Failed to load social links:', error);
        toast.error(t("editProfile.socialLinks.loadError") || "Failed to load social links");
      } finally {
        setIsLoadingSocial(false);
      }
    }
  };

  // Helper to detect network from URL
  const detectNetworkFromUrl = (url: string): string => {
    const lowerUrl = url.toLowerCase();
    const patterns: Record<string, string[]> = {
      instagram: ["instagram.com", "instagr.am"],
      telegram: ["t.me", "telegram.me"],
      tiktok: ["tiktok.com"],
      youtube: ["youtube.com", "youtu.be"],
      twitter: ["twitter.com", "x.com"],
      facebook: ["facebook.com", "fb.com"],
      linkedin: ["linkedin.com"],
      github: ["github.com"],
      whatsapp: ["wa.me", "whatsapp.com"],
      vk: ["vk.com"],
    };
    for (const [networkId, domains] of Object.entries(patterns)) {
      if (domains.some(d => lowerUrl.includes(d))) return networkId;
    }
    return "website";
  };

  const getNetworkNameFromUrl = (url: string): string => {
    const networkId = detectNetworkFromUrl(url);
    const names: Record<string, string> = {
      instagram: "Instagram",
      telegram: "Telegram",
      tiktok: "TikTok",
      youtube: "YouTube",
      twitter: "X (Twitter)",
      facebook: "Facebook",
      linkedin: "LinkedIn",
      github: "GitHub",
      whatsapp: "WhatsApp",
      vk: "VK",
      website: "Website",
    };
    return names[networkId] || "Website";
  };

  const handleSaveSocialLinks = async () => {
    if (!user?.id) return;
    
    setIsSavingSocial(true);
    try {
      // Find links to delete (in original but not in current)
      const currentApiIds = socialLinks
        .filter(l => (l as any).apiId)
        .map(l => (l as any).apiId as number);
      
      const toDelete = originalSocialLinks.filter(
        orig => !currentApiIds.includes(orig.id)
      );
      
      // Find new links to add (no apiId means new)
      const toAdd = socialLinks.filter(l => !(l as any).apiId);
      
      // Delete removed links
      for (const link of toDelete) {
        await deleteSocialNetwork(user.id, link.id);
      }
      
      // Add new links
      for (const link of toAdd) {
        await addSocialNetwork(user.id, link.url);
      }
      
      toast.success(t("editProfile.socialLinks.saved") || "Social links saved");
      setIsSocialDrawerOpen(false);
    } catch (error) {
      console.error('Failed to save social links:', error);
      toast.error(t("editProfile.socialLinks.error") || "Failed to save");
    } finally {
      setIsSavingSocial(false);
    }
  };

  const hasSocialLinks = socialLinks.length > 0;

  return (
    <div className="flex flex-col min-h-screen bg-background overflow-x-hidden">
      {/* Success Animation Overlay */}
      <AnimatePresence>
        {showSuccessAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 20,
                delay: 0.1
              }}
              className="relative"
            >
              {/* Outer glow ring */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="absolute inset-0 w-24 h-24 rounded-full bg-green-500/30"
              />
              
              {/* Success circle */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: "spring",
                  stiffness: 400,
                  damping: 15,
                  delay: 0.1
                }}
                className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center shadow-2xl"
              >
                {/* Checkmark with draw animation */}
                <motion.svg
                  viewBox="0 0 24 24"
                  className="w-12 h-12 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <motion.path
                    d="M5 13l4 4L19 7"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ 
                      duration: 0.4, 
                      delay: 0.3,
                      ease: "easeOut"
                    }}
                  />
                </motion.svg>
              </motion.div>
              
              {/* Sparkle particles */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ 
                    scale: [0, 1, 0],
                    opacity: [1, 1, 0],
                    x: Math.cos((i / 6) * Math.PI * 2) * 60,
                    y: Math.sin((i / 6) * Math.PI * 2) * 60,
                  }}
                  transition={{ 
                    duration: 0.6, 
                    delay: 0.4 + i * 0.05,
                    ease: "easeOut"
                  }}
                  className="absolute top-1/2 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-400"
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Fixed Header - glassmorphism style */}
      <div className="fixed top-0 left-0 right-0 z-20 bg-white/50 dark:bg-card/70 backdrop-blur-2xl border-b border-border/50">
        <div className="flex items-center justify-between h-14 px-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-foreground hover:text-muted-foreground transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <span>{t("common.back")}</span>
          </button>
          <h1 className="text-lg font-semibold text-foreground">{t("editProfile.title")}</h1>
          <div className="w-16" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Scrollable Content - with top padding for fixed header */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pt-14 pb-28">
        <div className="px-4 py-6">
          {/* Avatar */}
          <div className="flex justify-center mb-8">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={handleAvatarClick}
              disabled={isUploadingAvatar}
              className="relative group"
            >
              {/* Avatar container - no animation on the avatar itself */}
              <div className="relative">
                <Avatar className="w-28 h-28 ring-4 ring-background shadow-xl overflow-hidden">
                  <AvatarImage 
                    src={displayAvatar} 
                    alt={user?.full_name || "User"} 
                    className="object-cover"
                  />
                  <AvatarFallback className="text-2xl bg-muted">{initials}</AvatarFallback>
                </Avatar>
                
                {/* Flash effect - bright flash that expands */}
                <AnimatePresence>
                  {showFlash && (
                    <>
                      {/* White flash burst */}
                      <motion.div
                        initial={{ opacity: 1, scale: 1 }}
                        animate={{ opacity: 0, scale: 1.5 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="absolute inset-0 bg-white rounded-full z-30 pointer-events-none"
                      />
                      {/* Glow ring effect */}
                      <motion.div
                        initial={{ opacity: 0.8, scale: 1 }}
                        animate={{ opacity: 0, scale: 2 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="absolute inset-0 rounded-full border-4 border-primary z-30 pointer-events-none"
                      />
                      {/* Success checkmark */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={{ delay: 0.2, duration: 0.3, type: "spring" }}
                        className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none"
                      >
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                          <Check className="w-7 h-7 text-white" strokeWidth={3} />
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Loading overlay - simple dots */}
              <AnimatePresence>
                {isUploadingAvatar && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full z-10"
                  >
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2.5 h-2.5 bg-white rounded-full"
                          animate={{ y: [0, -8, 0] }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: i * 0.15,
                            ease: "easeInOut"
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Hover overlay (only when not uploading) */}
              {!isUploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              )}
              
              {/* Edit badge */}
              <motion.div 
                className="absolute bottom-0 right-0 w-9 h-9 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-background"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Camera className="w-4 h-4 text-primary-foreground" />
              </motion.div>
            </button>
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Full Name */}
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      {t("editProfile.fullName")}
                      {!field.value && (
                        <motion.span
                          className="w-2 h-2 rounded-full bg-destructive"
                          animate={{ opacity: [1, 0.3, 1] }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                        />
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("editProfile.fullNamePlaceholder")}
                        className="h-14 rounded-2xl border-border bg-card px-4 text-base"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground mt-1.5 px-1">
                      {t("editProfile.fullNameDescription")}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Username / Nickname */}
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      {t("editProfile.username")}
                      {!field.value && (
                        <motion.span
                          className="w-2 h-2 rounded-full bg-destructive"
                          animate={{ opacity: [1, 0.3, 1] }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
                        />
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("editProfile.usernamePlaceholder")}
                        className="h-14 rounded-2xl border-border bg-card px-4 text-base"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground mt-1.5 px-1">
                      {t("editProfile.usernameDescription")}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      {t("editProfile.email")}
                      {!field.value && (
                        <motion.span
                          className="w-2 h-2 rounded-full bg-destructive"
                          animate={{ opacity: [1, 0.3, 1] }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                        />
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder={t("editProfile.emailPlaceholder")}
                        className="h-14 rounded-2xl border-border bg-card px-4 text-base"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground mt-1.5 px-1">
                      {t("editProfile.emailDescription")}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date of Birth */}
              <FormField
                control={form.control}
                name="date_of_birth"
                render={({ field }) => {
                  const dateValue = field.value ? new Date(field.value) : undefined;
                  const displayValue = dateValue && !isNaN(dateValue.getTime()) 
                    ? format(dateValue, "dd.MM.yyyy")
                    : null;
                  
                  return (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        {t("editProfile.dateOfBirth")}
                        {!field.value && (
                          <motion.span
                            className="w-2 h-2 rounded-full bg-destructive"
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                          />
                        )}
                      </FormLabel>
                      <FormControl>
                        <button
                          type="button"
                          onClick={() => {
                            setTempDate(dateValue || new Date(2000, 0, 1));
                            setIsDateOpen(true);
                          }}
                          className="w-full h-14 px-4 text-left border border-border rounded-2xl bg-card hover:bg-muted/50 transition-colors flex items-center justify-between text-base"
                        >
                          <span className={displayValue ? "text-foreground" : "text-muted-foreground"}>
                            {displayValue || t("editProfile.selectDateOfBirth")}
                          </span>
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        </button>
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1.5 px-1">
                        {t("editProfile.dateOfBirthDescription")}
                      </p>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              {/* Gender */}
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      {t("editProfile.gender")}
                      {!field.value && (
                        <motion.span
                          className="w-2 h-2 rounded-full bg-destructive"
                          animate={{ opacity: [1, 0.3, 1] }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                        />
                      )}
                    </FormLabel>
                    <FormControl>
                      <button
                        type="button"
                        onClick={() => setIsGenderOpen(true)}
                        className="w-full h-14 px-4 text-left border border-border rounded-2xl bg-card hover:bg-muted/50 transition-colors flex items-center justify-between text-base"
                      >
                        <span className={field.value ? "text-foreground" : "text-muted-foreground"}>
                          {selectedGenderLabel}
                        </span>
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      </button>
                    </FormControl>
                    <p className="text-xs text-muted-foreground mt-1.5 px-1">
                      {t("editProfile.genderDescription")}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Change Password Button */}
              <div className="pt-2 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    resetPasswordForm();
                    setIsPasswordDrawerOpen(true);
                  }}
                  className="w-full h-14 px-4 text-left border border-border rounded-2xl bg-card hover:bg-muted/50 transition-colors flex items-center justify-between text-base group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-foreground font-medium">{t("editProfile.changePassword.title")}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>

                {/* Social Links Button */}
                <button
                  type="button"
                  onClick={() => handleSocialDrawerOpen(true)}
                  className="w-full h-14 px-4 text-left border border-border rounded-2xl bg-card hover:bg-muted/50 transition-colors flex items-center justify-between text-base group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Share2 className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-foreground font-medium">{t("editProfile.socialLinks.title") || "Social Links"}</span>
                      {hasSocialLinks && (
                        <span className="text-xs text-muted-foreground">
                          {socialLinks.slice(0, 3).map(l => l.networkName).join(", ")}
                          {socialLinks.length > 3 && ` +${socialLinks.length - 3}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasSocialLinks && (
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                    )}
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </button>
              </div>
            </form>
          </Form>
        </div>
      </div>

      {/* Fixed Bottom Button - transparent glassmorphism */}
      <div className="fixed bottom-0 left-0 right-0 z-20 p-4 pb-safe max-w-[800px] mx-auto">
        <Button
          onClick={form.handleSubmit(onSubmit)}
          disabled={isSaving}
          className="w-full h-14 text-lg font-semibold"
        >
          {isSaving ? (
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-primary-foreground rounded-full"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                />
              ))}
            </div>
          ) : (
            t("editProfile.save")
          )}
        </Button>
      </div>

      {/* Gender Drawer */}
      <Drawer open={isGenderOpen} onOpenChange={setIsGenderOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t("editProfile.selectGender")}</DrawerTitle>
          </DrawerHeader>
          <AnimatedDrawerContainer>
            <div className="px-4 pb-8 space-y-2">
              {genderOptions.map((option, index) => (
                <AnimatedDrawerItem key={option.value} index={index}>
                  <button
                    onClick={() => {
                      form.setValue("gender", option.value as "male" | "female" | "");
                      setIsGenderOpen(false);
                    }}
                    className="w-full flex items-center justify-between py-4 px-4 rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-foreground font-medium">{option.label}</span>
                    {form.watch("gender") === option.value && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </button>
                </AnimatedDrawerItem>
              ))}
            </div>
          </AnimatedDrawerContainer>
        </DrawerContent>
      </Drawer>

      {/* Date of Birth Drawer */}
      <Drawer open={isDateOpen} onOpenChange={setIsDateOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t("editProfile.selectDateOfBirth")}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8">
            <div className="bg-muted/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4 px-2">
                <button 
                  onClick={() => setIsDateOpen(false)}
                  className="text-muted-foreground"
                >
                  <ChevronDown className="w-5 h-5 rotate-180" />
                </button>
                <span className="text-sm text-muted-foreground">
                  {t("editProfile.dateOfBirth")}
                </span>
                <button 
                  onClick={() => {
                    if (tempDate) {
                      form.setValue("date_of_birth", format(tempDate, "yyyy-MM-dd"));
                    }
                    setIsDateOpen(false);
                  }}
                  className="text-primary font-semibold"
                >
                  {t("history.done")}
                </button>
              </div>
              <DateWheelPicker
                value={tempDate}
                onChange={setTempDate}
                minYear={1920}
                maxYear={new Date().getFullYear()}
              />
            </div>
            {/* Clear date button */}
            {form.watch("date_of_birth") && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                type="button"
                onClick={() => {
                  form.setValue("date_of_birth", "");
                  setTempDate(undefined);
                  setIsDateOpen(false);
                }}
                className="w-full mt-4 py-3 text-destructive font-medium text-center hover:bg-destructive/10 rounded-xl transition-colors"
              >
                {t("editProfile.clearDate")}
              </motion.button>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Change Password Drawer */}
      <Drawer open={isPasswordDrawerOpen} onOpenChange={handlePasswordDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t("editProfile.changePassword.title")}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-4">
            {/* Forgot Password Link - only show if email is linked */}
            {!isCheckingEmail && userEmail && !resetEmailSent && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-muted/50 rounded-xl p-4"
              >
                <p className="text-sm text-muted-foreground mb-2">
                  {t("editProfile.changePassword.forgotPassword")}
                </p>
                <button
                  onClick={handleForgotPasswordEmail}
                  disabled={isSendingResetEmail}
                  className="text-sm text-primary hover:underline flex items-center gap-2"
                >
                  {isSendingResetEmail ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : null}
                  {t("editProfile.changePassword.sendToEmail", { email: userEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3') })}
                </button>
              </motion.div>
            )}
            
            {/* Email sent success message */}
            {resetEmailSent && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {t("editProfile.changePassword.emailSentSuccess", { email: userEmail })}
                </p>
              </motion.div>
            )}

            {/* Current Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t("editProfile.changePassword.currentPassword")}
              </label>
              <div className="relative">
                <Input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={t("editProfile.changePassword.currentPlaceholder")}
                  className="h-14 rounded-2xl border-border bg-card px-4 pr-12 text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* New Password + Confirm Password with character matching */}
            <PasswordMatchInput
              password={newPassword}
              confirmPassword={confirmPassword}
              onPasswordChange={setNewPassword}
              onConfirmPasswordChange={setConfirmPassword}
              passwordLabel={t("editProfile.changePassword.newPassword")}
              confirmLabel={t("editProfile.changePassword.confirmPassword")}
              passwordPlaceholder={t("editProfile.changePassword.newPlaceholder")}
              confirmPlaceholder={t("editProfile.changePassword.confirmPlaceholder")}
              minCharsHint={t("auth.resetPassword.minChars")}
            />

            {/* Error message */}
            <AnimatePresence>
              {passwordError && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-sm text-destructive"
                >
                  {passwordError}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <Button
              onClick={handleChangePassword}
              disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
              className="w-full h-14 text-lg font-semibold mt-4"
            >
              {isChangingPassword ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                t("editProfile.changePassword.submit")
              )}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Social Links Drawer */}
      <Drawer open={isSocialDrawerOpen} onOpenChange={handleSocialDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t("editProfile.socialLinks.title") || "Social Links"}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-4">
            {isLoadingSocial ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Smart Social Links Input */}
                <SocialLinksInput
                  links={socialLinks}
                  onChange={setSocialLinks}
                  placeholder={t("editProfile.socialLinks.placeholder") || "Paste a link..."}
                />

                {/* Description */}
                <p className="text-xs text-muted-foreground px-1">
                  {t("editProfile.socialLinks.description") || "Add your social media profiles for easier communication"}
                </p>

                {/* Submit Button */}
                <Button
                  onClick={handleSaveSocialLinks}
                  disabled={isSavingSocial}
                  className="w-full h-14 text-lg font-semibold mt-4"
                >
                  {isSavingSocial ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    t("editProfile.save")
                  )}
                </Button>
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Avatar Crop Dialog */}
      <AvatarCropDialog
        open={isCropDialogOpen}
        onOpenChange={setIsCropDialogOpen}
        imageSrc={cropImageSrc}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};

export default EditProfile;

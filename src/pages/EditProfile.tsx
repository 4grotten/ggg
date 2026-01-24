import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AvatarCropDialog } from "@/components/settings/AvatarCropDialog";
import { useAvatar } from "@/contexts/AvatarContext";
import { useAuth } from "@/contexts/AuthContext";
import { Camera, Loader2, Check, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { AnimatedDrawerItem, AnimatedDrawerContainer } from "@/components/ui/animated-drawer-item";
import { DateWheelPicker } from "@/components/ui/date-wheel-picker";

const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  date_of_birth: z.string().optional(),
  gender: z.enum(["male", "female", ""]).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const EditProfile = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { avatarUrl, setAvatarUrl } = useAvatar();
  const { user, isAuthenticated, updateAvatar, updateUserProfile, refreshUser } = useAuth();
  
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isGenderOpen, setIsGenderOpen] = useState(false);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || "",
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
    
    if (isAuthenticated && pendingFile) {
      setIsUploadingAvatar(true);
      try {
        await updateAvatar(pendingFile);
        toast.success(t("toast.avatarUpdated"));
      } catch (error) {
        console.error('Failed to upload avatar:', error);
        toast.error(t("toast.avatarUploadFailed") || "Failed to upload avatar");
      } finally {
        setIsUploadingAvatar(false);
        setPendingFile(null);
      }
    } else {
      toast.success(t("toast.avatarUpdated"));
      setPendingFile(null);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setIsSaving(true);
    try {
      await updateUserProfile({
        full_name: data.full_name,
        email: data.email || undefined,
        date_of_birth: data.date_of_birth || undefined,
        gender: data.gender || undefined,
        avatar_id: user?.avatar?.id,
      });
      toast.success(t("editProfile.saved") || "Profile updated successfully");
      navigate(-1);
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(t("editProfile.saveFailed") || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const genderOptions = [
    { value: "male", label: t("auth.profile.male") },
    { value: "female", label: t("auth.profile.female") },
    { value: "", label: t("auth.profile.gender.preferNotToSay") },
  ];

  const selectedGenderLabel = genderOptions.find(g => g.value === form.watch("gender"))?.label || t("editProfile.selectGender");

  return (
    <div className="flex flex-col min-h-screen bg-background overflow-x-hidden">
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
              <Avatar className="w-28 h-28">
                <AvatarImage src={displayAvatar} alt={user?.full_name || "User"} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                {isUploadingAvatar ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
                <Camera className="w-4 h-4 text-primary-foreground" />
              </div>
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
                    <FormLabel>{t("editProfile.fullName")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("editProfile.fullNamePlaceholder")}
                        className="h-12"
                      />
                    </FormControl>
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
                    <FormLabel>{t("editProfile.email")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder={t("editProfile.emailPlaceholder")}
                        className="h-12"
                      />
                    </FormControl>
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
                      <FormLabel>{t("editProfile.dateOfBirth")}</FormLabel>
                      <FormControl>
                        <button
                          type="button"
                          onClick={() => {
                            setTempDate(dateValue || new Date(2000, 0, 1));
                            setIsDateOpen(true);
                          }}
                          className="w-full h-12 px-3 text-left border border-input rounded-md bg-background hover:bg-muted/50 transition-colors flex items-center justify-between"
                        >
                          <span className={displayValue ? "text-foreground" : "text-muted-foreground"}>
                            {displayValue || t("editProfile.selectDateOfBirth")}
                          </span>
                        </button>
                      </FormControl>
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
                    <FormLabel>{t("editProfile.gender")}</FormLabel>
                    <FormControl>
                      <button
                        type="button"
                        onClick={() => setIsGenderOpen(true)}
                        className="w-full h-12 px-3 text-left border border-input rounded-md bg-background hover:bg-muted/50 transition-colors flex items-center justify-between"
                      >
                        <span className={field.value ? "text-foreground" : "text-muted-foreground"}>
                          {selectedGenderLabel}
                        </span>
                      </button>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
      </div>

      {/* Fixed Bottom Button - transparent glassmorphism */}
      <div className="fixed bottom-0 left-0 right-0 z-20 p-4 pb-safe">
        <Button
          onClick={form.handleSubmit(onSubmit)}
          disabled={isSaving}
          className="w-full h-14 text-lg font-semibold"
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
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

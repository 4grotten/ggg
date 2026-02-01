/**
 * ImageUploadDrawer - Upload multiple images for AI contact extraction
 */

import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle 
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Camera,
  Trash2,
  Sparkles,
  ScanLine,
  Plus
} from "lucide-react";
import { toast } from "sonner";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { useContactExtraction, ExtractedContactData } from "@/hooks/useContactExtraction";
import { cn } from "@/lib/utils";

interface ImageUploadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onExtracted: (data: ExtractedContactData) => void;
}

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
}

export const ImageUploadDrawer = ({ 
  isOpen, 
  onClose,
  onExtracted 
}: ImageUploadDrawerProps) => {
  const { t } = useTranslation();
  const { tap } = useHapticFeedback();
  const { extractFromImages, isExtracting, progress } = useContactExtraction();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(t("toast.selectImageFile"));
        return;
      }
      
      const id = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const preview = URL.createObjectURL(file);
      
      setUploadedImages(prev => [...prev, { id, file, preview }]);
    });
    
    e.target.value = '';
  };

  const handleRemoveImage = (id: string) => {
    tap();
    setUploadedImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img) {
        URL.revokeObjectURL(img.preview);
      }
      return prev.filter(i => i.id !== id);
    });
  };

  const handleExtract = async () => {
    if (uploadedImages.length === 0) {
      toast.error(t('contacts.noImagesSelected'));
      return;
    }

    tap();
    const files = uploadedImages.map(img => img.file);
    const result = await extractFromImages(files);
    
    if (result) {
      onExtracted(result);
      handleClose();
    }
  };

  const handleClose = () => {
    // Cleanup previews
    uploadedImages.forEach(img => URL.revokeObjectURL(img.preview));
    setUploadedImages([]);
    onClose();
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DrawerContent className="max-h-[95vh]">
        <DrawerHeader className="border-b border-border/50">
          <div className="flex items-center justify-between">
            <DrawerTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {t("contacts.smartScan")}
            </DrawerTitle>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DrawerHeader>

        <div className="p-4 space-y-4 overflow-y-auto max-h-[70vh]">
          {/* Instructions */}
          <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20">
            <p className="text-sm text-muted-foreground">
              {t("contacts.smartScanDescription")}
            </p>
          </div>

          {/* Upload buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { tap(); fileInputRef.current?.click(); }}
              disabled={isExtracting}
              className={cn(
                "flex flex-col items-center gap-2 p-6 rounded-2xl border-2 border-dashed transition-colors",
                "border-border hover:border-primary hover:bg-primary/5",
                isExtracting && "opacity-50 pointer-events-none"
              )}
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-blue-500" />
              </div>
              <span className="text-sm font-medium">{t("contacts.uploadImages")}</span>
            </button>

            <button
              onClick={() => { tap(); cameraInputRef.current?.click(); }}
              disabled={isExtracting}
              className={cn(
                "flex flex-col items-center gap-2 p-6 rounded-2xl border-2 border-dashed transition-colors",
                "border-border hover:border-primary hover:bg-primary/5",
                isExtracting && "opacity-50 pointer-events-none"
              )}
            >
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Camera className="w-6 h-6 text-green-500" />
              </div>
              <span className="text-sm font-medium">{t("contacts.takePhoto")}</span>
            </button>
          </div>

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Uploaded images preview */}
          {uploadedImages.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {t("contacts.uploadedImages", { count: uploadedImages.length })}
                </h3>
                <button
                  onClick={() => { tap(); fileInputRef.current?.click(); }}
                  className="flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <Plus className="w-4 h-4" />
                  {t("common.addMore")}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <AnimatePresence mode="popLayout">
                  {uploadedImages.map((img) => (
                    <motion.div
                      key={img.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="relative aspect-square rounded-xl overflow-hidden group"
                    >
                      <img
                        src={img.preview}
                        alt="Upload preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => handleRemoveImage(img.id)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Progress indicator */}
          {isExtracting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("contacts.analyzing")}</span>
                <span className="text-primary font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Extract button */}
          <Button
            onClick={handleExtract}
            disabled={uploadedImages.length === 0 || isExtracting}
            className="w-full h-14 rounded-2xl text-lg font-semibold gap-2"
          >
            {isExtracting ? (
              <>
                <ScanLine className="w-5 h-5 animate-pulse" />
                {t("contacts.extracting")}
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                {t("contacts.extractData")}
              </>
            )}
          </Button>

          {/* Supported formats hint */}
          <p className="text-xs text-center text-muted-foreground">
            {t("contacts.supportedFormats")}
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

import * as React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";

interface AvatarPreviewProps {
  src: string;
  alt?: string;
  children: React.ReactElement;
}

export function AvatarPreview({ src, alt = "", children }: AvatarPreviewProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const [hover, setHover] = React.useState(false);

  if (isMobile) {
    return (
      <>
        <div onClick={() => setOpen(true)} className="cursor-pointer">
          {children}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="p-0 border-0 bg-transparent shadow-none max-w-[90vw] w-fit [&>button]:hidden">
            <img
              src={src}
              alt={alt}
              className="w-[90vw] h-[90vw] max-w-[512px] max-h-[512px] object-cover rounded-2xl"
              onClick={() => setOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Desktop: hover preview
  return (
    <div
      className="relative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
      {hover && (
        <div className="absolute z-50 top-full right-0 mt-2 animate-in fade-in-0 zoom-in-95 duration-150">
          <img
            src={src}
            alt={alt}
            className="w-48 h-48 object-cover rounded-xl shadow-xl border border-border"
          />
        </div>
      )}
    </div>
  );
}

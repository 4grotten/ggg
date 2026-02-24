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
          <DialogContent className="p-0 border-0 bg-transparent shadow-none max-w-none w-auto flex items-center justify-center [&>button]:hidden">
            <img
              src={src}
              alt={alt}
              className="w-[80vmin] h-[80vmin] max-w-[512px] max-h-[512px] object-cover rounded-2xl"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <img
            src={src}
            alt={alt}
            className="w-64 h-64 object-cover rounded-2xl shadow-2xl border border-border animate-in fade-in-0 zoom-in-95 duration-150"
          />
        </div>
      )}
    </div>
  );
}

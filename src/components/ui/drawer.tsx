import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import { cn } from "@/lib/utils";

const DRAWER_FIXED_HEIGHT = "70vh";

const Drawer = ({ shouldScaleBackground = true, ...props }: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root shouldScaleBackground={shouldScaleBackground} {...props} />
);
Drawer.displayName = "Drawer";

const DrawerTrigger = DrawerPrimitive.Trigger;

const DrawerPortal = DrawerPrimitive.Portal;

const DrawerClose = DrawerPrimitive.Close;

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay ref={ref} className={cn("fixed inset-0 z-50 bg-black/80", className)} {...props} />
));
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;

// Swipe gesture hook for horizontal swipe to close
const useHorizontalSwipe = (onSwipeClose: () => void, threshold = 80) => {
  const startX = React.useRef<number | null>(null);
  const currentX = React.useRef<number | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    currentX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = React.useCallback((e: React.TouchEvent) => {
    if (startX.current === null) return;
    currentX.current = e.touches[0].clientX;
    
    const diff = currentX.current - startX.current;
    const container = containerRef.current;
    
    if (container && Math.abs(diff) > 10) {
      container.style.transform = `translateX(${diff * 0.3}px)`;
      container.style.opacity = `${1 - Math.abs(diff) / 300}`;
    }
  }, []);

  const handleTouchEnd = React.useCallback(() => {
    if (startX.current === null || currentX.current === null) return;
    
    const diff = currentX.current - startX.current;
    const container = containerRef.current;
    
    if (container) {
      if (Math.abs(diff) > threshold) {
        container.style.transform = `translateX(${diff > 0 ? '100%' : '-100%'})`;
        container.style.opacity = '0';
        setTimeout(onSwipeClose, 150);
      } else {
        container.style.transform = 'translateX(0)';
        container.style.opacity = '1';
      }
    }
    
    startX.current = null;
    currentX.current = null;
  }, [onSwipeClose, threshold]);

  return {
    containerRef,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
};

interface DrawerContentProps extends React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content> {
  hideHandle?: boolean;
  fixedHeight?: boolean;
}

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  DrawerContentProps
>(({ className, children, hideHandle = false, fixedHeight = true, ...props }, ref) => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  React.useEffect(() => {
    const timer = setTimeout(() => setIsOpen(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Get onOpenChange from context or props
  const handleSwipeClose = React.useCallback(() => {
    // Trigger the drawer close by dispatching escape key
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  }, []);

  const { containerRef, handlers } = useHorizontalSwipe(handleSwipeClose);

  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        ref={ref}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mt-24 flex flex-col rounded-t-[20px] border bg-background max-w-[800px] mx-auto",
          fixedHeight && `h-[${DRAWER_FIXED_HEIGHT}]`,
          className,
        )}
        style={fixedHeight ? { height: DRAWER_FIXED_HEIGHT } : undefined}
        {...props}
      >
        {!hideHandle && (
          <div className="pt-3 pb-2 flex-shrink-0">
            <div className="mx-auto h-1 w-10 rounded-full bg-muted-foreground/30" />
          </div>
        )}
        <div 
          ref={containerRef}
          className="flex-1 flex flex-col overflow-hidden transition-all duration-150 ease-out"
          style={{ willChange: 'transform, opacity' }}
          {...handlers}
        >
          {children}
        </div>
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
});
DrawerContent.displayName = "DrawerContent";

const DrawerHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("grid gap-1.5 p-4 text-center sm:text-left flex-shrink-0", className)} {...props} />
);
DrawerHeader.displayName = "DrawerHeader";

const DrawerFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mt-auto flex flex-col gap-2 p-4 flex-shrink-0", className)} {...props} />
);
DrawerFooter.displayName = "DrawerFooter";

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
DrawerTitle.displayName = DrawerPrimitive.Title.displayName;

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
DrawerDescription.displayName = DrawerPrimitive.Description.displayName;

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  DRAWER_FIXED_HEIGHT,
};

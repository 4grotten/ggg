import { useTheme } from "next-themes";
import { Toaster as Sonner, toast as sonnerToast, ExternalToast } from "sonner";
import { hapticFeedback } from "@/hooks/useHapticFeedback";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      duration={3000}
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-[0_0_15px_hsl(var(--primary)/0.3),0_4px_12px_rgba(0,0,0,0.15)] group-[.toaster]:pr-10",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton: "!static !transform-none !left-auto !top-auto !right-0 !absolute !top-1/2 !-translate-y-1/2 !mr-3 !bg-transparent !border-0 !text-muted-foreground hover:!text-foreground hover:!bg-transparent",
        },
      }}
      {...props}
    />
  );
};

// Wrapped toast with haptic feedback
const toast = Object.assign(
  (message: string | React.ReactNode, data?: ExternalToast) => sonnerToast(message, data),
  {
    success: (message: string | React.ReactNode, data?: ExternalToast) => {
      hapticFeedback.success();
      return sonnerToast.success(message, data);
    },
    error: (message: string | React.ReactNode, data?: ExternalToast) => {
      hapticFeedback.error();
      return sonnerToast.error(message, data);
    },
    warning: (message: string | React.ReactNode, data?: ExternalToast) => {
      hapticFeedback.warning();
      return sonnerToast.warning(message, data);
    },
    info: (message: string | React.ReactNode, data?: ExternalToast) => {
      hapticFeedback.tap();
      return sonnerToast.info(message, data);
    },
    loading: sonnerToast.loading,
    promise: sonnerToast.promise,
    custom: sonnerToast.custom,
    dismiss: sonnerToast.dismiss,
    message: sonnerToast.message,
  }
);

export { Toaster, toast };

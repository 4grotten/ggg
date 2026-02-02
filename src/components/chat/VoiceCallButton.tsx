import { Phone, PhoneOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useVoiceCall } from "@/contexts/VoiceCallContext";

export const VoiceCallButton = () => {
  const { isConnecting, isConnected, isSpeaking, startCall, endCall } = useVoiceCall();

  return (
    <div className="rounded-full border border-border/50 p-1">
      <AnimatePresence mode="wait">
        {isConnected ? (
          <motion.div
            key="connected"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="flex items-center gap-1.5 pl-2"
          >
            {/* Speaking indicator */}
            <motion.div
              animate={isSpeaking ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] } : {}}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className={cn(
                "w-2 h-2 rounded-full",
                isSpeaking ? "bg-green-500" : "bg-yellow-500"
              )}
            />
            
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={endCall}
              className="shrink-0 w-9 h-9 rounded-full"
            >
              <PhoneOff className="w-4 h-4" />
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="disconnected"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <motion.div
              animate={isConnecting ? { 
                scale: [1, 1.1, 1],
                boxShadow: [
                  "0 0 0 0 hsl(var(--primary) / 0.4)",
                  "0 0 0 8px hsl(var(--primary) / 0)",
                  "0 0 0 0 hsl(var(--primary) / 0)"
                ]
              } : {}}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="rounded-full"
            >
              <Button
                type="button"
                size="icon"
                onClick={() => startCall()}
                disabled={isConnecting}
                className={cn(
                  "shrink-0 w-9 h-9 rounded-full",
                  isConnecting 
                    ? "bg-primary hover:bg-primary/90" 
                    : "bg-primary hover:bg-primary/90 text-primary-foreground"
                )}
              >
                {isConnecting ? (
                  <motion.div
                    animate={{ 
                      rotate: [-10, 10, -10, 10, 0],
                      x: [-1, 1, -1, 1, 0]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 0.5,
                      ease: "easeInOut"
                    }}
                  >
                    <Phone className="w-4 h-4 text-primary-foreground" />
                  </motion.div>
                ) : (
                  <Phone className="w-4 h-4" />
                )}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

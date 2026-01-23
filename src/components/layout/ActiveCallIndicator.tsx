import { Phone, PhoneOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useVoiceCall } from "@/contexts/VoiceCallContext";

export const ActiveCallIndicator = () => {
  const { isConnected, isSpeaking, endCall } = useVoiceCall();

  if (!isConnected) return null;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0, opacity: 0, y: 20 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="bg-destructive text-destructive-foreground rounded-full px-4 py-2 shadow-lg flex items-center gap-3">
        <motion.div
          animate={isSpeaking ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] } : {}}
          transition={{ repeat: Infinity, duration: 0.8 }}
          className={cn(
            "w-2.5 h-2.5 rounded-full",
            isSpeaking ? "bg-green-400" : "bg-yellow-400"
          )}
        />
        
        <div className="flex items-center gap-1.5">
          <Phone className="w-4 h-4" />
          <span className="text-sm font-medium">
            {isSpeaking ? "Ева говорит..." : "На связи с Евой"}
          </span>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={endCall}
          className="shrink-0 w-8 h-8 rounded-full hover:bg-white/20 text-destructive-foreground"
        >
          <PhoneOff className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};

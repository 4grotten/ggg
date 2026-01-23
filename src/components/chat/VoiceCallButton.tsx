import { useState, useCallback } from "react";
import { useConversation } from "@elevenlabs/react";
import { Phone, PhoneOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ELEVENLABS_AGENT_ID = "agent_5801kfp8shb2fv48yefns7hvkh5a";

export const VoiceCallButton = () => {
  const [isConnecting, setIsConnecting] = useState(false);

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to ElevenLabs agent");
      toast.success("Звонок начат! 📞");
    },
    onDisconnect: () => {
      console.log("Disconnected from ElevenLabs agent");
      toast.info("Звонок завершён");
    },
    onError: (error) => {
      console.error("ElevenLabs error:", error);
      toast.error("Ошибка соединения. Попробуйте позже.");
    },
  });

  const startCall = useCallback(async () => {
    setIsConnecting(true);
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Connect directly with agent ID (public agent)
      await conversation.startSession({
        agentId: ELEVENLABS_AGENT_ID,
        connectionType: "websocket",
      } as any);
    } catch (error) {
      console.error("Failed to start call:", error);
      if (error instanceof Error && error.name === "NotAllowedError") {
        toast.error("Разрешите доступ к микрофону для звонка");
      } else {
        toast.error("Не удалось начать звонок");
      }
    } finally {
      setIsConnecting(false);
    }
  }, [conversation]);

  const endCall = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const isConnected = conversation.status === "connected";
  const isSpeaking = conversation.isSpeaking;

  return (
    <div className="bg-background/80 dark:bg-card/90 backdrop-blur-sm rounded-full border border-border/50 shadow-sm p-1">
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
                onClick={startCall}
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

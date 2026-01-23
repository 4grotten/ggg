import { useState, useCallback } from "react";
import { useConversation } from "@elevenlabs/react";
import { Phone, PhoneOff, Loader2 } from "lucide-react";
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
    <AnimatePresence mode="wait">
      {isConnected ? (
        <motion.div
          key="connected"
          initial={{ scale: 0.8, opacity: 0, x: 20 }}
          animate={{ scale: 1, opacity: 1, x: 0 }}
          exit={{ scale: 0.8, opacity: 0, x: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-background pr-0 pl-3 z-10"
        >
          {/* Speaking indicator */}
          <motion.div
            animate={isSpeaking ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] } : {}}
            transition={{ repeat: Infinity, duration: 0.8 }}
            className={cn(
              "w-2.5 h-2.5 rounded-full",
              isSpeaking ? "bg-green-500" : "bg-yellow-500"
            )}
          />
          
          <Button
            variant="destructive"
            size="sm"
            onClick={endCall}
            className="gap-2"
          >
            <PhoneOff className="w-4 h-4" />
            Завершить
          </Button>
        </motion.div>
      ) : (
        <motion.div
          key="disconnected"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
        >
          {isConnecting ? (
            <Button
              size="sm"
              disabled
              className="gap-2"
            >
              Вызов...
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={startCall}
              className="gap-2"
            >
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">Позвонить</span>
            </Button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

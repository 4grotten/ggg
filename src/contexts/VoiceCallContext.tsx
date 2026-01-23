import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useConversation } from "@elevenlabs/react";
import { toast } from "sonner";

const ELEVENLABS_AGENT_ID = "agent_5801kfp8shb2fv48yefns7hvkh5a";

interface VoiceCallContextType {
  isConnecting: boolean;
  isConnected: boolean;
  isSpeaking: boolean;
  startCall: () => Promise<void>;
  endCall: () => Promise<void>;
}

const VoiceCallContext = createContext<VoiceCallContextType | undefined>(undefined);

export const VoiceCallProvider = ({ children }: { children: ReactNode }) => {
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
      await navigator.mediaDevices.getUserMedia({ audio: true });
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
    <VoiceCallContext.Provider
      value={{
        isConnecting,
        isConnected,
        isSpeaking,
        startCall,
        endCall,
      }}
    >
      {children}
    </VoiceCallContext.Provider>
  );
};

export const useVoiceCall = () => {
  const context = useContext(VoiceCallContext);
  if (!context) {
    throw new Error("useVoiceCall must be used within a VoiceCallProvider");
  }
  return context;
};

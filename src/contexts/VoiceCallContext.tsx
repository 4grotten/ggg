import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useConversation } from "@elevenlabs/react";
import { toast } from "sonner";

// Agent IDs
export const AGENTS = {
  EVA: "agent_5801kfp8shb2fv48yefns7hvkh5a",      // Main chat assistant
  ANGIE: "agent_9701kfya7rw9fxhs981fh1wvky6x",   // Partner support & sales
} as const;

export type AgentType = keyof typeof AGENTS;

interface VoiceCallContextType {
  isConnecting: boolean;
  isConnected: boolean;
  isSpeaking: boolean;
  currentAgent: AgentType | null;
  startCall: (agent?: AgentType) => Promise<void>;
  endCall: () => Promise<void>;
}

const VoiceCallContext = createContext<VoiceCallContextType | undefined>(undefined);

export const VoiceCallProvider = ({ children }: { children: ReactNode }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<AgentType | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to ElevenLabs agent");
      toast.success("Звонок начат! 📞");
    },
    onDisconnect: () => {
      console.log("Disconnected from ElevenLabs agent");
      setCurrentAgent(null);
      toast.info("Звонок завершён");
    },
    onError: (error) => {
      console.error("ElevenLabs error:", error);
      toast.error("Ошибка соединения. Попробуйте позже.");
    },
  });

  const startCall = useCallback(async (agent: AgentType = "EVA") => {
    setIsConnecting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setCurrentAgent(agent);
      await conversation.startSession({
        agentId: AGENTS[agent],
        connectionType: "websocket",
      } as any);
    } catch (error) {
      console.error("Failed to start call:", error);
      setCurrentAgent(null);
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
    setCurrentAgent(null);
  }, [conversation]);

  const isConnected = conversation.status === "connected";
  const isSpeaking = conversation.isSpeaking;

  return (
    <VoiceCallContext.Provider
      value={{
        isConnecting,
        isConnected,
        isSpeaking,
        currentAgent,
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

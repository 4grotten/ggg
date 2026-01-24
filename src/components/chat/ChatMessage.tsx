import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AnimatedBotHead } from "./AnimatedBotHead";
import { useAvatar } from "@/contexts/AvatarContext";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, Volume2, VolumeX, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
}

export const ChatMessage = ({ role, content }: ChatMessageProps) => {
  const isUser = role === 'user';
  const { avatarUrl } = useAvatar();
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  
  // Priority: API avatar > local avatar
  const displayAvatar = user?.avatar?.medium || user?.avatar?.small || user?.avatar?.file || avatarUrl;
  
  const handleSpeak = async () => {
    // If already playing, stop
    if (isPlaying && audio) {
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: content }),
        }
      );

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const newAudio = new Audio(audioUrl);
      
      newAudio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      newAudio.onerror = () => {
        setIsPlaying(false);
        toast.error("Ошибка воспроизведения");
      };
      
      setAudio(newAudio);
      
      // Handle autoplay restrictions - try to play, if blocked show a message
      try {
        await newAudio.play();
        setIsPlaying(true);
      } catch (playError) {
        if (playError instanceof Error && playError.name === 'NotAllowedError') {
          // Create a user gesture handler
          const playOnInteraction = async () => {
            try {
              await newAudio.play();
              setIsPlaying(true);
            } catch {
              toast.error("Не удалось озвучить сообщение");
            }
            document.removeEventListener('click', playOnInteraction);
          };
          document.addEventListener('click', playOnInteraction, { once: true });
          toast.info("Нажмите ещё раз для воспроизведения", { duration: 2000 });
        } else {
          throw playError;
        }
      }
    } catch (error) {
      console.error("TTS error:", error);
      toast.error("Не удалось озвучить сообщение");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex gap-3 p-4",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden",
        isUser ? "bg-primary" : "bg-secondary"
      )}>
        {isUser ? (
          <Avatar className="w-8 h-8">
            <AvatarImage src={displayAvatar} alt="User" className="object-cover" />
            <AvatarFallback className="bg-primary">
              <User className="w-4 h-4 text-primary-foreground" />
            </AvatarFallback>
          </Avatar>
        ) : (
          <AnimatedBotHead />
        )}
      </div>
      
      <div className="flex flex-col gap-1 flex-1">
        <div className="flex items-end gap-2">
          <div className={cn(
            "max-w-[80%] rounded-2xl px-4 py-2",
            isUser 
              ? "bg-primary text-primary-foreground rounded-tr-sm" 
              : "bg-secondary text-secondary-foreground rounded-tl-sm"
          )}>
            <p className="text-sm whitespace-pre-wrap">{content}</p>
          </div>
          
          {/* TTS Button for assistant messages - on the right */}
          {!isUser && (
            <button
              onClick={handleSpeak}
              disabled={isLoading}
              className={cn(
                "flex-shrink-0 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
                isPlaying && "text-primary"
              )}
              title={isLoading ? "Загрузка..." : isPlaying ? "Стоп" : "Озвучить"}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isPlaying ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

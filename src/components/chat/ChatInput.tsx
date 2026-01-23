import { useState, FormEvent, useEffect, ReactNode } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VoiceCallButton } from "./VoiceCallButton";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
  onTypingChange?: (isTyping: boolean) => void;
  leftElement?: ReactNode;
}

export const ChatInput = ({ onSend, isLoading, placeholder = "Напишите сообщение...", onTypingChange, leftElement }: ChatInputProps) => {
  const [input, setInput] = useState("");

  useEffect(() => {
    onTypingChange?.(input.length > 0);
  }, [input, onTypingChange]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 bg-transparent">
      <div className="flex-1 flex items-center bg-white/50 backdrop-blur-2xl rounded-full border border-white/30 pl-2 pr-1 py-1 gap-2">
        {leftElement}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm"
        />
        <Button 
          type="submit" 
          size="icon" 
          disabled={!input.trim() || isLoading}
          className="shrink-0 w-9 h-9 rounded-full bg-primary hover:bg-primary/90"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary-foreground" />
          ) : (
            <Send className="w-4 h-4 text-primary-foreground" />
          )}
        </Button>
      </div>
      <VoiceCallButton />
    </form>
  );
};

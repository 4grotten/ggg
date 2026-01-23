import { useState, FormEvent, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
  onTypingChange?: (isTyping: boolean) => void;
}

export const ChatInput = ({ onSend, isLoading, placeholder = "Напишите сообщение...", onTypingChange }: ChatInputProps) => {
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
      <div className="flex-1 flex items-center bg-white/80 backdrop-blur-sm rounded-full border border-white/50 shadow-sm pl-4 pr-1 py-1">
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
    </form>
  );
};

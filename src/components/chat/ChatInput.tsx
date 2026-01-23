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
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t border-border bg-background">
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder}
        disabled={isLoading}
        className="flex-1"
      />
      <Button 
        type="submit" 
        size="icon" 
        disabled={!input.trim() || isLoading}
        className="shrink-0"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </Button>
    </form>
  );
};

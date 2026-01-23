import { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, ChevronLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { AnimatedBotHead } from "@/components/chat/AnimatedBotHead";
import { useAIChat } from "@/hooks/useAIChat";
import { Button } from "@/components/ui/button";

const Chat = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { messages, isLoading, error, sendMessage, clearChat } = useAIChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-[800px] mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between h-14 px-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">{t('common.back')}</span>
          </button>
          
          <h1 className="text-lg font-semibold">AI Ассистент</h1>
          
          {messages.length > 0 ? (
            <Button variant="ghost" size="icon" onClick={clearChat}>
              <Trash2 className="w-5 h-5" />
            </Button>
          ) : (
            <div className="w-10" />
          )}
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto pb-32">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary"
            >
              <AnimatedBotHead size="lg" />
            </motion.div>
            <h2 className="text-xl font-semibold mb-2">AI Ассистент</h2>
            <p className="text-muted-foreground text-sm">
              Задайте вопрос о картах, переводах, лимитах или любой другой функции приложения
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((message, index) => (
              <ChatMessage key={index} role={message.role} content={message.content} />
            ))}
          </AnimatePresence>
        )}
        
        {error && (
          <div className="px-4 py-2">
            <div className="bg-destructive/10 text-destructive text-sm rounded-lg px-4 py-2">
              {error}
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="fixed bottom-16 left-0 right-0 max-w-[800px] mx-auto bg-background border-t border-border">
        <ChatInput 
          onSend={sendMessage} 
          isLoading={isLoading} 
          placeholder={t("chat.messagePlaceholder")}
        />
      </div>
    </div>
  );
};

export default Chat;

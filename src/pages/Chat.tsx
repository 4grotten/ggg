import { useRef, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, ChevronLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { AnimatedBotHead } from "@/components/chat/AnimatedBotHead";
import { useAIChat } from "@/hooks/useAIChat";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";

// Emoji sets for different states
const EMOJI_SETS = {
  idle: ["👋", "😊", "💬", "✨", "🌟", "💫", "🤗", "😄", "🎈", "💭", "🌈", "🔮"],
  typing: ["👀", "✍️", "💬", "🤔", "📝", "💡", "⌨️", "🖊️", "✏️", "📖", "🧐", "👁️"],
  thinking: ["🤔", "💭", "✨", "🔮", "🧠", "⚡", "💫", "🌀", "🔍", "📊", "🎯", "💡"],
  dancing: ["🎉", "✨", "🥳", "💫", "🎊", "🌟", "🎈", "🎁", "🎪", "🎭", "🎵", "💃"]
};

const Chat = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { messages, isLoading, error, sendMessage, clearChat } = useAIChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [botFalling, setBotFalling] = useState(false);
  const [showBotAtInput, setShowBotAtInput] = useState(false);
  const [isDancing, setIsDancing] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [currentEmojiIndex, setCurrentEmojiIndex] = useState(0);
  const prevMessagesLengthRef = useRef(messages.length);

  // Get current emoji set based on state
  const currentEmojiSet = useMemo(() => {
    if (isDancing) return EMOJI_SETS.dancing;
    if (isLoading) return EMOJI_SETS.thinking;
    if (isUserTyping) return EMOJI_SETS.typing;
    return EMOJI_SETS.idle;
  }, [isDancing, isLoading, isUserTyping]);

  // Cycle through emojis
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentEmojiIndex(prev => (prev + 1) % currentEmojiSet.length);
    }, isDancing ? 300 : isLoading ? 400 : 600);
    
    return () => clearInterval(interval);
  }, [currentEmojiSet, isDancing, isLoading]);

  // Reset emoji index when state changes
  useEffect(() => {
    setCurrentEmojiIndex(0);
  }, [isDancing, isLoading, isUserTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Detect mobile keyboard open/close
  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        const isOpen = window.visualViewport.height < window.innerHeight * 0.75;
        setIsKeyboardOpen(isOpen);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      return () => window.visualViewport?.removeEventListener('resize', handleResize);
    }
  }, []);

  // Detect when AI response arrives and trigger dance
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (
      messages.length > prevMessagesLengthRef.current && 
      lastMessage?.role === 'assistant' &&
      showBotAtInput
    ) {
      setIsDancing(true);
      setTimeout(() => setIsDancing(false), 2000);
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages, showBotAtInput]);

  const handleSendMessage = (message: string) => {
    // Start falling animation
    setBotFalling(true);
    
    // After fall animation, show bot at input
    setTimeout(() => {
      setBotFalling(false);
      setShowBotAtInput(true);
    }, 800);

    // Send the actual message
    sendMessage(message);
  };

  // Hide bot from input when chat is cleared
  useEffect(() => {
    if (messages.length === 0) {
      setShowBotAtInput(false);
    }
  }, [messages.length]);

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
          
          <h1 className="text-lg font-semibold">{t('chat.aiAssistant')}</h1>
          
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            {messages.length > 0 && (
              <Button variant="ghost" size="icon" onClick={clearChat}>
                <Trash2 className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto pb-40">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-start pt-8 text-center px-6 relative overflow-visible">
            {/* Container for text and bot */}
            <div className="relative flex flex-col items-center">
              {/* Text first */}
              <motion.div
                animate={botFalling ? {
                  opacity: 0,
                  y: -20,
                  scale: 0.9,
                } : {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                transition={{ duration: 0.4 }}
                className="mb-6"
              >
                <h2 className="text-xl font-semibold mb-2">{t('chat.aiAssistant')}</h2>
                <p className="text-muted-foreground text-sm">
                  {t('chat.description')}
                </p>
              </motion.div>
              
              {/* Bot below text */}
              <motion.div
                animate={botFalling ? {
                  y: [0, 100, 200, 280, 300],
                  x: [0, -30, -70, -110, -120],
                  scale: [1, 0.7, 0.5, 0.38, 0.35],
                  rotate: [0, 180, 450, 680, 720],
                } : {
                  y: 0,
                  x: 0,
                  scale: 1,
                  rotate: 0,
                }}
                transition={botFalling ? {
                  duration: 1.2,
                  ease: "easeIn",
                  times: [0, 0.3, 0.6, 0.9, 1]
                } : {
                  duration: 0.3
                }}
                className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary z-10 relative"
              >
                <AnimatedBotHead size="lg" isUserTyping={isUserTyping} />
              </motion.div>
            </div>
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
      <div className="fixed bottom-24 left-0 right-0 max-w-[800px] mx-auto bg-background">
        <ChatInput 
          onSend={handleSendMessage} 
          isLoading={isLoading} 
          placeholder={t("chat.messagePlaceholder")}
          onTypingChange={setIsUserTyping}
          leftElement={
            showBotAtInput ? (
              <motion.div
                initial={{ 
                  scale: 0.3, 
                  opacity: 0,
                  y: -200,
                  rotate: -360
                }}
                animate={{ 
                  scale: [0.3, 1.2, 0.9, 1.1, 1],
                  opacity: 1,
                  y: [null, 5, -3, 2, 0],
                  rotate: 0
                }}
                transition={{ 
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  duration: 0.8
                }}
                className="relative"
              >
                <motion.div
                  animate={isDancing ? { 
                    rotate: [0, -15, 15, -15, 15, 0],
                    scale: [1, 1.15, 1, 1.15, 1],
                  } : { 
                    y: [0, -2, 0],
                    rotate: [0, -2, 2, 0],
                  }}
                  transition={isDancing ? {
                    duration: 1.5,
                    ease: "easeInOut"
                  } : {
                    y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                    rotate: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                  }}
                  className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary"
                >
                  <AnimatedBotHead size="sm" isUserTyping={isUserTyping} isDancing={isDancing} />
                </motion.div>
                {/* Speech bubble with animated emoji */}
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.3 }}
                  className="absolute -top-9 left-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground px-3 py-1.5 rounded-lg whitespace-nowrap shadow-md z-20 min-w-[40px] flex items-center justify-center"
                >
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={currentEmojiIndex + (isDancing ? 'dance' : isLoading ? 'load' : isUserTyping ? 'type' : 'idle')}
                      initial={{ 
                        scale: 0, 
                        opacity: 0, 
                        y: 10,
                        rotate: -180 
                      }}
                      animate={{ 
                        scale: [1, 1.3, 1], 
                        opacity: 1, 
                        y: 0,
                        rotate: 0 
                      }}
                      exit={{ 
                        scale: 0, 
                        opacity: 0, 
                        y: -10,
                        rotate: 180 
                      }}
                      transition={{ 
                        duration: 0.3,
                        scale: { duration: 0.4 }
                      }}
                      className="text-xl inline-block"
                    >
                      {currentEmojiSet[currentEmojiIndex]}
                    </motion.span>
                  </AnimatePresence>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-secondary rotate-45" />
                </motion.div>
              </motion.div>
            ) : undefined
          }
        />
      </div>
    </div>
  );
};

export default Chat;

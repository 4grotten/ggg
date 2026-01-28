/**
 * Smart Social Links Input
 * Auto-detects social network from pasted URL and shows appropriate icon
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Instagram, 
  Send, 
  Youtube, 
  Twitter, 
  Facebook, 
  Linkedin, 
  Github, 
  Globe, 
  Plus, 
  X as XIcon,
  Music2,
  MessageCircle,
  Gamepad2,
  Camera,
  Hash,
  Users,
  Video,
  Link2
} from "lucide-react";
import { cn } from "@/lib/utils";

// Social network detection patterns
const socialNetworks = [
  { 
    id: "instagram", 
    name: "Instagram", 
    patterns: ["instagram.com", "instagr.am"],
    icon: Instagram,
    color: "text-pink-500",
    bgColor: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400"
  },
  { 
    id: "telegram", 
    name: "Telegram", 
    patterns: ["t.me", "telegram.me", "telegram.org"],
    icon: Send,
    color: "text-blue-500",
    bgColor: "bg-blue-500"
  },
  { 
    id: "tiktok", 
    name: "TikTok", 
    patterns: ["tiktok.com", "vm.tiktok.com"],
    icon: Music2,
    color: "text-foreground",
    bgColor: "bg-gradient-to-br from-cyan-400 via-black to-pink-500"
  },
  { 
    id: "youtube", 
    name: "YouTube", 
    patterns: ["youtube.com", "youtu.be", "youtube.co"],
    icon: Youtube,
    color: "text-red-500",
    bgColor: "bg-red-500"
  },
  { 
    id: "twitter", 
    name: "X (Twitter)", 
    patterns: ["twitter.com", "x.com"],
    icon: Twitter,
    color: "text-foreground",
    bgColor: "bg-black dark:bg-white"
  },
  { 
    id: "facebook", 
    name: "Facebook", 
    patterns: ["facebook.com", "fb.com", "fb.me", "m.facebook.com"],
    icon: Facebook,
    color: "text-blue-600",
    bgColor: "bg-blue-600"
  },
  { 
    id: "linkedin", 
    name: "LinkedIn", 
    patterns: ["linkedin.com", "lnkd.in"],
    icon: Linkedin,
    color: "text-blue-700",
    bgColor: "bg-blue-700"
  },
  { 
    id: "github", 
    name: "GitHub", 
    patterns: ["github.com", "github.io"],
    icon: Github,
    color: "text-foreground",
    bgColor: "bg-gray-800 dark:bg-gray-200"
  },
  { 
    id: "whatsapp", 
    name: "WhatsApp", 
    patterns: ["wa.me", "whatsapp.com", "api.whatsapp.com"],
    icon: MessageCircle,
    color: "text-green-500",
    bgColor: "bg-green-500"
  },
  { 
    id: "snapchat", 
    name: "Snapchat", 
    patterns: ["snapchat.com", "snap.com"],
    icon: Camera,
    color: "text-yellow-400",
    bgColor: "bg-yellow-400"
  },
  { 
    id: "discord", 
    name: "Discord", 
    patterns: ["discord.gg", "discord.com", "discordapp.com"],
    icon: Gamepad2,
    color: "text-indigo-500",
    bgColor: "bg-indigo-500"
  },
  { 
    id: "twitch", 
    name: "Twitch", 
    patterns: ["twitch.tv", "twitch.com"],
    icon: Video,
    color: "text-purple-500",
    bgColor: "bg-purple-500"
  },
  { 
    id: "reddit", 
    name: "Reddit", 
    patterns: ["reddit.com", "redd.it"],
    icon: Hash,
    color: "text-orange-500",
    bgColor: "bg-orange-500"
  },
  { 
    id: "pinterest", 
    name: "Pinterest", 
    patterns: ["pinterest.com", "pin.it"],
    icon: Camera,
    color: "text-red-600",
    bgColor: "bg-red-600"
  },
  { 
    id: "vk", 
    name: "VK", 
    patterns: ["vk.com", "vk.ru"],
    icon: Users,
    color: "text-blue-500",
    bgColor: "bg-blue-500"
  },
  { 
    id: "ok", 
    name: "OK", 
    patterns: ["ok.ru", "odnoklassniki.ru"],
    icon: Users,
    color: "text-orange-500",
    bgColor: "bg-orange-500"
  },
  { 
    id: "spotify", 
    name: "Spotify", 
    patterns: ["spotify.com", "open.spotify.com"],
    icon: Music2,
    color: "text-green-500",
    bgColor: "bg-green-500"
  },
  { 
    id: "behance", 
    name: "Behance", 
    patterns: ["behance.net", "be.net"],
    icon: Camera,
    color: "text-blue-500",
    bgColor: "bg-blue-500"
  },
  { 
    id: "dribbble", 
    name: "Dribbble", 
    patterns: ["dribbble.com"],
    icon: Camera,
    color: "text-pink-400",
    bgColor: "bg-pink-400"
  },
];

// Detect social network from URL
const detectSocialNetwork = (url: string) => {
  const lowerUrl = url.toLowerCase();
  for (const network of socialNetworks) {
    for (const pattern of network.patterns) {
      if (lowerUrl.includes(pattern)) {
        return network;
      }
    }
  }
  // Return website for unknown URLs
  if (url.includes("http") || url.includes(".")) {
    return {
      id: "website",
      name: "Website",
      patterns: [],
      icon: Globe,
      color: "text-green-500",
      bgColor: "bg-green-500"
    };
  }
  return null;
};

export interface SocialLink {
  id: string;
  url: string;
  networkId: string;
  networkName: string;
  apiId?: number; // ID from API for existing links
}

interface SocialLinksInputProps {
  links: SocialLink[];
  onChange: (links: SocialLink[]) => void;
  placeholder?: string;
}

export const SocialLinksInput = ({ 
  links, 
  onChange,
  placeholder = "Paste a link..."
}: SocialLinksInputProps) => {
  const [inputValue, setInputValue] = useState("");
  const [detectedNetwork, setDetectedNetwork] = useState<typeof socialNetworks[0] | null>(null);

  // Detect network as user types or pastes
  useEffect(() => {
    if (inputValue.trim()) {
      const network = detectSocialNetwork(inputValue);
      setDetectedNetwork(network);
    } else {
      setDetectedNetwork(null);
    }
  }, [inputValue]);

  const handleAddLink = () => {
    if (!inputValue.trim() || !detectedNetwork) return;
    
    const newLink: SocialLink = {
      id: `${detectedNetwork.id}-${Date.now()}`,
      url: inputValue.trim(),
      networkId: detectedNetwork.id,
      networkName: detectedNetwork.name
    };
    
    onChange([...links, newLink]);
    setInputValue("");
    setDetectedNetwork(null);
  };

  const handleRemoveLink = (id: string) => {
    onChange(links.filter(l => l.id !== id));
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText) {
      setInputValue(pastedText);
      // Auto-add if valid link detected
      setTimeout(() => {
        const network = detectSocialNetwork(pastedText);
        if (network) {
          const newLink: SocialLink = {
            id: `${network.id}-${Date.now()}`,
            url: pastedText.trim(),
            networkId: network.id,
            networkName: network.name
          };
          onChange([...links, newLink]);
          setInputValue("");
          setDetectedNetwork(null);
        }
      }, 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && detectedNetwork) {
      e.preventDefault();
      handleAddLink();
    }
  };

  const getNetworkInfo = (networkId: string) => {
    return socialNetworks.find(n => n.id === networkId) || {
      id: "website",
      name: "Website",
      icon: Globe,
      color: "text-green-500",
      bgColor: "bg-green-500"
    };
  };

  return (
    <div className="space-y-4">
      {/* Existing links */}
      <AnimatePresence mode="popLayout">
        {links.map((link, index) => {
          const network = getNetworkInfo(link.networkId);
          const Icon = network.icon;
          
          return (
            <motion.div
              key={link.id}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: -50, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-2xl bg-muted/50 border border-border group"
            >
              {/* Network icon */}
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                network.bgColor
              )}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              
              {/* Link info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{network.name}</p>
                <p className="text-xs text-muted-foreground truncate">{link.url}</p>
              </div>
              
              {/* Remove button */}
              <button
                onClick={() => handleRemoveLink(link.id)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Input for new link */}
      <div className="relative">
        <div className="flex items-center gap-2">
          {/* Detected network icon */}
          <AnimatePresence mode="wait">
            {detectedNetwork ? (
              <motion.div
                key={detectedNetwork.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  detectedNetwork.bgColor
                )}
              >
                <detectedNetwork.icon className="w-5 h-5 text-white" />
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-muted border-2 border-dashed border-border"
              >
                <Link2 className="w-5 h-5 text-muted-foreground" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input */}
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="h-12 rounded-xl border-border bg-card px-4 text-base flex-1"
          />

          {/* Add button */}
          <AnimatePresence>
            {detectedNetwork && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                <Button
                  onClick={handleAddLink}
                  size="icon"
                  className="h-10 w-10 rounded-xl shrink-0"
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Network detection hint */}
        <AnimatePresence>
          {detectedNetwork && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-xs text-primary mt-2 px-1"
            >
              {detectedNetwork.name} detected • Press Enter or tap + to add
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Export helper to convert old format to new
export const migrateSocialLinks = (oldLinks: Record<string, string>): SocialLink[] => {
  const links: SocialLink[] = [];
  
  Object.entries(oldLinks).forEach(([key, value]) => {
    if (value && value.trim()) {
      const network = socialNetworks.find(n => n.id === key) || {
        id: "website",
        name: "Website"
      };
      links.push({
        id: `${key}-${Date.now()}-${Math.random()}`,
        url: value,
        networkId: network.id,
        networkName: network.name
      });
    }
  });
  
  return links;
};

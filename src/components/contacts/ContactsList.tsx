/**
 * ContactsList - Fantastic design for saved contacts
 */

import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Phone, 
  Mail, 
  Building2,
  ChevronRight,
  UserPlus,
  Users,
  Share2,
  Sparkles,
  Star,
  Zap,
  Crown
} from "lucide-react";
import { SavedContact } from "@/types/contact";
import { useSavedContacts } from "@/hooks/useSavedContacts";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { cn } from "@/lib/utils";
import { ShareContactDrawer } from "./ShareContactDrawer";

interface ContactsListProps {
  onContactClick: (contact: SavedContact) => void;
  onAddClick: () => void;
}

// Premium gradient colors for avatar backgrounds
const avatarGradients = [
  "from-violet-500 via-purple-500 to-fuchsia-500",
  "from-blue-500 via-cyan-400 to-teal-400",
  "from-emerald-500 via-green-400 to-lime-400",
  "from-orange-500 via-amber-400 to-yellow-400",
  "from-pink-500 via-rose-400 to-red-400",
  "from-indigo-500 via-blue-400 to-cyan-400",
  "from-fuchsia-500 via-pink-400 to-rose-400",
  "from-teal-500 via-emerald-400 to-green-400",
];

const getGradientByName = (name: string) => {
  const index = name.charCodeAt(0) % avatarGradients.length;
  return avatarGradients[index];
};

export const ContactsList = ({ onContactClick, onAddClick }: ContactsListProps) => {
  const { t } = useTranslation();
  const { contacts, isLoading } = useSavedContacts();
  const { tap } = useHapticFeedback();
  const [searchQuery, setSearchQuery] = useState("");
  const [shareContact, setShareContact] = useState<SavedContact | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const handleShareClick = (e: React.MouseEvent, contact: SavedContact) => {
    e.stopPropagation();
    tap();
    setShareContact(contact);
    setIsShareOpen(true);
  };

  // Filter contacts by search
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    
    const query = searchQuery.toLowerCase();
    return contacts.filter(contact => 
      contact.full_name.toLowerCase().includes(query) ||
      contact.phone?.toLowerCase().includes(query) ||
      contact.email?.toLowerCase().includes(query) ||
      contact.company?.toLowerCase().includes(query)
    );
  }, [contacts, searchQuery]);

  // Group contacts by first letter
  const groupedContacts = useMemo(() => {
    const groups: Record<string, SavedContact[]> = {};
    
    filteredContacts.forEach(contact => {
      const firstLetter = contact.full_name.charAt(0).toUpperCase();
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(contact);
    });

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredContacts]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-pink-500 rounded-full blur-xl opacity-50 animate-pulse" />
          <div className="relative w-20 h-20 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <Sparkles className="w-8 h-8 text-primary" />
          </motion.div>
        </div>
        <p className="text-muted-foreground animate-pulse font-medium">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Header - Premium glassmorphism */}
      <motion.div
        initial={{ opacity: 0, y: -30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="relative overflow-hidden rounded-3xl"
      >
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-600 to-pink-600 animate-gradient-x" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent" />
        
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [-20, -60, -20],
                x: [0, 10, 0],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.3,
              }}
              className="absolute w-2 h-2 rounded-full bg-white/40"
              style={{
                left: `${15 + i * 15}%`,
                bottom: `${10 + i * 5}%`,
              }}
            />
          ))}
        </div>
        
        {/* Decorative glow orbs */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/20 -translate-y-1/2 translate-x-1/3 blur-2xl" 
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 5, repeat: Infinity, delay: 1 }}
          className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-white/15 translate-y-1/2 -translate-x-1/3 blur-2xl" 
        />
        
        <div className="relative z-10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Crown className="w-5 h-5 text-yellow-300" />
                </motion.div>
                <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">Premium</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-1 drop-shadow-lg">
                {t("contacts.viewContacts")}
              </h2>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-white/80 text-sm font-medium">
                  {contacts.length} {contacts.length === 1 ? "контакт" : "контактов"}
                </p>
              </div>
            </div>
            
            {/* Stacked avatars with glow */}
            <div className="flex -space-x-4">
              {contacts.slice(0, 4).map((contact, i) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, scale: 0, x: 30 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{ delay: i * 0.1, type: "spring", stiffness: 300 }}
                  className="relative"
                >
                  <div className={cn(
                    "absolute inset-0 rounded-full blur-md opacity-60 bg-gradient-to-br",
                    getGradientByName(contact.full_name)
                  )} />
                  <Avatar className="relative w-12 h-12 ring-3 ring-white/40 shadow-xl">
                    <AvatarImage src={contact.avatar_url || undefined} className="object-cover" />
                    <AvatarFallback className={cn(
                      "text-xs font-bold text-white bg-gradient-to-br shadow-inner",
                      getGradientByName(contact.full_name)
                    )}>
                      {getInitials(contact.full_name)}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
              ))}
              {contacts.length > 4 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="relative w-12 h-12 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center ring-3 ring-white/40 shadow-xl"
                >
                  <span className="text-sm font-bold text-white">+{contacts.length - 4}</span>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Add contact button - Animated premium style */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, type: "spring" }}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={onAddClick}
        className="w-full relative overflow-hidden group rounded-2xl shadow-lg"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 group-hover:from-emerald-400 group-hover:via-teal-400 group-hover:to-cyan-400 transition-all duration-500" />
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
        />
        <div className="relative flex items-center justify-between py-5 px-5">
          <div className="flex items-center gap-4">
            <motion.div 
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="w-14 h-14 rounded-2xl bg-white/25 backdrop-blur-sm flex items-center justify-center shadow-lg ring-1 ring-white/30"
            >
              <UserPlus className="w-7 h-7 text-white drop-shadow" />
            </motion.div>
            <div className="text-left">
              <span className="text-white font-bold text-lg drop-shadow">{t("contacts.addContact")}</span>
              <p className="text-white/80 text-sm font-medium">{t("settings.scanBusinessCardDescription")}</p>
            </div>
          </div>
          <motion.div
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ChevronRight className="w-6 h-6 text-white/90" />
          </motion.div>
        </div>
      </motion.button>

      {/* Search - Premium glassmorphism */}
      {contacts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 rounded-2xl blur-xl" />
          <div className="relative bg-background/90 backdrop-blur-2xl rounded-2xl border border-border/50 shadow-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-purple-500/5" />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/70" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t("contacts.search")}
              className="pl-12 h-14 rounded-2xl bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base relative z-10"
            />
            {searchQuery && (
              <motion.button
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors z-10"
              >
                <span className="text-xs font-bold text-primary">✕</span>
              </motion.button>
            )}
          </div>
        </motion.div>
      )}

      {/* Empty state - Premium */}
      {contacts.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16"
        >
          <div className="relative inline-block mb-8">
            <motion.div 
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute inset-0 bg-gradient-to-br from-primary/30 via-purple-500/20 to-pink-500/20 rounded-full blur-3xl scale-150" 
            />
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="relative w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-muted via-muted/80 to-muted/50 flex items-center justify-center shadow-2xl ring-4 ring-primary/10"
            >
              <Users className="w-14 h-14 text-muted-foreground/80" />
            </motion.div>
            <motion.div
              animate={{ 
                scale: [1, 1.3, 1],
                rotate: [0, 15, -15, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 via-orange-400 to-red-400 flex items-center justify-center shadow-xl ring-2 ring-white/50"
            >
              <Star className="w-5 h-5 text-white" />
            </motion.div>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
              className="absolute -bottom-1 -left-1 w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg"
            >
              <Zap className="w-3 h-3 text-white" />
            </motion.div>
          </div>
          <h3 className="text-xl font-bold mb-3">{t("contacts.noContacts")}</h3>
          <p className="text-muted-foreground text-sm max-w-[220px] mx-auto leading-relaxed">
            Добавьте первый контакт, чтобы быстро отправлять переводы
          </p>
        </motion.div>
      )}

      {/* No search results */}
      {contacts.length > 0 && filteredContacts.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <motion.div 
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center shadow-xl"
          >
            <Search className="w-10 h-10 text-muted-foreground/70" />
          </motion.div>
          <p className="text-muted-foreground font-medium">{t("contacts.noSearchResults")}</p>
          <button
            onClick={() => setSearchQuery("")}
            className="mt-4 px-6 py-2 rounded-full bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors"
          >
            Очистить поиск
          </button>
        </motion.div>
      )}

      {/* Contacts list - Premium cards */}
      <AnimatePresence mode="popLayout">
        {groupedContacts.map(([letter, groupContacts], groupIndex) => (
          <motion.div
            key={letter}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ delay: groupIndex * 0.08, type: "spring", stiffness: 200 }}
            className="space-y-3"
          >
            {/* Letter header - Floating badge */}
            <div className="flex items-center gap-3 mb-4 px-1">
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 via-primary/15 to-purple-500/10 flex items-center justify-center shadow-lg ring-1 ring-primary/20"
              >
                <span className="text-sm font-bold bg-gradient-to-br from-primary to-purple-600 bg-clip-text text-transparent">{letter}</span>
              </motion.div>
              <div className="flex-1 h-px bg-gradient-to-r from-border via-border/50 to-transparent" />
              <span className="text-xs text-muted-foreground font-medium">{groupContacts.length}</span>
            </div>

            {/* Contacts in group */}
            <div className="space-y-3">
              {groupContacts.map((contact, index) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, type: "spring" }}
                  className="group"
                >
                  <div className="flex items-center gap-3">
                    {/* Contact card - Premium glassmorphism */}
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onContactClick(contact)}
                      className="flex-1 relative overflow-hidden rounded-2xl text-left"
                    >
                      {/* Card background with glass effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-muted/80 via-muted/60 to-muted/40 backdrop-blur-xl" />
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="absolute inset-0 ring-1 ring-inset ring-border/50 group-hover:ring-primary/30 rounded-2xl transition-all duration-300" />
                      
                      {/* Shimmer effect on hover */}
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                      />
                      
                      <div className="relative flex items-center gap-4 p-4">
                        {/* Avatar with animated glow */}
                        <div className="relative">
                          <motion.div 
                            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
                            transition={{ duration: 3, repeat: Infinity, delay: index * 0.2 }}
                            className={cn(
                              "absolute inset-0 rounded-full blur-lg bg-gradient-to-br",
                              getGradientByName(contact.full_name)
                            )} 
                          />
                          <Avatar className="relative w-14 h-14 ring-2 ring-white/50 shadow-xl">
                            <AvatarImage src={contact.avatar_url || undefined} className="object-cover" />
                            <AvatarFallback className={cn(
                              "text-sm font-bold text-white bg-gradient-to-br shadow-inner",
                              getGradientByName(contact.full_name)
                            )}>
                              {getInitials(contact.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          {/* Online indicator */}
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-400 ring-2 ring-background flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-emerald-200 animate-pulse" />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-foreground truncate text-base group-hover:text-primary transition-colors">
                            {contact.full_name}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            {contact.company && (
                              <span className="flex items-center gap-1.5 truncate bg-muted/50 px-2 py-0.5 rounded-full">
                                <Building2 className="w-3 h-3" />
                                <span className="truncate">{contact.company}</span>
                              </span>
                            )}
                            {!contact.company && contact.phone && (
                              <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded-full">
                                <Phone className="w-3 h-3" />
                                {contact.phone}
                              </span>
                            )}
                            {!contact.company && !contact.phone && contact.email && (
                              <span className="flex items-center gap-1.5 truncate bg-muted/50 px-2 py-0.5 rounded-full">
                                <Mail className="w-3 h-3" />
                                <span className="truncate">{contact.email}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <motion.div
                          animate={{ x: [0, 4, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="opacity-50 group-hover:opacity-100 transition-opacity"
                        >
                          <ChevronRight className="w-5 h-5 text-primary" />
                        </motion.div>
                      </div>
                    </motion.button>

                    {/* Share button - Floating style with glow */}
                    <motion.button
                      whileHover={{ scale: 1.15, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => handleShareClick(e, contact)}
                      className="relative p-4 rounded-xl overflow-hidden group/share"
                      title={t("common.share")}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/10 to-purple-500/10 group-hover/share:from-primary/25 group-hover/share:to-purple-500/20 transition-all" />
                      <div className="absolute inset-0 ring-1 ring-inset ring-primary/20 group-hover/share:ring-primary/40 rounded-xl transition-all" />
                      <Share2 className="relative w-5 h-5 text-primary group-hover/share:scale-110 transition-transform" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Share Contact Drawer */}
      <ShareContactDrawer
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        contact={shareContact}
      />
    </div>
  );
};

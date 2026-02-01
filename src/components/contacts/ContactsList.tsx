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
  Star
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

// Gradient colors for avatar backgrounds
const avatarGradients = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-orange-500 to-red-500",
  "from-pink-500 to-rose-500",
  "from-amber-500 to-yellow-500",
  "from-indigo-500 to-blue-600",
  "from-fuchsia-500 to-pink-600",
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
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-primary animate-pulse" />
        </div>
        <p className="text-muted-foreground animate-pulse">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-6 shadow-2xl"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2 blur-xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/10 translate-y-1/2 -translate-x-1/2 blur-xl" />
        <div className="absolute top-1/2 right-1/4 w-3 h-3 rounded-full bg-white/40 animate-pulse" />
        <div className="absolute top-1/4 right-1/3 w-2 h-2 rounded-full bg-white/30 animate-pulse delay-75" />
        
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {t("contacts.viewContacts")}
            </h2>
            <p className="text-white/70 text-sm">
              {contacts.length} {contacts.length === 1 ? "контакт" : "контактов"}
            </p>
          </div>
          <div className="flex -space-x-3">
            {contacts.slice(0, 4).map((contact, i) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, scale: 0.5, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Avatar className="w-10 h-10 ring-2 ring-white/30 shadow-lg">
                  <AvatarImage src={contact.avatar_url || undefined} />
                  <AvatarFallback className={cn(
                    "text-xs font-bold text-white bg-gradient-to-br",
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
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/30"
              >
                <span className="text-xs font-bold text-white">+{contacts.length - 4}</span>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Search - Glassmorphism style */}
      {contacts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl blur-xl" />
          <div className="relative bg-background/80 backdrop-blur-xl rounded-2xl border border-border/50 shadow-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t("contacts.search")}
              className="pl-12 h-14 rounded-2xl bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
            />
            {searchQuery && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                <button
                  onClick={() => setSearchQuery("")}
                  className="p-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                >
                  <span className="text-xs font-medium text-muted-foreground">✕</span>
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {/* Add contact button - Premium style */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onAddClick}
        className="w-full relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl opacity-90 group-hover:opacity-100 transition-opacity" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
        <div className="relative flex items-center justify-between py-4 px-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <span className="text-white font-semibold text-lg">{t("contacts.addContact")}</span>
              <p className="text-white/70 text-sm">{t("settings.scanBusinessCardDescription")}</p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-white/80" />
        </div>
      </motion.button>

      {/* Empty state */}
      {contacts.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-2xl scale-150" />
            <div className="relative w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
              <Users className="w-12 h-12 text-muted-foreground" />
            </div>
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg"
            >
              <Star className="w-4 h-4 text-white" />
            </motion.div>
          </div>
          <h3 className="text-lg font-semibold mb-2">{t("contacts.noContacts")}</h3>
          <p className="text-muted-foreground text-sm max-w-[200px] mx-auto">
            Добавьте первый контакт, чтобы быстро отправлять переводы
          </p>
        </motion.div>
      )}

      {/* No search results */}
      {contacts.length > 0 && filteredContacts.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">{t("contacts.noSearchResults")}</p>
          <button
            onClick={() => setSearchQuery("")}
            className="mt-3 text-primary text-sm font-medium hover:underline"
          >
            Очистить поиск
          </button>
        </motion.div>
      )}

      {/* Contacts list */}
      <AnimatePresence mode="popLayout">
        {groupedContacts.map(([letter, groupContacts], groupIndex) => (
          <motion.div
            key={letter}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: groupIndex * 0.05 }}
          >
            {/* Letter header - Stylish badge */}
            <div className="flex items-center gap-3 mb-3 px-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">{letter}</span>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
            </div>

            {/* Contacts in group */}
            <div className="space-y-2">
              {groupContacts.map((contact, index) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="group"
                >
                  <div className="flex items-center gap-2">
                    {/* Contact card */}
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => onContactClick(contact)}
                      className="flex-1 flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 hover:from-muted/70 hover:to-muted/50 transition-all duration-300 text-left border border-transparent hover:border-border/50 shadow-sm hover:shadow-md"
                    >
                      {/* Avatar with glow effect */}
                      <div className="relative">
                        <div className={cn(
                          "absolute inset-0 rounded-full blur-md opacity-0 group-hover:opacity-50 transition-opacity bg-gradient-to-br",
                          getGradientByName(contact.full_name)
                        )} />
                        <Avatar className="relative w-14 h-14 ring-2 ring-background shadow-lg">
                          <AvatarImage src={contact.avatar_url || undefined} className="object-cover" />
                          <AvatarFallback className={cn(
                            "text-sm font-bold text-white bg-gradient-to-br",
                            getGradientByName(contact.full_name)
                          )}>
                            {getInitials(contact.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        {/* Online indicator - decorative */}
                        {index % 3 === 0 && (
                          <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-background" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate text-base">
                          {contact.full_name}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                          {contact.company && (
                            <span className="flex items-center gap-1.5 truncate">
                              <Building2 className="w-3.5 h-3.5" />
                              {contact.company}
                            </span>
                          )}
                          {!contact.company && contact.phone && (
                            <span className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5" />
                              {contact.phone}
                            </span>
                          )}
                          {!contact.company && !contact.phone && contact.email && (
                            <span className="flex items-center gap-1.5 truncate">
                              <Mail className="w-3.5 h-3.5" />
                              {contact.email}
                            </span>
                          )}
                        </div>
                        {/* Payment methods badge */}
                        {contact.payment_methods && contact.payment_methods.length > 0 && (
                          <div className="flex items-center gap-1 mt-2">
                            <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                              💳 {contact.payment_methods.length} {contact.payment_methods.length === 1 ? "способ" : "способов"}
                            </div>
                          </div>
                        )}
                      </div>

                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                    </motion.button>

                    {/* Share button - Floating style */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => handleShareClick(e, contact)}
                      className="p-3.5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 border border-primary/20 transition-all shadow-sm"
                      title={t("common.share")}
                    >
                      <Share2 className="w-5 h-5 text-primary" />
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

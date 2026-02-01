/**
 * ContactsList - Displays saved contacts with search and actions
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
  Share2
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
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      {contacts.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t("contacts.search")}
            className="pl-10 h-12 rounded-xl"
          />
        </div>
      )}

      {/* Add contact button */}
      <button
        onClick={onAddClick}
        className="w-full flex items-center justify-between py-4 px-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors"
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl text-white flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' }}
          >
            <UserPlus className="w-5 h-5" />
          </div>
          <span className="text-foreground font-medium">{t("contacts.addContact")}</span>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </button>

      {/* Empty state */}
      {contacts.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">{t("contacts.noContacts")}</p>
        </div>
      )}

      {/* No search results */}
      {contacts.length > 0 && filteredContacts.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">{t("contacts.noSearchResults")}</p>
        </div>
      )}

      {/* Contacts list */}
      <AnimatePresence mode="popLayout">
        {groupedContacts.map(([letter, groupContacts]) => (
          <motion.div
            key={letter}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Letter header */}
            <div className="px-2 py-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase">
                {letter}
              </span>
            </div>

            {/* Contacts in group */}
            <div className="space-y-1">
              {groupContacts.map((contact, index) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-center gap-2"
                >
                  <button
                    onClick={() => onContactClick(contact)}
                    className="flex-1 flex items-center gap-3 p-3 rounded-2xl hover:bg-muted/50 transition-colors text-left"
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={contact.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-sm font-medium">
                        {getInitials(contact.full_name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {contact.full_name}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {contact.company && (
                          <span className="flex items-center gap-1 truncate">
                            <Building2 className="w-3 h-3" />
                            {contact.company}
                          </span>
                        )}
                        {!contact.company && contact.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {contact.phone}
                          </span>
                        )}
                        {!contact.company && !contact.phone && contact.email && (
                          <span className="flex items-center gap-1 truncate">
                            <Mail className="w-3 h-3" />
                            {contact.email}
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </button>

                  {/* Share button */}
                  <button
                    onClick={(e) => handleShareClick(e, contact)}
                    className="p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                    title={t("common.share")}
                  >
                    <Share2 className="w-5 h-5 text-muted-foreground" />
                  </button>
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

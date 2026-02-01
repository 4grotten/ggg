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
  Users
} from "lucide-react";
import { SavedContact } from "@/types/contact";
import { useSavedContacts } from "@/hooks/useSavedContacts";
import { cn } from "@/lib/utils";

interface ContactsListProps {
  onContactClick: (contact: SavedContact) => void;
  onAddClick: () => void;
}

export const ContactsList = ({ onContactClick, onAddClick }: ContactsListProps) => {
  const { t } = useTranslation();
  const { contacts, isLoading } = useSavedContacts();
  const [searchQuery, setSearchQuery] = useState("");

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
        className="w-full flex items-center gap-3 p-4 bg-primary/10 rounded-2xl hover:bg-primary/20 transition-colors"
      >
        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
          <UserPlus className="w-6 h-6 text-primary-foreground" />
        </div>
        <span className="font-medium text-primary">{t("contacts.addContact")}</span>
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
                <motion.button
                  key={contact.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => onContactClick(contact)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-muted/50 transition-colors text-left"
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
                </motion.button>
              ))}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

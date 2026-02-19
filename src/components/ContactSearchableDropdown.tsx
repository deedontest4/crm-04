import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ContactForDropdown {
  id: string;
  contact_name: string;
  company_name?: string | null;
  email?: string | null;
  phone_no?: string | null;
  position?: string | null;
  region?: string | null;
  linkedin?: string | null;
}

interface ContactSearchableDropdownProps {
  value?: string;
  onValueChange: (value: string) => void;
  onContactSelect: (contact: ContactForDropdown) => void;
  placeholder?: string;
  className?: string;
}

export const ContactSearchableDropdown = ({
  value,
  onValueChange,
  onContactSelect,
  placeholder = "Select contact...",
  className
}: ContactSearchableDropdownProps) => {
  const [open, setOpen] = useState(false);
  const [contacts, setContacts] = useState<ContactForDropdown[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contacts')
        .select('id, contact_name, company_name, email, phone_no, position, region, linkedin')
        .order('contact_name', { ascending: true });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      toast({
        title: "Error",
        description: "Failed to fetch contacts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = useMemo(() => {
    if (!searchValue) return contacts;
    const searchLower = searchValue.toLowerCase();
    return contacts.filter(c =>
      c.contact_name?.toLowerCase().includes(searchLower) ||
      c.company_name?.toLowerCase().includes(searchLower) ||
      c.email?.toLowerCase().includes(searchLower) ||
      c.position?.toLowerCase().includes(searchLower)
    );
  }, [contacts, searchValue]);

  const selectedContact = contacts.find(c => c.contact_name === value);

  const handleSelect = (contact: ContactForDropdown) => {
    onValueChange(contact.contact_name);
    onContactSelect(contact);
    setOpen(false);
    setSearchValue("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {value ? (
            <span className="truncate">
              {selectedContact?.contact_name || value}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search contacts..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">Loading contacts...</span>
              </div>
            ) : (
              <>
                <CommandEmpty>No contacts found.</CommandEmpty>
                <CommandGroup>
                  {filteredContacts.map((contact) => (
                    <CommandItem
                      key={contact.id}
                      value={contact.contact_name}
                      onSelect={() => handleSelect(contact)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === contact.contact_name ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{contact.contact_name}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {contact.position && <span>{contact.position}</span>}
                          {contact.position && contact.company_name && <span> · </span>}
                          {contact.company_name && <span>{contact.company_name}</span>}
                          {contact.email && (
                            <span className="ml-1 text-xs opacity-70"> ({contact.email})</span>
                          )}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

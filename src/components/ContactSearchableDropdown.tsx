import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Contact {
  id: string;
  contact_name: string;
  company_name?: string | null;
  position?: string | null;
  email?: string | null;
  phone_no?: string | null;
  region?: string | null;
  contact_owner?: string | null;
  contact_source?: string | null;
  industry?: string | null;
  linkedin?: string | null;
  website?: string | null;
}

interface ContactSearchableDropdownProps {
  value?: string;
  onValueChange: (value: string) => void;
  onContactSelect?: (contact: Contact) => void;
  placeholder?: string;
  className?: string;
}

export const ContactSearchableDropdown = ({
  value,
  onValueChange,
  onContactSelect,
  placeholder = "Select contact...",
  className,
}: ContactSearchableDropdownProps) => {
  const [open, setOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const fetchAllContacts = async () => {
      try {
        setLoading(true);
        const allContacts: Contact[] = [];
        let from = 0;
        const BATCH = 1000;

        while (true) {
          const { data, error } = await supabase
            .from("contacts")
            .select("id, contact_name, company_name, position, email, phone_no, region, contact_owner, contact_source, industry, linkedin, website")
            .order("contact_name", { ascending: true })
            .range(from, from + BATCH - 1);

          if (error) throw error;
          if (!data || data.length === 0) break;

          allContacts.push(...data);
          if (data.length < BATCH) break;
          from += BATCH;
        }

        setContacts(allContacts);
      } catch (error) {
        console.error("Error fetching contacts:", error);
        toast({ title: "Error", description: "Failed to fetch contacts", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchAllContacts();
  }, [toast]);

  const filteredContacts = useMemo(() => {
    if (!searchValue) return contacts.slice(0, 100); // Show first 100 when no search
    const s = searchValue.toLowerCase();
    return contacts.filter(
      (c) =>
        c.contact_name?.toLowerCase().includes(s) ||
        c.company_name?.toLowerCase().includes(s) ||
        c.position?.toLowerCase().includes(s) ||
        c.email?.toLowerCase().includes(s)
    ).slice(0, 100); // Limit results for performance
  }, [contacts, searchValue]);

  const handleSelect = (contact: Contact) => {
    onValueChange(contact.contact_name);
    onContactSelect?.(contact);
    setOpen(false);
    setSearchValue("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", className)}
        >
          {value ? (
            <span className="truncate">{value}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <div className="flex items-center gap-1 ml-2 shrink-0">
            {value && (
              <X className="h-3 w-3 opacity-50 hover:opacity-100" onClick={handleClear} />
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
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
                          "mr-2 h-4 w-4 shrink-0",
                          value === contact.contact_name ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{contact.contact_name}</div>
                        {(contact.company_name || contact.position) && (
                          <div className="text-xs text-muted-foreground truncate">
                            {[contact.company_name, contact.position].filter(Boolean).join(" • ")}
                          </div>
                        )}
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

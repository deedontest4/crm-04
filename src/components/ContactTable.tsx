import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCRUDAudit } from "@/hooks/useCRUDAudit";
import { Card } from "@/components/ui/card";
import { ContactTableBody } from "./contact-table/ContactTableBody";
import { ContactModal } from "./ContactModal";
import { ContactColumnCustomizer, ContactColumnConfig } from "./ContactColumnCustomizer";
import { StandardPagination } from "./shared/StandardPagination";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Contact {
  id: string;
  contact_name: string;
  company_name?: string;
  position?: string;
  email?: string;
  phone_no?: string;
  mobile_no?: string;
  region?: string;
  city?: string;
  state?: string;
  contact_owner?: string;
  created_time?: string;
  modified_time?: string;
  lead_status?: string;
  industry?: string;
  contact_source?: string;
  linkedin?: string;
  website?: string;
  description?: string;
  annual_revenue?: number;
  no_of_employees?: number;
  created_by?: string;
  modified_by?: string;
}

const defaultColumns: ContactColumnConfig[] = [
  { field: 'contact_name', label: 'Contact Name', visible: true, order: 0 },
  { field: 'company_name', label: 'Company Name', visible: true, order: 1 },
  { field: 'position', label: 'Position', visible: true, order: 2 },
  { field: 'email', label: 'Email', visible: true, order: 3 },
  { field: 'phone_no', label: 'Phone', visible: true, order: 4 },
  { field: 'region', label: 'Region', visible: true, order: 5 },
  { field: 'contact_owner', label: 'Contact Owner', visible: true, order: 6 },
  { field: 'industry', label: 'Industry', visible: true, order: 7 },
  { field: 'contact_source', label: 'Source', visible: true, order: 8 },
];

interface ContactTableProps {
  showColumnCustomizer: boolean;
  setShowColumnCustomizer: (show: boolean) => void;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  selectedContacts: string[];
  setSelectedContacts: React.Dispatch<React.SetStateAction<string[]>>;
  refreshTrigger?: number;
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
}

export const ContactTable = ({ 
  showColumnCustomizer, 
  setShowColumnCustomizer, 
  showModal, 
  setShowModal,
  selectedContacts,
  setSelectedContacts,
  refreshTrigger,
  searchTerm = "",
  setSearchTerm
}: ContactTableProps) => {
  const { toast } = useToast();
  const { logDelete } = useCRUDAudit();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [internalSearchTerm, setInternalSearchTerm] = useState("");
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);
  const [columns, setColumns] = useState(defaultColumns);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Use external or internal search term
  const effectiveSearchTerm = searchTerm !== undefined ? searchTerm : internalSearchTerm;

  const fetchContacts = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_time', { ascending: false });

      if (error) {
        console.error('ContactTable: Supabase error:', error);
        throw error;
      }
      
      setContacts(data || []);
      
    } catch (error) {
      console.error('ContactTable: Error fetching contacts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch contacts. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchContacts();
    }
  }, [refreshTrigger]);

  useEffect(() => {
    let filtered = contacts.filter(contact =>
      contact.contact_name?.toLowerCase().includes(effectiveSearchTerm.toLowerCase()) ||
      contact.company_name?.toLowerCase().includes(effectiveSearchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(effectiveSearchTerm.toLowerCase())
    );

    if (sortField) {
      filtered.sort((a, b) => {
        const aValue = a[sortField as keyof Contact] || '';
        const bValue = b[sortField as keyof Contact] || '';
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
          return sortDirection === 'asc' ? comparison : -comparison;
        }
        
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        const comparison = aStr.localeCompare(bStr);
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    setFilteredContacts(filtered);
    setCurrentPage(1);
  }, [contacts, effectiveSearchTerm, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const contactToDelete = contacts.find(c => c.id === id);
      
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await logDelete('contacts', id, contactToDelete);

      toast({
        title: "Success",
        description: "Contact deleted successfully",
      });
      
      fetchContacts();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete contact",
        variant: "destructive",
      });
    }
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setShowModal(true);
  };

  const visibleColumns = columns.filter(col => col.visible);
  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pageContacts = filteredContacts.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Table Content */}
      <div className="flex-1 min-h-0 overflow-auto px-6 pt-4">
        <Card>
          <ContactTableBody
            loading={loading}
            pageContacts={pageContacts}
            visibleColumns={visibleColumns}
            selectedContacts={selectedContacts}
            setSelectedContacts={setSelectedContacts}
            onEdit={handleEditContact}
            onDelete={(id) => {
              setContactToDelete(id);
              setShowDeleteDialog(true);
            }}
            searchTerm={effectiveSearchTerm}
            onRefresh={fetchContacts}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        </Card>
      </div>

      {/* Always show pagination */}
      <StandardPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredContacts.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        entityName="contacts"
      />

      {/* Modals */}
      <ContactModal
        open={showModal}
        onOpenChange={setShowModal}
        contact={editingContact}
        onSuccess={() => {
          fetchContacts();
          setEditingContact(null);
        }}
      />

      <ContactColumnCustomizer
        open={showColumnCustomizer}
        onOpenChange={setShowColumnCustomizer}
        columns={columns}
        onColumnsChange={setColumns}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the contact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (contactToDelete) {
                  handleDelete(contactToDelete);
                  setContactToDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

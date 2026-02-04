import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCRUDAudit } from "@/hooks/useCRUDAudit";
import { useUserDisplayNames } from "@/hooks/useUserDisplayNames";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown, RefreshCw, ListTodo } from "lucide-react";
import { LeadModal } from "./LeadModal";
import { LeadColumnCustomizer, LeadColumnConfig } from "./LeadColumnCustomizer";
import { ConvertToDealModal } from "./ConvertToDealModal";
import { LeadActionItemsModal } from "./LeadActionItemsModal";
import { LeadDeleteConfirmDialog } from "./LeadDeleteConfirmDialog";
import { StandardPagination } from "./shared/StandardPagination";

interface Lead {
  id: string;
  lead_name: string;
  company_name?: string;
  position?: string;
  email?: string;
  phone_no?: string;
  country?: string;
  contact_owner?: string;
  created_time?: string;
  modified_time?: string;
  lead_status?: string;
  industry?: string;
  contact_source?: string;
  linkedin?: string;
  website?: string;
  description?: string;
  created_by?: string;
  modified_by?: string;
}

const defaultColumns: LeadColumnConfig[] = [
  { field: 'lead_name', label: 'Lead Name', visible: true, order: 0 },
  { field: 'company_name', label: 'Company Name', visible: true, order: 1 },
  { field: 'position', label: 'Position', visible: true, order: 2 },
  { field: 'email', label: 'Email', visible: true, order: 3 },
  { field: 'phone_no', label: 'Phone', visible: true, order: 4 },
  { field: 'country', label: 'Region', visible: true, order: 5 },
  { field: 'contact_owner', label: 'Lead Owner', visible: true, order: 6 },
  { field: 'lead_status', label: 'Lead Status', visible: true, order: 7 },
  { field: 'industry', label: 'Industry', visible: true, order: 8 },
  { field: 'contact_source', label: 'Source', visible: true, order: 9 },
];

interface LeadTableProps {
  showColumnCustomizer: boolean;
  setShowColumnCustomizer: (show: boolean) => void;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  selectedLeads: string[];
  setSelectedLeads: React.Dispatch<React.SetStateAction<string[]>>;
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
  statusFilter?: string;
  setStatusFilter?: (status: string) => void;
  highlightId?: string | null;
  clearHighlight?: () => void;
}

const LeadTable = ({
  showColumnCustomizer,
  setShowColumnCustomizer,
  showModal,
  setShowModal,
  selectedLeads,
  setSelectedLeads,
  searchTerm = "",
  setSearchTerm,
  statusFilter = "New",
  setStatusFilter,
  highlightId,
  clearHighlight
}: LeadTableProps) => {
  const { toast } = useToast();
  const { logDelete } = useCRUDAudit();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [internalSearchTerm, setInternalSearchTerm] = useState("");
  const [internalStatusFilter, setInternalStatusFilter] = useState("New");
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [columns, setColumns] = useState(defaultColumns);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showActionItemsModal, setShowActionItemsModal] = useState(false);
  const [selectedLeadForActions, setSelectedLeadForActions] = useState<Lead | null>(null);
  const [highlightProcessed, setHighlightProcessed] = useState(false);

  // Use external or internal values
  const effectiveSearchTerm = searchTerm !== undefined ? searchTerm : internalSearchTerm;
  const effectiveStatusFilter = statusFilter !== undefined ? statusFilter : internalStatusFilter;

  useEffect(() => {
    fetchLeads();
  }, []);

  // Handle highlight from notification click
  useEffect(() => {
    if (highlightId && leads.length > 0 && !loading && !highlightProcessed) {
      const lead = leads.find(l => l.id === highlightId);
      if (lead) {
        setEditingLead(lead);
        setShowModal(true);
      } else {
        toast({
          title: "Lead not found",
          description: "The lead you're looking for may have been deleted.",
        });
      }
      clearHighlight?.();
      setHighlightProcessed(true);
    }
  }, [highlightId, leads, loading, highlightProcessed, clearHighlight, setShowModal, toast]);

  // Reset processed state when highlightId changes
  useEffect(() => {
    if (highlightId) {
      setHighlightProcessed(false);
    }
  }, [highlightId]);

  useEffect(() => {
    let filtered = leads.filter(lead => 
      lead.lead_name?.toLowerCase().includes(effectiveSearchTerm.toLowerCase()) || 
      lead.company_name?.toLowerCase().includes(effectiveSearchTerm.toLowerCase()) || 
      lead.email?.toLowerCase().includes(effectiveSearchTerm.toLowerCase())
    );
    
    if (effectiveStatusFilter !== "all") {
      filtered = filtered.filter(lead => lead.lead_status === effectiveStatusFilter);
    }

    if (sortField) {
      filtered.sort((a, b) => {
        const aValue = a[sortField as keyof Lead] || '';
        const bValue = b[sortField as keyof Lead] || '';
        const comparison = aValue.toString().localeCompare(bValue.toString());
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    setFilteredLeads(filtered);
    setCurrentPage(1);
  }, [leads, effectiveSearchTerm, effectiveStatusFilter, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-muted-foreground/40" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-3 h-3 text-foreground" /> 
      : <ArrowDown className="w-3 h-3 text-foreground" />;
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('leads').select('*').order('created_time', { ascending: false });
      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch leads",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (deleteLinkedRecords: boolean = true) => {
    if (!leadToDelete || !leadToDelete.id) {
      toast({
        title: "Error",
        description: "No lead selected for deletion",
        variant: "destructive"
      });
      return;
    }
    
    try {
      if (deleteLinkedRecords) {
        await supabase.from('notifications').delete().eq('lead_id', leadToDelete.id);
        const { data: actionItems } = await supabase.from('lead_action_items').select('id').eq('lead_id', leadToDelete.id);
        if (actionItems && actionItems.length > 0) {
          const actionItemIds = actionItems.map(item => item.id);
          await supabase.from('notifications').delete().in('action_item_id', actionItemIds);
        }
        await supabase.from('lead_action_items').delete().eq('lead_id', leadToDelete.id);
      }

      const { error } = await supabase.from('leads').delete().eq('id', leadToDelete.id);
      if (error) throw error;

      await logDelete('leads', leadToDelete.id, leadToDelete);
      toast({
        title: "Success",
        description: "Lead deleted successfully"
      });
      fetchLeads();
      setLeadToDelete(null);
      setShowDeleteDialog(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete lead",
        variant: "destructive"
      });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pageLeads = getCurrentPageLeads().slice(0, 50);
      setSelectedLeads(pageLeads.map(l => l.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleSelectLead = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads(prev => [...prev, leadId]);
    } else {
      setSelectedLeads(prev => prev.filter(id => id !== leadId));
    }
  };

  const getCurrentPageLeads = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLeads.slice(startIndex, startIndex + itemsPerPage);
  };

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);

  const createdByIds = useMemo(() => {
    return [...new Set(leads.map(l => l.created_by).filter(Boolean))];
  }, [leads]);

  const { displayNames } = useUserDisplayNames(createdByIds);
  const visibleColumns = columns.filter(col => col.visible);
  const pageLeads = getCurrentPageLeads();

  const handleConvertToDeal = (lead: Lead) => {
    setLeadToConvert(lead);
    setShowConvertModal(true);
  };

  const handleConvertSuccess = async () => {
    if (leadToConvert) {
      try {
        const { error } = await supabase.from('leads').update({ lead_status: 'Converted' }).eq('id', leadToConvert.id);
        if (!error) {
          setLeads(prevLeads => prevLeads.map(lead => 
            lead.id === leadToConvert.id ? { ...lead, lead_status: 'Converted' } : lead
          ));
        }
      } catch (error) {
        console.error("Error updating lead status:", error);
      }
    }
    fetchLeads();
    setLeadToConvert(null);
  };

  const handleActionItems = (lead: Lead) => {
    setSelectedLeadForActions(lead);
    setShowActionItemsModal(true);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Table Content */}
      <div className="flex-1 min-h-0 overflow-auto px-6 pt-4">
        <Card>
          <div className="overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10">
                <TableRow className="bg-muted/50 hover:bg-muted/60 border-b-2">
                  <TableHead className="w-12 text-center font-bold text-foreground bg-muted/50">
                    <div className="flex justify-center">
                      <Checkbox 
                        checked={selectedLeads.length > 0 && selectedLeads.length === Math.min(pageLeads.length, 50)} 
                        onCheckedChange={handleSelectAll} 
                      />
                    </div>
                  </TableHead>
                  {visibleColumns.map(column => (
                    <TableHead key={column.field} className="text-left font-bold text-foreground bg-muted/50 px-4 py-3 whitespace-nowrap">
                      <div 
                        className="flex items-center gap-2 cursor-pointer hover:text-primary" 
                        onClick={() => handleSort(column.field)}
                      >
                        {column.label}
                        {getSortIcon(column.field)}
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="text-center font-bold text-foreground bg-muted/50 w-48 px-4 py-3">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={visibleColumns.length + 2} className="text-center py-8">
                      Loading leads...
                    </TableCell>
                  </TableRow>
                ) : pageLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={visibleColumns.length + 2} className="text-center py-8">
                      No leads found
                    </TableCell>
                  </TableRow>
                ) : (
                  pageLeads.map(lead => (
                    <TableRow key={lead.id} className="hover:bg-muted/20 border-b">
                      <TableCell className="text-center px-4 py-3">
                        <div className="flex justify-center">
                          <Checkbox 
                            checked={selectedLeads.includes(lead.id)} 
                            onCheckedChange={checked => handleSelectLead(lead.id, checked as boolean)} 
                          />
                        </div>
                      </TableCell>
                      {visibleColumns.map(column => (
                        <TableCell key={column.field} className="text-left px-4 py-3 align-middle whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                          {column.field === 'lead_name' ? (
                            <button 
                              onClick={() => { setEditingLead(lead); setShowModal(true); }} 
                              className="text-primary hover:underline font-medium text-left truncate block w-full"
                            >
                              {lead[column.field as keyof Lead] || '-'}
                            </button>
                          ) : column.field === 'contact_owner' ? (
                            <span className="truncate block">
                              {lead.created_by ? displayNames[lead.created_by] || "Loading..." : '-'}
                            </span>
                          ) : column.field === 'lead_status' && lead.lead_status ? (
                            <Badge 
                              variant={lead.lead_status === 'New' ? 'secondary' : lead.lead_status === 'Contacted' ? 'default' : 'outline'}
                              className="whitespace-nowrap"
                            >
                              {lead.lead_status}
                            </Badge>
                          ) : (
                            <span className="truncate block" title={lead[column.field as keyof Lead]?.toString() || '-'}>
                              {lead[column.field as keyof Lead] || '-'}
                            </span>
                          )}
                        </TableCell>
                      ))}
                      <TableCell className="w-48 px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => { setEditingLead(lead); setShowModal(true); }} 
                            title="Edit lead" 
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => { setLeadToDelete(lead); setShowDeleteDialog(true); }} 
                            title="Delete lead" 
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleConvertToDeal(lead)} 
                            disabled={lead.lead_status === 'Converted'} 
                            title="Convert to deal" 
                            className="h-8 w-8 p-0"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleActionItems(lead)} 
                            title="Action items" 
                            className="h-8 w-8 p-0"
                          >
                            <ListTodo className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Always show pagination */}
      <StandardPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredLeads.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        entityName="leads"
      />

      {/* Modals */}
      <LeadModal 
        open={showModal} 
        onOpenChange={(open) => { setShowModal(open); if (!open) setEditingLead(null); }} 
        lead={editingLead} 
        onSuccess={fetchLeads} 
      />

      <LeadColumnCustomizer 
        open={showColumnCustomizer} 
        onOpenChange={setShowColumnCustomizer} 
        columns={columns} 
        onColumnsChange={setColumns} 
      />

      <ConvertToDealModal 
        open={showConvertModal} 
        onOpenChange={setShowConvertModal} 
        lead={leadToConvert} 
        onSuccess={handleConvertSuccess} 
      />

      <LeadActionItemsModal 
        open={showActionItemsModal} 
        onOpenChange={setShowActionItemsModal} 
        lead={selectedLeadForActions} 
      />

      <LeadDeleteConfirmDialog 
        open={showDeleteDialog} 
        onConfirm={handleDelete} 
        onCancel={() => { setShowDeleteDialog(false); setLeadToDelete(null); }} 
        isMultiple={false} 
      />
    </div>
  );
};

export default LeadTable;

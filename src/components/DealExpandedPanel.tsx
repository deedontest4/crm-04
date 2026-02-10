import { useState, useMemo } from "react";
import { X, Plus, Clock, History, ListTodo, ChevronDown, ChevronRight, Eye, Pencil, ArrowRight, RefreshCw, Check, ArrowUpDown, MessageSquarePlus, Phone, Mail, Calendar, FileText, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Deal } from "@/types/deal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
  import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useUserDisplayNames } from "@/hooks/useUserDisplayNames";
import { useAuth } from "@/hooks/useAuth";

interface DealExpandedPanelProps {
  deal: Deal;
  onClose: () => void;
   onOpenActionItemModal?: (actionItem?: any) => void;
}

 interface AuditLog {
   id: string;
   action: string;
   details: Record<string, unknown> | null;
   created_at: string;
   user_id: string | null;
 }
 
 interface ActionItem {
   id: string;
   title: string;
   status: string;
   priority: string;
   due_date: string | null;
   assigned_to: string | null;
   created_at: string;
   module_type: string;
   module_id: string | null;
 }
 
// Log types with icons
const LOG_TYPES = [
  { value: 'Note', label: 'Note', icon: FileText },
  { value: 'Call', label: 'Call', icon: Phone },
  { value: 'Meeting', label: 'Meeting', icon: Calendar },
  { value: 'Email', label: 'Email', icon: Mail },
] as const;

type LogType = typeof LOG_TYPES[number]['value'];

// Format date/time for table display: HH:mm dd-MM-yy
const formatHistoryDateTime = (date: Date): string => {
  return format(date, 'HH:mm dd-MM-yy');
};

// Format a value for display
const formatValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
   }
  return String(value);
};

// Parse field_changes from audit log details
interface FieldChange {
  field: string;
  oldValue: string;
  newValue: string;
}

const parseFieldChanges = (details: Record<string, unknown> | null): FieldChange[] => {
  if (!details) return [];
  
  const fieldChanges = details.field_changes as Record<string, { old: unknown; new: unknown }> | undefined;
  if (fieldChanges && typeof fieldChanges === 'object') {
    return Object.entries(fieldChanges)
      .filter(([key]) => !['modified_at', 'modified_by', 'id'].includes(key))
      .map(([field, change]) => ({
        field: field.replace(/_/g, ' '),
        oldValue: formatValue(change?.old),
        newValue: formatValue(change?.new),
      }));
  }
  
  // Fallback: parse updated_fields or old_data if field_changes not available
  const oldData = details.old_data as Record<string, unknown> | undefined;
  const updatedFields = details.updated_fields as Record<string, unknown> | undefined;
  
  if (updatedFields && oldData) {
    return Object.keys(updatedFields)
      .filter(key => !['modified_at', 'modified_by', 'id'].includes(key))
      .map(field => ({
        field: field.replace(/_/g, ' '),
        oldValue: formatValue(oldData[field]),
        newValue: formatValue(updatedFields[field]),
      }));
  }
  
  // Final fallback: just show the details keys
  return Object.entries(details)
    .filter(([key]) => !['modified_at', 'modified_by', 'id', 'field_changes', 'old_data', 'updated_fields'].includes(key))
    .map(([field, value]) => ({
      field: field.replace(/_/g, ' '),
      oldValue: '-',
      newValue: formatValue(value),
    }));
};

// Parse audit log details to show human-readable summary
const parseChangeSummary = (action: string, details: Record<string, unknown> | null): string => {
  if (!details || typeof details !== 'object') return action === 'create' ? 'Created deal' : action;
  
  const changes = parseFieldChanges(details);
  if (changes.length === 0) return action === 'create' ? 'Created deal' : 'Updated';
  
  // For stage changes, show old → new
  const stageChange = changes.find(c => c.field === 'stage');
  if (stageChange) {
    return `${stageChange.oldValue} → ${stageChange.newValue}`;
  }
  
  // Show first change with arrow
  const first = changes[0];
  if (changes.length === 1) {
    return `${first.field}: ${first.oldValue} → ${first.newValue}`;
  }
  return `${first.field} +${changes.length - 1}`;
 };
 
 export const DealExpandedPanel = ({ deal, onClose, onOpenActionItemModal }: DealExpandedPanelProps) => {
  const { user } = useAuth();
  const [historyOpen, setHistoryOpen] = useState(true);
  const [actionsOpen, setActionsOpen] = useState(true);
   const [detailLogId, setDetailLogId] = useState<string | null>(null);
   const [actionSortBy, setActionSortBy] = useState<'due_date' | 'priority'>('due_date');
   const queryClient = useQueryClient();
   
   // Add Log dialog state
   const [addLogOpen, setAddLogOpen] = useState(false);
   const [logType, setLogType] = useState<LogType>('Note');
   const [logMessage, setLogMessage] = useState('');
   const [isSavingLog, setIsSavingLog] = useState(false);

  // Fetch audit logs for the deal
   const { data: auditLogs = [], isLoading: logsLoading } = useQuery({
     queryKey: ['deal-audit-logs', deal.id],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('security_audit_log')
         .select('*')
         .eq('resource_type', 'deals')
         .eq('resource_id', deal.id)
         .order('created_at', { ascending: false })
         .limit(50);
       
       if (error) {
         console.error('Error fetching deal audit logs:', error);
         return [];
       }
       
       return (data || []) as AuditLog[];
     },
     enabled: !!deal.id,
   });
 
   // Fetch action items from unified action_items table
   const { data: actionItems = [], isLoading: itemsLoading } = useQuery({
     queryKey: ['deal-action-items-unified', deal.id],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('action_items')
         .select('*')
         .eq('module_type', 'deals')
         .eq('module_id', deal.id)
         .order('due_date', { ascending: true, nullsFirst: false });
       
       if (error) {
         console.error('Error fetching deal action items:', error);
         return [];
       }
       
       return (data || []) as ActionItem[];
     },
     enabled: !!deal.id,
   });
 
  // Extract unique user IDs from audit logs and action items
  const userIds = useMemo(() => {
    const logUserIds = auditLogs.map(log => log.user_id).filter((id): id is string => !!id);
    const actionUserIds = actionItems.map(item => item.assigned_to).filter((id): id is string => !!id);
    const ids = [...logUserIds, ...actionUserIds];
    return [...new Set(ids)];
  }, [auditLogs, actionItems]);
 
  // Fetch display names for users
  const { displayNames } = useUserDisplayNames(userIds);
 
   const isLoading = logsLoading || itemsLoading;

   // Refresh history logs
   const handleRefreshHistory = () => {
     queryClient.invalidateQueries({ queryKey: ['deal-audit-logs', deal.id] });
   };
   
   // Handle adding a manual log entry
   const handleAddLog = async () => {
     if (!logMessage.trim() || !user) return;
     
     setIsSavingLog(true);
     try {
       const { error } = await supabase
         .from('security_audit_log')
         .insert({
           action: logType.toUpperCase(),
           resource_type: 'deals',
           resource_id: deal.id,
           user_id: user.id,
           details: {
             message: logMessage.trim(),
             log_type: logType,
             manual_entry: true,
           }
         });
       
       if (error) throw error;
       
       // Refresh history
       queryClient.invalidateQueries({ queryKey: ['deal-audit-logs', deal.id] });
       
       // Reset form
       setLogMessage('');
       setLogType('Note');
       setAddLogOpen(false);
     } catch (error) {
       console.error('Error adding log:', error);
     } finally {
       setIsSavingLog(false);
     }
   };

   // Toggle sort for action items
   const toggleActionSort = () => {
     setActionSortBy(prev => prev === 'due_date' ? 'priority' : 'due_date');
   };

   // Sort action items
   const sortedActionItems = useMemo(() => {
     return [...actionItems].sort((a, b) => {
       if (actionSortBy === 'due_date') {
         if (!a.due_date && !b.due_date) return 0;
         if (!a.due_date) return 1;
         if (!b.due_date) return -1;
         return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
       } else {
         const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
         return (priorityOrder[a.priority as keyof typeof priorityOrder] || 2) - 
                (priorityOrder[b.priority as keyof typeof priorityOrder] || 2);
       }
     });
   }, [actionItems, actionSortBy]);
 
   const handleAddActionClick = (e: React.MouseEvent) => {
     e.stopPropagation();
     if (onOpenActionItemModal) {
       onOpenActionItemModal();
    }
  };

   const handleActionItemClick = (actionItem: ActionItem) => {
     if (onOpenActionItemModal) {
       onOpenActionItemModal(actionItem);
    }
  };

   const selectedLog = detailLogId ? auditLogs.find(l => l.id === detailLogId) : null;

  return (
     <>
      <div 
         className="h-full w-full bg-card border border-border/50 rounded-lg shadow-lg flex flex-col overflow-hidden"
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      >
         {/* Header - Simple title only */}
         <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 bg-muted/30 flex-shrink-0">
           <span className="text-sm font-medium text-muted-foreground">Details</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
             className="h-6 w-6 p-0 hover:bg-muted"
          >
             <X className="h-4 w-4" />
          </Button>
        </div>

         {/* Content */}
         <div className="flex-1 min-h-0 flex flex-col overflow-hidden gap-1">
           {/* History Section - Collapsible with flex-1 for equal height */}
           <Collapsible open={historyOpen} onOpenChange={setHistoryOpen} className={`flex flex-col ${historyOpen ? 'flex-1' : ''} min-h-0`}>
             <CollapsibleTrigger asChild>
              <button className="w-full flex items-center gap-1.5 px-3 py-2 bg-muted/20 hover:bg-muted/40 transition-colors border-b border-border/20 group">
                 {historyOpen ? (
                   <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                 ) : (
                   <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                 )}
                 <History className="h-3.5 w-3.5 text-muted-foreground" />
                 <span className="text-xs font-medium text-foreground">History</span>
                 <span className="text-xs text-muted-foreground ml-1">({auditLogs.length})</span>
                 <Button
                   variant="ghost"
                   size="sm"
                   className="ml-auto h-5 px-1.5 text-[10px] gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                   onClick={(e) => {
                     e.stopPropagation();
                     setAddLogOpen(true);
                   }}
                 >
                   <MessageSquarePlus className="h-3 w-3" />
                   Add Log
                 </Button>
                 <Button
                   variant="ghost"
                   size="sm"
                   className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                   onClick={(e) => {
                     e.stopPropagation();
                     handleRefreshHistory();
                   }}
                 >
                   <RefreshCw className={`h-3 w-3 text-muted-foreground ${logsLoading ? 'animate-spin' : ''}`} />
                 </Button>
               </button>
             </CollapsibleTrigger>
            <CollapsibleContent className="flex-1 min-h-0 collapsible-content data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
              <div className="h-full overflow-hidden">
                 <ScrollArea className="h-full">
                   {isLoading ? (
                     <div className="flex items-center justify-center py-6">
                       <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                     </div>
                   ) : auditLogs.length === 0 ? (
                     <div className="flex items-center justify-center py-6 text-muted-foreground">
                       <History className="h-4 w-4 mr-2" />
                       <span className="text-xs">No history yet</span>
                     </div>
                   ) : (
                     <Table>
                       <TableHeader>
                         <TableRow className="text-[11px]">
                            <TableHead className="h-7 px-2 text-[11px] w-28">Time</TableHead>
                            <TableHead className="h-7 px-2 text-[11px] w-16">Type</TableHead>
                            <TableHead className="h-7 px-2 text-[11px] w-20">By</TableHead>
                            <TableHead className="h-7 px-2 text-[11px]">Changes</TableHead>
                            <TableHead className="h-7 px-2 text-[11px] w-8"></TableHead>
                         </TableRow>
                       </TableHeader>
                       <TableBody>
                         {auditLogs.map((log) => (
                           <TableRow key={log.id} className="text-xs hover:bg-muted/30">
                             <TableCell className="py-1.5 px-2 text-[10px] text-muted-foreground whitespace-nowrap">
                               {formatHistoryDateTime(new Date(log.created_at))}
                             </TableCell>
                             <TableCell className="py-1.5 px-2">
                               <div className="flex items-center gap-1">
                                 {log.action === 'NOTE' || log.action === 'CALL' || log.action === 'MEETING' || log.action === 'EMAIL' ? (
                                   <>
                                     {log.action === 'CALL' && <Phone className="h-3 w-3 text-blue-500" />}
                                     {log.action === 'MEETING' && <Calendar className="h-3 w-3 text-purple-500" />}
                                     {log.action === 'EMAIL' && <Mail className="h-3 w-3 text-green-500" />}
                                     {log.action === 'NOTE' && <FileText className="h-3 w-3 text-yellow-500" />}
                                   </>
                                 ) : (
                                   <Clock className="h-3 w-3 text-muted-foreground" />
                                 )}
                                 <span className="capitalize text-[10px]">{log.action.toLowerCase()}</span>
                               </div>
                             </TableCell>
                              <TableCell className="py-1.5 px-2 text-muted-foreground max-w-[80px] truncate text-[10px]">
                                {log.user_id ? (displayNames[log.user_id] || '...') : '-'}
                              </TableCell>
                             <TableCell className="py-1.5 px-2 max-w-[150px] truncate text-muted-foreground text-[10px]">
                                {(log.details as any)?.message || parseChangeSummary(log.action, log.details)}
                             </TableCell>
                             <TableCell className="py-1.5 px-2">
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 className="h-5 w-5 p-0"
                                 onClick={() => setDetailLogId(log.id)}
                               >
                                 <Eye className="h-3 w-3" />
                               </Button>
                             </TableCell>
                           </TableRow>
                         ))}
                       </TableBody>
                     </Table>
                   )}
                 </ScrollArea>
               </div>
             </CollapsibleContent>
           </Collapsible>
 
           {/* Action Items Section - Collapsible with flex-1 for equal height */}
           <Collapsible open={actionsOpen} onOpenChange={setActionsOpen} className={`flex flex-col ${actionsOpen ? 'flex-1' : ''} min-h-0`}>
             <CollapsibleTrigger asChild>
              <button className="w-full flex items-center gap-1.5 px-3 py-2 bg-muted/20 hover:bg-muted/40 transition-colors border-b border-border/20 group">
                 {actionsOpen ? (
                   <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                 ) : (
                   <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                 )}
                 <ListTodo className="h-3.5 w-3.5 text-muted-foreground" />
                 <span className="text-xs font-medium text-foreground">Action Items</span>
                 <span className="text-xs text-muted-foreground ml-1">({actionItems.length})</span>
                 <Button
                   variant="ghost"
                   size="sm"
                   className="ml-auto h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                   onClick={(e) => {
                     e.stopPropagation();
                     toggleActionSort();
                   }}
                   title={`Sort by ${actionSortBy === 'due_date' ? 'priority' : 'due date'}`}
                 >
                   <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                 </Button>
                 <span
                   role="button"
                   tabIndex={0}
                   onClick={handleAddActionClick}
                   onKeyDown={(e) => {
                     if (e.key === "Enter" || e.key === " ") {
                       e.preventDefault();
                       handleAddActionClick(e as unknown as React.MouseEvent);
                     }
                   }}
                   className="ml-auto inline-flex h-5 w-5 items-center justify-center rounded hover:bg-muted"
                   aria-label="Add action item"
                 >
                   <Plus className="h-3 w-3 text-muted-foreground" />
                 </span>
               </button>
             </CollapsibleTrigger>
            <CollapsibleContent className="flex-1 min-h-0 collapsible-content data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
              <div className="h-full overflow-hidden">
                 <ScrollArea className="h-full">
                   {isLoading ? (
                     <div className="flex items-center justify-center py-6">
                       <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                     </div>
                   ) : actionItems.length === 0 ? (
                     <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                       <ListTodo className="h-4 w-4 mb-1" />
                       <span className="text-xs">No action items</span>
                       <Button
                         variant="link"
                         size="sm"
                         className="text-xs h-6 mt-1"
                         onClick={() => onOpenActionItemModal?.()}
                       >
                         Add one
                       </Button>
                     </div>
                   ) : (
                     <Table>
                       <TableHeader>
                         <TableRow className="text-[11px]">
                           <TableHead className="h-7 px-2 text-[11px]">Title</TableHead>
                           <TableHead className="h-7 px-2 text-[11px] w-20">Assigned</TableHead>
                           <TableHead className="h-7 px-2 text-[11px] w-14">Status</TableHead>
                           <TableHead className="h-7 px-2 text-[11px] w-14">Priority</TableHead>
                           <TableHead className="h-7 px-2 text-[11px] w-16">Due</TableHead>
                           <TableHead className="h-7 px-2 text-[11px] w-10"></TableHead>
                         </TableRow>
                       </TableHeader>
                       <TableBody>
                         {sortedActionItems.map((item) => (
                           <TableRow 
                             key={item.id} 
                             className="text-xs cursor-pointer hover:bg-muted/30"
                             onClick={() => handleActionItemClick(item)}
                           >
                             <TableCell className="py-1.5 px-2 max-w-[120px]">
                               <TooltipProvider>
                                 <Tooltip>
                                   <TooltipTrigger asChild>
                                     <span className="truncate block">{item.title}</span>
                                   </TooltipTrigger>
                                   <TooltipContent>
                                     <p className="max-w-[200px]">{item.title}</p>
                                   </TooltipContent>
                                 </Tooltip>
                               </TooltipProvider>
                             </TableCell>
                             <TableCell className="py-1.5 px-2 text-[10px] text-muted-foreground max-w-[80px] truncate">
                               {item.assigned_to ? (
                                 <span className="flex items-center gap-1">
                                   <User className="h-2.5 w-2.5" />
                                   {displayNames[item.assigned_to] || '...'}
                                 </span>
                               ) : (
                                 <span className="text-muted-foreground/50">Unassigned</span>
                               )}
                             </TableCell>
                             <TableCell className="py-1.5 px-2">
                               <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                 item.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                 item.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' :
                                 'bg-blue-100 text-blue-700'
                               }`}>
                                 {item.status}
                               </span>
                             </TableCell>
                             <TableCell className="py-1.5 px-2">
                               <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                 item.priority === 'High' ? 'bg-red-100 text-red-700' :
                                 item.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                 'bg-gray-100 text-gray-700'
                               }`}>
                                 {item.priority}
                               </span>
                             </TableCell>
                             <TableCell className="py-1.5 px-2 text-[10px] text-muted-foreground">
                               {item.due_date ? format(new Date(item.due_date), 'dd-MM-yy') : '-'}
                             </TableCell>
                             <TableCell className="py-1.5 px-2">
                               <Pencil className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                             </TableCell>
                           </TableRow>
                         ))}
                       </TableBody>
                     </Table>
                   )}
                 </ScrollArea>
               </div>
             </CollapsibleContent>
           </Collapsible>
         </div>
       </div>
 
       {/* Detail Log Dialog - With proper field changes table */}
       <Dialog open={!!detailLogId} onOpenChange={() => setDetailLogId(null)}>
        <DialogContent className="max-w-lg">
           <DialogHeader>
             <DialogTitle className="text-sm">History Details</DialogTitle>
           </DialogHeader>
          {selectedLog && (() => {
            const changes = parseFieldChanges(selectedLog.details);
            const updaterName = selectedLog.user_id ? (displayNames[selectedLog.user_id] || 'Unknown') : '-';
            
            return (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-muted-foreground text-xs">Action</span>
                    <p className="capitalize font-medium">{selectedLog.action}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Updated By</span>
                    <p className="font-medium">{updaterName}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground text-xs">Time</span>
                    <p>{format(new Date(selectedLog.created_at), 'PPpp')}</p>
                  </div>
                </div>
                
                {changes.length > 0 && (
                  <div>
                    <span className="text-muted-foreground text-xs block mb-2">Field Changes</span>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="h-8 px-3 text-xs font-medium">Field</TableHead>
                            <TableHead className="h-8 px-3 text-xs font-medium">Old Value</TableHead>
                            <TableHead className="h-8 px-3 text-xs font-medium w-6"></TableHead>
                            <TableHead className="h-8 px-3 text-xs font-medium">New Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {changes.map((change, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="py-2 px-3 text-xs font-medium capitalize">
                                {change.field}
                              </TableCell>
                              <TableCell className="py-2 px-3 text-xs text-muted-foreground max-w-[100px] truncate">
                                {change.oldValue}
                              </TableCell>
                              <TableCell className="py-2 px-3">
                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              </TableCell>
                              <TableCell className="py-2 px-3 text-xs font-medium max-w-[100px] truncate">
                                {change.newValue}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
                
                {changes.length === 0 && selectedLog.action === 'create' && (
                  <p className="text-muted-foreground text-xs italic">Deal was created</p>
                )}
              </div>
            );
          })()}
         </DialogContent>
       </Dialog>
       
       {/* Add Log Dialog */}
       <Dialog open={addLogOpen} onOpenChange={setAddLogOpen}>
         <DialogContent className="max-w-md">
           <DialogHeader>
             <DialogTitle className="text-sm flex items-center gap-2">
               <MessageSquarePlus className="h-4 w-4" />
               Add Log Entry
             </DialogTitle>
           </DialogHeader>
           <div className="space-y-4">
             <div className="space-y-2">
               <Label className="text-xs">Log Type</Label>
               <Select value={logType} onValueChange={(v) => setLogType(v as LogType)}>
                 <SelectTrigger className="h-9">
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   {LOG_TYPES.map((type) => (
                     <SelectItem key={type.value} value={type.value}>
                       <div className="flex items-center gap-2">
                         <type.icon className="h-3.5 w-3.5" />
                         {type.label}
                       </div>
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
             <div className="space-y-2">
               <Label className="text-xs">Description</Label>
               <Textarea
                 value={logMessage}
                 onChange={(e) => setLogMessage(e.target.value)}
                 placeholder="Enter log details..."
                 className="min-h-[100px] text-sm"
               />
             </div>
             <div className="flex justify-end gap-2">
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => setAddLogOpen(false)}
               >
                 Cancel
               </Button>
               <Button
                 size="sm"
                 onClick={handleAddLog}
                 disabled={!logMessage.trim() || isSavingLog}
               >
                 {isSavingLog ? 'Saving...' : 'Add Log'}
               </Button>
             </div>
           </div>
         </DialogContent>
       </Dialog>
     </>
  );
};

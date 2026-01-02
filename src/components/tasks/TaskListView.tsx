import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { Task, TaskStatus, TaskModuleType } from '@/types/task';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Edit,
  Trash2,
  Search,
  User,
  Building2,
  Briefcase,
  Users,
  Calendar,
  FileText,
  AlertCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  ListTodo,
} from 'lucide-react';
import { useUserDisplayNames } from '@/hooks/useUserDisplayNames';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { TaskDetailModal } from './TaskDetailModal';
import { RowActionsDropdown } from '@/components/RowActionsDropdown';
import { HighlightedText } from '@/components/shared/HighlightedText';
import { ClearFiltersButton } from '@/components/shared/ClearFiltersButton';

interface TaskListViewProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onToggleComplete: (task: Task) => void;
  initialStatusFilter?: string;
  initialOwnerFilter?: string;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const priorityColors = {
  high: 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  medium: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800/30 dark:text-slate-400 border-slate-200 dark:border-slate-700',
};

const statusColors = {
  open: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  in_progress: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  cancelled: 'bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400 border-gray-200 dark:border-gray-700',
};

const moduleIcons: Record<TaskModuleType, React.ElementType> = {
  accounts: Building2,
  contacts: User,
  leads: Users,
  meetings: Calendar,
  deals: Briefcase,
};

export const TaskListView = ({
  tasks,
  onEdit,
  onDelete,
  onStatusChange,
  onToggleComplete,
  initialStatusFilter = 'all',
  initialOwnerFilter = 'all',
}: TaskListViewProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assignedToFilter, setAssignedToFilter] = useState<string>(initialOwnerFilter);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Sync statusFilter when initialStatusFilter prop changes (from URL)
  useEffect(() => {
    setStatusFilter(initialStatusFilter);
  }, [initialStatusFilter]);

  // Sync assignedToFilter when initialOwnerFilter prop changes (from URL)
  useEffect(() => {
    setAssignedToFilter(initialOwnerFilter);
  }, [initialOwnerFilter]);

  const assignedToIds = [...new Set(tasks.map(t => t.assigned_to).filter(Boolean))] as string[];
  const createdByIds = [...new Set(tasks.map(t => t.created_by).filter(Boolean))] as string[];
  const allUserIds = [...new Set([...assignedToIds, ...createdByIds])];
  const { displayNames } = useUserDisplayNames(allUserIds);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      const matchesAssignedTo = assignedToFilter === 'all' || task.assigned_to === assignedToFilter;
      return matchesSearch && matchesStatus && matchesPriority && matchesAssignedTo;
    });
  }, [tasks, searchTerm, statusFilter, priorityFilter, assignedToFilter]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, priorityFilter, assignedToFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTasks = filteredTasks.slice(startIndex, startIndex + itemsPerPage);

  // Check if any filters are active
  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'all' || priorityFilter !== 'all' || assignedToFilter !== 'all';

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setAssignedToFilter('all');
  };

  // Generate initials from task title
  const getTaskInitials = (title: string) => {
    return title.split(' ').slice(0, 2).map(word => word.charAt(0).toUpperCase()).join('');
  };

  // Generate consistent color from title
  const getAvatarColor = (name: string) => {
    const colors = ['bg-slate-500', 'bg-slate-600', 'bg-zinc-500', 'bg-gray-500', 'bg-stone-500', 'bg-neutral-500', 'bg-slate-700', 'bg-zinc-600'];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  const getDueDateInfo = (dueDate: string | null, status: string) => {
    if (!dueDate || status === 'completed' || status === 'cancelled') return { color: '', isOverdue: false, isDueToday: false };
    const date = new Date(dueDate);
    date.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isOverdue = date < today;
    const isDueToday = date.getTime() === today.getTime();
    if (isOverdue) return { color: 'text-red-600 font-semibold', isOverdue: true, isDueToday: false };
    if (isDueToday) return { color: 'text-orange-500 font-medium', isOverdue: false, isDueToday: true };
    return { color: '', isOverdue: false, isDueToday: false };
  };

  const handleDeleteClick = (task: Task) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (taskToDelete) {
      onDelete(taskToDelete.id);
      setTaskToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const getLinkedEntityDisplay = (task: Task): { icon: React.ElementType; name: string } | null => {
    if (!task.module_type) return null;
    
    const Icon = moduleIcons[task.module_type] || FileText;
    
    switch (task.module_type) {
      case 'accounts':
        return task.account_name ? { icon: Icon, name: task.account_name } : null;
      case 'contacts':
        return task.contact_name ? { icon: Icon, name: task.contact_name } : null;
      case 'leads':
        return task.lead_name ? { icon: Icon, name: task.lead_name } : null;
      case 'meetings':
        return task.meeting_subject ? { icon: Icon, name: task.meeting_subject } : null;
      case 'deals':
        return task.deal_name ? { icon: Icon, name: task.deal_name } : null;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Filters */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={assignedToFilter} onValueChange={setAssignedToFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Assigned To" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assigned</SelectItem>
              {assignedToIds.map((userId) => (
                <SelectItem key={userId} value={userId}>
                  <span className="truncate">{displayNames[userId] || 'Loading...'}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <ClearFiltersButton hasActiveFilters={hasActiveFilters} onClear={clearAllFilters} />
        </div>

        {/* Page size selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show:</span>
          <Select value={itemsPerPage.toString()} onValueChange={val => setItemsPerPage(Number(val))}>
            <SelectTrigger className="w-[70px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map(size => <SelectItem key={size} value={size.toString()}>{size}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Task Table */}
      <Card className="flex-1 min-h-0 flex flex-col">
        <div className="relative overflow-auto flex-1">
          <Table>
            <TableHeader>
              <TableRow className="sticky top-0 z-20 bg-muted border-b-2">
                <TableHead className="w-10 font-bold text-foreground"></TableHead>
                <TableHead className="font-bold text-foreground px-4 py-3">Task</TableHead>
                <TableHead className="font-bold text-foreground px-4 py-3">Status</TableHead>
                <TableHead className="font-bold text-foreground px-4 py-3">Priority</TableHead>
                <TableHead className="font-bold text-foreground px-4 py-3">Due Date</TableHead>
                <TableHead className="font-bold text-foreground px-4 py-3">Assigned To</TableHead>
                <TableHead className="font-bold text-foreground px-4 py-3">Linked To</TableHead>
                <TableHead className="font-bold text-foreground px-4 py-3">Task Owner</TableHead>
                <TableHead className="w-32 text-center font-bold text-foreground px-4 py-3">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <ListTodo className="w-10 h-10 text-muted-foreground/50" />
                      <div>
                        <p className="font-medium text-foreground">No tasks found</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {hasActiveFilters ? "Try adjusting your search or filter criteria" : "Get started by adding your first task"}
                        </p>
                      </div>
                      {hasActiveFilters && (
                        <Button size="sm" variant="outline" onClick={clearAllFilters}>
                          Clear filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTasks.map((task) => {
                  const linkedEntity = getLinkedEntityDisplay(task);
                  const dueDateInfo = getDueDateInfo(task.due_date, task.status);

                  return (
                    <TableRow 
                      key={task.id} 
                      className={`hover:bg-muted/20 border-b group ${
                        dueDateInfo.isOverdue ? 'bg-red-50 dark:bg-red-900/10' : ''
                      }`}
                    >
                      <TableCell className="px-4 py-3">
                        <Checkbox
                          checked={task.status === 'completed'}
                          onCheckedChange={() => onToggleComplete(task)}
                        />
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <button
                          onClick={() => setViewingTask(task)}
                          className={`text-primary hover:underline font-medium text-left truncate ${
                            task.status === 'completed' ? 'line-through text-muted-foreground' : ''
                          }`}
                        >
                          <HighlightedText text={task.title} highlight={searchTerm} />
                        </button>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge variant="outline" className={`whitespace-nowrap ${statusColors[task.status]}`}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge variant="outline" className={`whitespace-nowrap ${priorityColors[task.priority]}`}>
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {task.due_date ? (
                          <div className="flex items-center gap-1">
                            {dueDateInfo.isOverdue && <AlertCircle className="h-3 w-3 text-red-600" />}
                            <span className={dueDateInfo.color}>
                              {dueDateInfo.isOverdue ? 'OVERDUE - ' : dueDateInfo.isDueToday ? 'Today - ' : ''}
                              {format(new Date(task.due_date), 'dd/MM/yyyy')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-center text-muted-foreground w-full block">-</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span className="truncate block">
                          {task.assigned_to ? (displayNames[task.assigned_to] || 'Loading...') : <span className="text-muted-foreground">Unassigned</span>}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {linkedEntity ? (
                          <div className="flex items-center gap-1 text-sm">
                            <linkedEntity.icon className="h-3 w-3" />
                            <span className="truncate max-w-[100px]" title={linkedEntity.name}>
                              {linkedEntity.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-center text-muted-foreground w-full block">-</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {task.created_by ? (
                          <div className="flex items-center gap-1 text-sm">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate max-w-[100px]" title={displayNames[task.created_by]}>
                              {displayNames[task.created_by] || 'Loading...'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-center text-muted-foreground w-full block">-</span>
                        )}
                      </TableCell>
                      <TableCell className="w-20 px-4 py-3">
                        <div className="flex items-center justify-center">
                          <RowActionsDropdown
                            actions={[
                              {
                                label: "View Details",
                                icon: <Eye className="w-4 h-4" />,
                                onClick: () => setViewingTask(task)
                              },
                              {
                                label: "Edit",
                                icon: <Edit className="w-4 h-4" />,
                                onClick: () => onEdit(task)
                              },
                              {
                                label: "Delete",
                                icon: <Trash2 className="w-4 h-4" />,
                                onClick: () => handleDeleteClick(task),
                                destructive: true,
                                separator: true
                              }
                            ]}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Showing {filteredTasks.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredTasks.length)} of {filteredTasks.length} tasks
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages || 1}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        itemName={taskToDelete?.title}
        itemType="task"
      />

      <TaskDetailModal
        open={!!viewingTask}
        onOpenChange={(open) => !open && setViewingTask(null)}
        task={viewingTask}
        onEdit={(task) => {
          setViewingTask(null);
          onEdit(task);
        }}
      />
    </div>
  );
};
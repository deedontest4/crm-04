import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { 
  Clock, 
  User, 
  MessageSquare, 
  FileText, 
  AlertCircle,
  CheckCircle,
  ArrowRightLeft,
  Flag
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TimelineEvent {
  id: string;
  timestamp: Date;
  type: 'status' | 'assignment' | 'comment' | 'priority' | 'created' | 'first_response';
  description: string;
  user_name?: string;
  metadata?: any;
}

interface IncidentTimelineProps {
  incidentId: string;
  createdAt: Date;
}

export default function IncidentTimeline({ incidentId, createdAt }: IncidentTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (incidentId) {
      fetchTimeline();
    }
  }, [incidentId]);

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      // Fetch activity logs
      const { data: activityData } = await supabase
        .from("activity_logs")
        .select("*, performed_by_profile:profiles!activity_logs_performed_by_fkey(full_name)")
        .eq("entity_type", "incident")
        .eq("entity_id", incidentId)
        .order("created_at", { ascending: false });

      // Fetch comments
      const { data: commentsData } = await supabase
        .from("incident_comments")
        .select("*, user:profiles!incident_comments_user_id_fkey(full_name)")
        .eq("incident_id", incidentId)
        .order("created_at", { ascending: false });

      const timelineEvents: TimelineEvent[] = [];

      // Add activity logs
      if (activityData) {
        activityData.forEach((log: any) => {
          let type: TimelineEvent['type'] = 'created';
          
          if (log.action === 'status_changed') type = 'status';
          else if (log.action === 'assigned') type = 'assignment';
          else if (log.action === 'priority_changed') type = 'priority';
          else if (log.action === 'first_response') type = 'first_response';

          timelineEvents.push({
            id: log.id,
            timestamp: new Date(log.created_at),
            type,
            description: log.description,
            user_name: log.performed_by_profile?.full_name,
            metadata: log.metadata
          });
        });
      }

      // Add comments
      if (commentsData) {
        commentsData.forEach((comment: any) => {
          timelineEvents.push({
            id: comment.id,
            timestamp: new Date(comment.created_at),
            type: 'comment',
            description: comment.comment,
            user_name: comment.user?.full_name
          });
        });
      }

      // Sort by timestamp descending
      timelineEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      setEvents(timelineEvents);
    } catch (error) {
      console.error("Error fetching timeline:", error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'status':
        return <ArrowRightLeft className="h-4 w-4" />;
      case 'assignment':
        return <User className="h-4 w-4" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4" />;
      case 'priority':
        return <Flag className="h-4 w-4" />;
      case 'first_response':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'created':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'status':
        return 'bg-primary/10 text-primary';
      case 'assignment':
        return 'bg-secondary/10 text-secondary-foreground';
      case 'comment':
        return 'bg-accent/10 text-accent-foreground';
      case 'priority':
        return 'bg-destructive/10 text-destructive';
      case 'first_response':
        return 'bg-success/10 text-success';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading timeline...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Incident Timeline</h3>
      
      <div className="relative space-y-4">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
        
        {events.map((event, index) => (
          <div key={event.id} className="relative pl-10">
            {/* Event icon */}
            <div className={`absolute left-0 flex h-8 w-8 items-center justify-center rounded-full border bg-background ${getEventColor(event.type)}`}>
              {getEventIcon(event.type)}
            </div>
            
            {/* Event content */}
            <Card>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">{event.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{format(event.timestamp, "PPp")}</span>
                      {event.user_name && (
                        <>
                          <span>•</span>
                          <span>{event.user_name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {event.type}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
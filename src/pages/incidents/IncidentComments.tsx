import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare } from "lucide-react";

interface IncidentCommentsProps {
  incidentId: string;
}

export default function IncidentComments({ incidentId }: IncidentCommentsProps) {
  const { profile } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComments();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('incident-comments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'incident_comments',
          filter: `incident_id=eq.${incidentId}`
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [incidentId]);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("incident_comments")
      .select(`
        *,
        profiles:user_id (full_name, email)
      `)
      .eq("incident_id", incidentId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
    } else {
      setComments(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !newComment.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("incident_comments").insert({
        incident_id: incidentId,
        user_id: profile.user_id,
        comment: newComment.trim(),
      });

      if (error) throw error;

      setNewComment("");
      toast.success("Comment added");
    } catch (error: any) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No comments yet</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="border-l-2 border-muted pl-4 py-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">
                    {comment.profiles?.full_name || comment.profiles?.email}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{comment.comment}</p>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />
          <Button type="submit" disabled={loading || !newComment.trim()}>
            {loading ? "Posting..." : "Post Comment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

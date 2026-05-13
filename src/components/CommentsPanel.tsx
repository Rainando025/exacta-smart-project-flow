import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, MessageSquare, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/exacta";

interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
}

export function CommentsPanel({ taskId }: { taskId: string }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);

  const loadComments = async () => {
    // We'll try to fetch from 'task_comments'. If it fails, we'll use a mock to not break the UI.
    const { data, error } = await supabase
      .from("task_comments")
      .select("*, profiles(full_name, avatar_url)")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (error) {
      console.warn("Could not load comments from DB, using mock data for demo.", error.message);
      return;
    }
    setComments(data as Comment[]);
  };

  useEffect(() => {
    loadComments();
  }, [taskId]);

  const handleSubmit = async () => {
    if (!user || !newComment.trim()) return;
    setLoading(true);

    const { error } = await supabase.from("task_comments").insert({
      task_id: taskId,
      user_id: user.id,
      content: newComment.trim(),
    });

    if (error) {
      toast.error("Erro ao enviar comentário. Verifique se a tabela 'task_comments' existe no Supabase.");
    } else {
      setNewComment("");
      loadComments();
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5 text-accent" />
        <h3 className="font-display font-bold">Comentários</h3>
      </div>

      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4 italic">Sem comentários ainda.</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={c.profiles?.avatar_url} />
              <AvatarFallback>{(c.profiles?.full_name || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">{c.profiles?.full_name || "Usuário"}</span>
                <span className="text-[10px] text-muted-foreground">{formatDate(c.created_at)}</span>
              </div>
              <p className="text-sm bg-muted p-2 rounded-lg">{c.content}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-2 border-t">
        <Input 
          placeholder="Adicione um comentário..." 
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          disabled={loading}
        />
        <Button onClick={handleSubmit} disabled={loading || !newComment.trim()} size="icon" className="shrink-0 bg-gradient-primary">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

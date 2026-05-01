import { Bell, AlertCircle, Clock, CheckCheck, MessageSquare, UserPlus, Sparkles } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Link } from "@tanstack/react-router";
import { useNotifications } from "@/contexts/NotificationsContext";

const iconFor = (type: string) => {
  switch (type) {
    case "task_assigned":
      return <UserPlus className="h-4 w-4 text-accent shrink-0 mt-0.5" />;
    case "task_updated":
      return <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />;
    case "task_due":
      return <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />;
    case "feedback":
      return <MessageSquare className="h-4 w-4 text-accent shrink-0 mt-0.5" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />;
  }
};

export function NotificationsBell() {
  const { items, unread, markAllRead, markRead } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="Notificações"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition"
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-sm">Notificações</h3>
            <p className="text-xs text-muted-foreground">
              {unread} não lida{unread === 1 ? "" : "s"}
            </p>
          </div>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-accent hover:underline flex items-center gap-1"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Marcar todas
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-auto divide-y">
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground p-6 text-center">Tudo em dia ✨</p>
          )}
          {items.map((n) => (
            <Link
              key={n.id}
              to={(n.link as any) || "/dashboard"}
              onClick={() => markRead(n.id)}
              className={`flex items-start gap-2 p-3 hover:bg-muted/50 transition ${
                !n.read ? "bg-accent/5" : ""
              }`}
            >
              {iconFor(n.type)}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{n.title}</p>
                {n.message && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                )}
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(n.created_at).toLocaleString("pt-BR")}
                </p>
              </div>
              {!n.read && <span className="h-2 w-2 rounded-full bg-accent shrink-0 mt-1.5" />}
            </Link>
          ))}
        </div>
        <div className="border-t p-2 text-center">
          <Link to="/notifications" className="text-xs text-accent hover:underline">
            Ver histórico completo
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Profile = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  job_title: string | null;
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LAST_ACTIVITY_KEY = "exacta_last_activity_timestamp";
// Tempo limite de inatividade (ex: 30 minutos)
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Monitorar inatividade e deslogar caso exceda o limite
  useEffect(() => {
    if (!user) return;

    // Verificar se o usuário já estava inativo antes de abrir a aba/aplicação
    const lastActivityStr = localStorage.getItem(LAST_ACTIVITY_KEY);
    const now = Date.now();

    if (lastActivityStr) {
      const lastActivity = parseInt(lastActivityStr, 10);
      if (!isNaN(lastActivity) && now - lastActivity > INACTIVITY_TIMEOUT_MS) {
        // Excedeu tempo limite por inatividade
        localStorage.removeItem(LAST_ACTIVITY_KEY);
        supabase.auth.signOut().then(() => {
          setUser(null);
          setSession(null);
          setProfile(null);
          window.location.href = "/auth?reason=inactivity";
        });
        return;
      }
    }

    // Atualizar carimbo de última atividade
    const updateActivity = () => {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    };

    updateActivity();

    // Eventos que marcam interação do usuário
    const activityEvents = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    const handleUserInteraction = () => {
      updateActivity();
    };

    activityEvents.forEach((evt) => window.addEventListener(evt, handleUserInteraction, { passive: true }));

    // Verificação periódica a cada 1 minuto caso a aba fique aberta sem uso
    const interval = setInterval(() => {
      const currentLastActivity = parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) || "0", 10);
      if (currentLastActivity > 0 && Date.now() - currentLastActivity > INACTIVITY_TIMEOUT_MS) {
        localStorage.removeItem(LAST_ACTIVITY_KEY);
        supabase.auth.signOut().then(() => {
          setUser(null);
          setSession(null);
          setProfile(null);
          window.location.href = "/auth?reason=inactivity";
        });
      }
    }, 60 * 1000);

    return () => {
      activityEvents.forEach((evt) => window.removeEventListener(evt, handleUserInteraction));
      clearInterval(interval);
    };
  }, [user]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
        setTimeout(() => loadProfile(newSession.user.id), 0);
      } else {
        setProfile(null);
        localStorage.removeItem(LAST_ACTIVITY_KEY);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
        loadProfile(s.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (data) setProfile(data as Profile);
  };

  const signOut = async () => {
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

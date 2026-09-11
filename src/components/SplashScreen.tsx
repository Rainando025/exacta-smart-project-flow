import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export const DIGITAL_TARGET_GIF =
  "https://raw.githubusercontent.com/Rainando025/ASSETS-FOTOS/main/%C3%8Dcone_azul_com_mira_digital_202609091043.gif";

const EXACTA_LOGO =
  "https://raw.githubusercontent.com/Rainando025/ASSETS-FOTOS/refs/heads/main/icone_exacta.png";

interface SplashContextType {
  showSplash: (message?: string, durationMs?: number) => void;
  hideSplash: () => void;
}

const SplashContext = createContext<SplashContextType | undefined>(undefined);

export function SplashProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(true);
  const [message, setMessage] = useState("Inicializando sistema EXACTA...");
  const [durationMs, setDurationMs] = useState(2200);

  // Preload GIF image on provider mount
  useEffect(() => {
    const img = new Image();
    img.src = DIGITAL_TARGET_GIF;
  }, []);

  const showSplash = (msg = "Carregando EXACTA...", duration = 2200) => {
    setMessage(msg);
    setDurationMs(duration);
    setActive(true);
  };

  const hideSplash = () => {
    setActive(false);
  };

  return (
    <SplashContext.Provider value={{ showSplash, hideSplash }}>
      {children}
      <SplashScreenOverlay
        active={active}
        message={message}
        durationMs={durationMs}
        onFinish={() => setActive(false)}
      />
    </SplashContext.Provider>
  );
}

export function useSplash() {
  const ctx = useContext(SplashContext);
  if (!ctx) {
    // Fallback stub if used outside provider
    return {
      showSplash: () => {},
      hideSplash: () => {},
    };
  }
  return ctx;
}

interface SplashScreenOverlayProps {
  message?: string;
  onFinish?: () => void;
  durationMs?: number;
  active?: boolean;
}

export function SplashScreenOverlay({
  message = "Inicializando sistema EXACTA...",
  onFinish,
  durationMs = 2200,
  active = true,
}: SplashScreenOverlayProps) {
  const [visible, setVisible] = useState(active);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    if (!active) {
      setFadingOut(true);
      const t = setTimeout(() => {
        setVisible(false);
        if (onFinish) onFinish();
      }, 400);
      return () => clearTimeout(t);
    }

    setVisible(true);
    setFadingOut(false);

    if (durationMs > 0) {
      const timer = setTimeout(() => {
        setFadingOut(true);
        const finishTimer = setTimeout(() => {
          setVisible(false);
          if (onFinish) onFinish();
        }, 400);
        return () => clearTimeout(finishTimer);
      }, durationMs);

      return () => clearTimeout(timer);
    }
  }, [active, durationMs, onFinish]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-[#060913] text-white select-none transition-opacity duration-500 ease-out overflow-hidden pointer-events-auto",
        fadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      )}
    >
      {/* Fundo com iluminação azul cibernética e grade futurista */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.22)_0%,rgba(6,9,19,0.98)_70%)] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, #38bdf81a 1px, transparent 1px), linear-gradient(to bottom, #38bdf81a 1px, transparent 1px)",
          backgroundSize: "3rem 3rem",
        }}
      />

      {/* Círculos concêntricos decorativos de radar/mira */}
      <div className="absolute w-[500px] h-[500px] rounded-full border border-sky-500/15 animate-ping opacity-20 pointer-events-none" />
      <div className="absolute w-[320px] h-[320px] rounded-full border border-sky-400/25 pointer-events-none" />

      {/* Conteúdo Central */}
      <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center max-w-lg">
        {/* GIF de Mira Digital em Destaque */}
        <div className="relative flex items-center justify-center mb-6">
          <div className="absolute inset-0 rounded-full bg-sky-500/30 blur-2xl animate-pulse" />
          <img
            src={DIGITAL_TARGET_GIF}
            alt="Mira Digital EXACTA"
            className="w-48 h-48 sm:w-64 sm:h-64 object-contain relative z-10 drop-shadow-[0_0_35px_rgba(14,165,233,0.75)]"
          />
        </div>

        {/* Branding e Texto */}
        <div className="flex items-center gap-2 mb-3">
          <img src={EXACTA_LOGO} alt="EXACTA" className="w-8 h-8 object-contain drop-shadow-md" />
          <span className="font-display text-2xl font-bold tracking-wider text-white">
            EXACTA
          </span>
        </div>

        <p className="text-sm font-semibold tracking-wide text-sky-200/90 uppercase animate-pulse">
          {message}
        </p>

        {/* Linha de Progresso Futurista */}
        <div className="w-52 h-1.5 bg-slate-800/80 rounded-full mt-6 overflow-hidden border border-sky-500/30 shadow-[0_0_10px_rgba(14,165,233,0.3)]">
          <div className="h-full bg-gradient-to-r from-sky-500 via-cyan-400 to-blue-600 rounded-full animate-[progress_1.8s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}

// Retrocompatibilidade
export const SplashScreen = SplashScreenOverlay;

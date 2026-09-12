import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export const DIGITAL_TARGET_VIDEO =
  "https://raw.githubusercontent.com/Rainando025/ASSETS-FOTOS/main/%C3%8Dcone_azul_com_mira_digital_202609091043.mp4";

// Manter constante legada para evitar quebras se importada em outro lugar
export const DIGITAL_TARGET_GIF = DIGITAL_TARGET_VIDEO;

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
      {/* Vídeo em Tela Cheia */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-85"
      >
        <source src={DIGITAL_TARGET_VIDEO} type="video/mp4" />
      </video>

      {/* Overlay de gradiente escuro para legibilidade da mensagem e logo */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#060913] via-[#060913]/40 to-[#060913]/70 pointer-events-none" />

      {/* Conteúdo Central com a Mensagem */}
      <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center max-w-lg">
        {/* Logo EXACTA */}
        <div className="flex items-center gap-2.5 mb-4">
          <img src={EXACTA_LOGO} alt="EXACTA" className="w-10 h-10 object-contain drop-shadow-[0_0_12px_rgba(56,189,248,0.6)]" />
          <span className="font-display text-3xl font-extrabold tracking-wider text-white drop-shadow-md">
            EXACTA
          </span>
        </div>

        {/* Mensagem da Splash */}
        <p className="text-base font-semibold tracking-wide text-sky-200 uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] animate-pulse">
          {message}
        </p>

        {/* Linha de Progresso Futurista */}
        <div className="w-56 h-1.5 bg-slate-900/80 rounded-full mt-6 overflow-hidden border border-sky-500/40 shadow-[0_0_15px_rgba(14,165,233,0.5)]">
          <div className="h-full bg-gradient-to-r from-sky-500 via-cyan-400 to-blue-600 rounded-full animate-[progress_1.8s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}

// Retrocompatibilidade
export const SplashScreen = SplashScreenOverlay;

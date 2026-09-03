let audioEnabled = true;

export function setAudioEnabled(enabled: boolean) {
  audioEnabled = enabled;
  if (typeof window === "undefined") return;
  localStorage.setItem("nexus-bi-audio-enabled", enabled ? "true" : "false");
}

export function isAudioEnabled(): boolean {
  if (typeof window === "undefined") return audioEnabled;
  const saved = localStorage.getItem("nexus-bi-audio-enabled");
  if (saved !== null) {
    return saved === "true";
  }
  return audioEnabled;
}

/** Play a pleasant double-tone notification chime. */
export function playChime() {
  if (!isAudioEnabled()) return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    // Tone 1: C5 (523.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(523.25, now);
    
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.12, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
    
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    
    // Tone 2: E5 (659.25 Hz) after 120ms
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(659.25, now + 0.12);
    
    gain2.gain.setValueAtTime(0, now + 0.12);
    gain2.gain.linearRampToValueAtTime(0.12, now + 0.17);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    
    osc1.start(now);
    osc1.stop(now + 0.35);
    
    osc2.start(now + 0.12);
    osc2.stop(now + 0.5);
  } catch (e) {
    console.warn("Could not play sound chime:", e);
  }
}

/** Play an urgent warning notification. */
export function playWarning() {
  if (!isAudioEnabled()) return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "triangle";
    // Alert tone sliding from 440Hz (A4) to 587.33Hz (D5)
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.linearRampToValueAtTime(587.33, now + 0.15);
    osc.frequency.linearRampToValueAtTime(440, now + 0.3);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.5);
  } catch (e) {
    console.warn("Could not play sound warning:", e);
  }
}

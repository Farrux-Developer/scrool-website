import { create } from "zustand";

interface ExperienceState {
  /** 0..1 — общий прогресс скролла страницы */
  progress: number;hjg
  /** нормализованная позиция мыши, -1..1 */
  mouse: { x: number; y: number };ghjg
  /** уровень качества: 2 — полный, 1 — средний, 0 — минимальный */
  quality: number;
  reducedMotion: boolean;
  isTouch: boolean;
  /** сцена собрана, можно раскрывать прелоадер */
  ready: boolean;
  /** прелоадер закончил анимацию раскрытия */
  introDone: boolean;
  soundOn: boolean;

  setProgress: (v: number) => void;
  setMouse: (x: number, y: number) => void;
  setQuality: (q: number) => void;
  setReady: () => void;
  setIntroDone: () => void;
  toggleSound: () => void;
  setFlags: (f: Partial<Pick<ExperienceState, "reducedMotion" | "isTouch">>) => void;
}

export const useStore = create<ExperienceState>((set) => ({
  progress: 0,
  mouse: { x: 0, y: 0 },
  quality: 2,
  reducedMotion: false,
  isTouch: false,
  ready: false,
  introDone: false,
  soundOn: false,

  setProgress: (v) => set({ progress: v }),
  setMouse: (x, y) => set({ mouse: { x, y } }),
  setQuality: (q) => set({ quality: q }),
  setReady: () => set({ ready: true }),
  setIntroDone: () => set({ introDone: true }),
  toggleSound: () => set((s) => ({ soundOn: !s.soundOn })),
  setFlags: (f) => set(f),
}));

// dev-хук для headless-проверок сцены
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).__store = useStore;
}

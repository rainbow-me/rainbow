import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { time } from '@/utils/time';

export const SURFACE_SCHEDULE_REEVALUATE_MS = time.minutes(10);

type SurfaceClockState = {
  now: number;
  updateNow: () => void;
};

export const useSurfaceClockStore = createRainbowStore<SurfaceClockState>(set => ({
  now: Date.now(),
  updateNow: () => set({ now: Date.now() }),
}));

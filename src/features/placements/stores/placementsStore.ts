import { getApp } from '@react-native-firebase/app';
import { collection, getDocs, getFirestore, orderBy, query, where } from '@react-native-firebase/firestore';

import { type Placement, type PlacementItem } from '@/features/placements/types';
import { logger, RainbowError } from '@/logger';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';

async function fetchPlacements(): Promise<Placement[]> {
  try {
    const db = getFirestore(getApp());
    const placementsRef = collection(db, 'placements');
    const q = query(placementsRef, where('enabled', '==', true), orderBy('order'));

    const snap = await getDocs(q);

    return snap.docs
      .map((d: { id: string; data: () => Record<string, unknown> }) => ({ id: d.id, ...d.data() }) as Placement)
      .map((p: Placement) => ({
        ...p,
        items: (p.items ?? []).sort((a: PlacementItem, b: PlacementItem) => a.order - b.order),
      }));
  } catch (e) {
    logger.error(new RainbowError('[placementsStore]: Failed to fetch placements', e as Error), { error: e });
    throw e;
  }
}

type PlacementsState = {
  placements: Placement[];
  getPlacement: (id: string) => Placement | undefined;
};

const PLACEMENTS_STALE_TIME = time.hours(1);
const PLACEMENTS_CACHE_TIME = time.days(2);

export const usePlacementsStore = createQueryStore<Placement[], never, PlacementsState>(
  {
    fetcher: fetchPlacements,
    setData: ({ data, set }) => set({ placements: data }),
    staleTime: PLACEMENTS_STALE_TIME,
    cacheTime: PLACEMENTS_CACHE_TIME,
  },
  (_set, get) => ({
    placements: [],
    getPlacement: (id: string) => get().placements.find(p => p.id === id),
  }),
  {
    partialize: state => ({ placements: state.placements }),
    storageKey: 'placements',
    version: 1,
  }
);

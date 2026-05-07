import { getApp } from '@react-native-firebase/app';
import { collection, getDocs, getFirestore, orderBy, query, where, type FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

import { type Placement } from '@/features/placements/types';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';

// ============ Types ========================================================== //

type PlacementDocument = Omit<Placement, 'id'>;

type PlacementsState = {
  placements: Placement[];
  getPlacement: (id: Placement['id']) => Placement | undefined;
};

// ============ Query Store ==================================================== //

const PLACEMENTS_STALE_TIME = time.hours(1);
const PLACEMENTS_CACHE_TIME = time.days(2);

export const usePlacementsStore = createQueryStore<Placement[], never, PlacementsState>(
  {
    fetcher: fetchPlacements,
    setData: ({ data, set }) => set({ placements: data }),
    staleTime: PLACEMENTS_STALE_TIME,
    cacheTime: PLACEMENTS_CACHE_TIME,
  },
  (_, get) => ({
    placements: [],
    getPlacement: id => get().placements.find(placement => placement.id === id),
  }),
  {
    partialize: state => ({ placements: state.placements }),
    storageKey: 'placements',
    version: 1,
  }
);

// ============ Fetcher ======================================================== //

async function fetchPlacements(): Promise<Placement[]> {
  const db = getFirestore(getApp());
  const placementsRef = collection(db, 'placements');
  const q = query(placementsRef, where('enabled', '==', true), orderBy('order'));
  const snap: FirebaseFirestoreTypes.QuerySnapshot<PlacementDocument> = await getDocs<
    PlacementDocument,
    FirebaseFirestoreTypes.DocumentData
  >(q);

  return snap.docs.map(doc => {
    const placement = { id: doc.id, ...doc.data() };

    return {
      ...placement,
      items: [...placement.items].sort((a, b) => a.order - b.order),
    };
  });
}

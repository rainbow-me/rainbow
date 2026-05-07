import { getApp } from '@react-native-firebase/app';
import { collection, getDocs, getFirestore, orderBy, query, where } from '@react-native-firebase/firestore';

import { PLACEMENT_IDS_BY_SCREEN, PLACEMENT_SCREENS } from '@/features/placements/constants';
import { type Placement, type PlacementId, type PlacementItem, type PlacementScreen } from '@/features/placements/types';
import { logger, RainbowError } from '@/logger';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';

type FirestoreDocSnapshot = { id: string; data: () => Record<string, unknown> };

const VALID_SCREENS = new Set<string>(Object.values(PLACEMENT_SCREENS));
const VALID_PLACEMENT_IDS = new Set<PlacementId>(Object.values(PLACEMENT_IDS_BY_SCREEN).flat());

function isPlacementIdForScreen(placementId: PlacementId, screen: PlacementScreen): boolean {
  return (PLACEMENT_IDS_BY_SCREEN[screen] as readonly PlacementId[]).includes(placementId);
}

function parsePlacementDoc(doc: FirestoreDocSnapshot): Placement | null {
  const data = doc.data() as Omit<Placement, 'id'>;
  const placementId = doc.id as PlacementId;
  if (!Array.isArray(data.items)) {
    logger.error(new RainbowError(`[placementsStore]: malformed placement ${doc.id} - items not an array`));
    return null;
  }
  if (!VALID_SCREENS.has(data.screen)) {
    logger.error(new RainbowError(`[placementsStore]: malformed placement ${doc.id} - unknown screen "${data.screen}"`));
    return null;
  }
  if (!VALID_PLACEMENT_IDS.has(placementId)) {
    logger.error(new RainbowError(`[placementsStore]: malformed placement ${doc.id} - unknown id`));
    return null;
  }
  if (!isPlacementIdForScreen(placementId, data.screen as PlacementScreen)) {
    logger.error(new RainbowError(`[placementsStore]: malformed placement ${doc.id} - id does not belong to "${data.screen}"`));
    return null;
  }
  return {
    ...data,
    id: placementId,
    screen: data.screen as PlacementScreen,
    items: [...data.items].sort((a: PlacementItem, b: PlacementItem) => a.order - b.order),
  };
}

async function fetchPlacements(): Promise<Record<string, Placement>> {
  const db = getFirestore(getApp());
  const placementsRef = collection(db, 'placements');
  const q = query(placementsRef, where('enabled', '==', true), orderBy('order'));
  const snap = await getDocs(q);

  return snap.docs.reduce<Record<string, Placement>>((acc: Record<string, Placement>, doc: FirestoreDocSnapshot) => {
    const placement = parsePlacementDoc(doc);
    if (placement) acc[placement.id] = placement;
    return acc;
  }, {});
}

type PlacementsState = {
  placementsById: Record<string, Placement>;
  getPlacement: (id: string) => Placement | undefined;
};

export const usePlacementsStore = createQueryStore<Record<string, Placement>, never, PlacementsState>(
  {
    fetcher: fetchPlacements,
    setData: ({ data, set }) => set({ placementsById: data }),
    staleTime: time.hours(1),
    cacheTime: time.days(2),
  },
  (_set, get) => ({
    placementsById: {},
    getPlacement: (id: string) => get().placementsById[id],
  }),
  {
    storageKey: 'placements',
    version: 1,
  }
);

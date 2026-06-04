import { getApp } from '@react-native-firebase/app';
import { collection, getDocs, getFirestore, query, where, type FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

import {
  placementDocumentSchema,
  type Placement,
  type PlacementId,
  type PlacementItem,
  type PlacementSource,
} from '@/features/placements/types';
import { time } from '@/framework/core/utils/time';
import { createQueryStore } from '@/state/internal/createQueryStore';

// ============ Types ========================================================== //

export type PlacementsState = {
  placementsById: PlacementsById;
  getPlacement: (id: PlacementId) => Placement | undefined;
  getItemsBySource: <Source extends PlacementSource>(id: PlacementId, source: Source) => PlacementItem[];
};

export type PlacementResult<Hydrated> = {
  isLoading: boolean;
  items: Hydrated[];
  placement: Placement | undefined;
};

type PlacementsById = Partial<Record<PlacementId, Placement>>;

type PlacementDocument = Partial<Placement>;
type PlacementDocumentSnapshot = {
  data: () => unknown;
  id: string;
};

// ============ Query Store ==================================================== //

export const usePlacementsStore = createQueryStore<PlacementsById, never, PlacementsState>(
  {
    fetcher: fetchPlacements,
    setData: ({ data, set }) => set({ placementsById: data }),
    keepPreviousData: true,
    staleTime: time.minutes(15),
    cacheTime: time.days(2),
  },

  (_, get) => {
    return {
      placementsById: {},

      getPlacement: id => {
        return get().placementsById[id];
      },

      getItemsBySource: (id, source) => {
        const placement = get().placementsById[id];
        if (placement?.source !== source) return [];
        return getItems(placement);
      },
    };
  },

  { storageKey: 'placementsStore', version: 1 }
);

export function selectPlacementItemsBySource<Source extends PlacementSource>(
  state: ReturnType<typeof usePlacementsStore.getState>,
  placementId: PlacementId,
  source: Source
): PlacementItem[] {
  return state.getItemsBySource(placementId, source);
}

export function isPlacementHydrating<Source extends PlacementSource>(
  state: ReturnType<typeof usePlacementsStore.getState>,
  placementId: PlacementId,
  source: Source
): boolean {
  const isInitialLoad = state.getStatus('isInitialLoad');
  const isIdleWithoutCachedPlacement =
    state.getStatus('isIdle') && state.getPlacement(placementId) === undefined && !state.getItemsBySource(placementId, source).length;

  return isInitialLoad || isIdleWithoutCachedPlacement;
}

// ============ Fetcher ======================================================== //

async function fetchPlacements(): Promise<PlacementsById> {
  const db = getFirestore(getApp());
  const placementsRef = collection(db, 'placements');
  const q = query(placementsRef, where('version', '==', 2));

  const snap: FirebaseFirestoreTypes.QuerySnapshot<PlacementDocument> = await getDocs<
    PlacementDocument,
    FirebaseFirestoreTypes.DocumentData
  >(q);

  return buildPlacementsById(snap.docs);
}

// ============ Utilities ====================================================== //

function buildPlacementsById(placements: PlacementDocumentSnapshot[]): PlacementsById {
  const placementsById: PlacementsById = {};

  for (const doc of placements) {
    const placement = parsePlacementDocument(doc.id, doc.data());
    if (!placement) continue;
    placementsById[placement.id] = placement;
  }

  return placementsById;
}

function parsePlacementDocument(id: string, placement: unknown): Placement | undefined {
  const parsed = placementDocumentSchema.safeParse(placement);
  if (!parsed.success || parsed.data.id !== id) return undefined;

  return parsed.data;
}

function getItems(placement: Placement | undefined): PlacementItem[] {
  return placement?.items ?? [];
}

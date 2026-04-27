import { getApp } from '@react-native-firebase/app';
import { collection, getDocs, getFirestore, query, where, type FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { createQueryStore } from '@storesjs/stores';

import { PLACEMENT_SOURCES, PLACEMENT_TYPES } from '@/features/placements/constants';
import {
  type Placement,
  type PlacementId,
  type PlacementItem,
  type PlacementSource,
  type PlacementType,
} from '@/features/placements/types';
import { isNonEmptyString, oneOf } from '@/features/placements/utils/decoders';
import { time } from '@/framework/core/utils/time';

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

// ============ Constants ====================================================== //

const isPlacementSource = oneOf<PlacementSource>(Object.values(PLACEMENT_SOURCES));
const isPlacementType = oneOf<PlacementType>(Object.values(PLACEMENT_TYPES));

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
    const placementDocument = doc.data();
    if (!isPlacementDocument(doc.id, placementDocument)) continue;

    const placement = buildPlacement(doc.id, placementDocument);
    placementsById[placement.id] = placement;
  }

  return placementsById;
}

function buildPlacement(id: PlacementId, placement: Placement): Placement {
  return {
    ...placement,
    id,
    items: placement.items.filter(isPlacementItem),
  };
}

function getItems(placement: Placement | undefined): PlacementItem[] {
  return placement?.items ?? [];
}

// ============ Type Guards ==================================================== //

// Contract: schema/placements-v2.schema.json
function isPlacementDocument(id: string, placement: unknown): placement is Placement {
  if (typeof placement !== 'object' || placement === null) return false;

  const document = placement as Partial<Placement>;

  return (
    isNonEmptyString(id) &&
    document.id === id &&
    document.version === 2 &&
    isPlacementRefPair(document.source, document.type) &&
    Array.isArray(document.items)
  );
}

function isPlacementItem(item: unknown): item is PlacementItem {
  if (typeof item !== 'object' || item === null) return false;

  const id = (item as Partial<PlacementItem>).id;
  return isNonEmptyString(id);
}

function isPlacementRefPair(source: unknown, type: unknown): source is PlacementSource {
  if (!isPlacementSource(source) || !isPlacementType(type)) return false;

  switch (source) {
    case 'hyperliquid':
      return type === 'perp';
    case 'polymarket':
      return type === 'prediction';
    case 'rainbow':
      return type === 'token';
  }
}

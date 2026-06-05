import { getApp } from '@react-native-firebase/app';
import { collection, getDocs, getFirestore, orderBy, query, where, type FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

import { PLACEMENT_IDS, PLACEMENT_SOURCES, PLACEMENT_TYPES } from '@/features/placements/constants';
import {
  type Placement,
  type PlacementId,
  type PlacementIdV2,
  type PlacementItem,
  type PlacementItemV2,
  type PlacementSource,
  type PlacementSourceV2,
  type PlacementTypeV2,
  type PlacementV2,
} from '@/features/placements/types';
import { isNonEmptyString, oneOf } from '@/features/placements/utils/decoders';
import { time } from '@/framework/core/utils/time';
import { getConsistentArray } from '@/helpers/getConsistentArray';
import { createQueryStore } from '@/state/internal/createQueryStore';

// ============ v1 Types ======================================================= //

export type PlacementsState = {
  placementsById: PlacementsById;
  getPlacement: (id: PlacementId) => Placement | undefined;
  getItemsBySource: <Source extends PlacementSource>(id: PlacementId, source: Source) => PlacementItem<Source>[];
  getRefIds: (id: PlacementId, source: PlacementSource) => string[];
  hasRefIds: (id: PlacementId, source: PlacementSource) => boolean;
};

type PlacementDocument = Omit<Placement, 'id'>;
type PlacementsById = Partial<Record<PlacementId, Placement>>;

// ============ Constants ====================================================== //

const EMPTY_PLACEMENT_ITEMS: PlacementItem[] = [];
const PLACEMENT_ID_SET = new Set<string>(Object.values(PLACEMENT_IDS));

// ============ Query Store ==================================================== //

export const usePlacementsStore = createQueryStore<PlacementsById, never, PlacementsState>(
  {
    fetcher: fetchPlacements,
    setData: ({ data, set }) => set({ placementsById: data }),
    staleTime: time.hours(1),
    cacheTime: time.days(2),
  },

  (_, get) => ({
    placementsById: {},

    getPlacement: id => get().placementsById[id],

    getItemsBySource: (id, source) => {
      const placement = get().placementsById[id];
      return filterBySource(getItems(placement), source);
    },

    getRefIds: (id, source) => {
      const placement = get().placementsById[id];
      return buildStableRefIds(getItems(placement), source);
    },

    hasRefIds: (id, source) => {
      const placement = get().placementsById[id];
      return getItems(placement).some(item => isPlacementItemSource(item, source));
    },
  }),

  { storageKey: 'placementsStore' }
);

// ============ Fetcher ======================================================== //

async function fetchPlacements(): Promise<PlacementsById> {
  const db = getFirestore(getApp());
  const placementsRef = collection(db, 'placements');
  const q = query(placementsRef, where('enabled', '==', true), orderBy('order'));

  const snap: FirebaseFirestoreTypes.QuerySnapshot<PlacementDocument> = await getDocs<
    PlacementDocument,
    FirebaseFirestoreTypes.DocumentData
  >(q);

  return buildPlacementsById(snap.docs);
}

// ============ Utilities ====================================================== //

function buildPlacementsById(placements: FirebaseFirestoreTypes.QueryDocumentSnapshot<PlacementDocument>[]): PlacementsById {
  const placementsById: PlacementsById = {};

  for (const doc of placements) {
    if (!isPlacementId(doc.id)) continue;
    const placement = buildPlacement(doc.id, doc.data());
    placementsById[placement.id] = placement;
  }

  return placementsById;
}

function buildPlacement(id: PlacementId, placement: PlacementDocument): Placement {
  return {
    id,
    ...placement,
    items: [...placement.items].sort((a, b) => a.order - b.order),
  };
}

function getItems(placement: Placement | undefined): PlacementItem[] {
  return placement?.items ?? EMPTY_PLACEMENT_ITEMS;
}

function filterBySource<Source extends PlacementSource>(items: PlacementItem[], source: Source): PlacementItem<Source>[] {
  return items.filter(item => isPlacementItemSource(item, source));
}

function buildStableRefIds(items: PlacementItem[], source: PlacementSource): string[] {
  return getConsistentArray(filterBySource(items, source).map(item => item.ref.id));
}

// ============ Type Guards ==================================================== //

function isPlacementId(id: string): id is PlacementId {
  return PLACEMENT_ID_SET.has(id);
}

function isPlacementItemSource<Source extends PlacementSource>(item: PlacementItem, source: Source): item is PlacementItem<Source> {
  return item.ref.source === source;
}

// ============================================================================ //
// ============ v2 (placement document contract) ============================== //
// ============================================================================ //

export type PlacementsV2State = {
  placementsById: PlacementsV2ById;
  getPlacement: (id: PlacementIdV2) => PlacementV2 | undefined;
  getItemsBySource: <Source extends PlacementSourceV2>(id: PlacementIdV2, source: Source) => PlacementItemV2[];
};

export type PlacementResult<Hydrated> = {
  isLoading: boolean;
  items: Hydrated[];
  placement: PlacementV2 | undefined;
};

type PlacementsV2ById = Partial<Record<PlacementIdV2, PlacementV2>>;

type PlacementV2Document = Partial<PlacementV2>;
type PlacementV2DocumentSnapshot = {
  data: () => unknown;
  id: string;
};

// ============ v2 Constants =================================================== //

const isPlacementSourceV2 = oneOf<PlacementSourceV2>(Object.values(PLACEMENT_SOURCES));
const isPlacementTypeV2 = oneOf<PlacementTypeV2>(Object.values(PLACEMENT_TYPES));

// ============ v2 Query Store ================================================= //

export const usePlacementsV2Store = createQueryStore<PlacementsV2ById, never, PlacementsV2State>(
  {
    fetcher: fetchPlacementsV2,
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
        return getItemsV2(placement);
      },
    };
  },

  { storageKey: 'placementsStoreV2' }
);

export function selectPlacementItemsBySource<Source extends PlacementSourceV2>(
  state: ReturnType<typeof usePlacementsV2Store.getState>,
  placementId: PlacementIdV2,
  source: Source
): PlacementItemV2[] {
  return state.getItemsBySource(placementId, source);
}

export function isPlacementHydrating<Source extends PlacementSourceV2>(
  state: ReturnType<typeof usePlacementsV2Store.getState>,
  placementId: PlacementIdV2,
  source: Source
): boolean {
  const isInitialLoad = state.getStatus('isInitialLoad');
  const isIdleWithoutCachedPlacement =
    state.getStatus('isIdle') && state.getPlacement(placementId) === undefined && !state.getItemsBySource(placementId, source).length;

  return isInitialLoad || isIdleWithoutCachedPlacement;
}

// ============ v2 Fetcher ===================================================== //

async function fetchPlacementsV2(): Promise<PlacementsV2ById> {
  const db = getFirestore(getApp());
  const placementsRef = collection(db, 'placements');
  const q = query(placementsRef, where('version', '==', 2));

  const snap: FirebaseFirestoreTypes.QuerySnapshot<PlacementV2Document> = await getDocs<
    PlacementV2Document,
    FirebaseFirestoreTypes.DocumentData
  >(q);

  return buildPlacementsV2ById(snap.docs);
}

// ============ v2 Utilities =================================================== //

function buildPlacementsV2ById(placements: PlacementV2DocumentSnapshot[]): PlacementsV2ById {
  const placementsById: PlacementsV2ById = {};

  for (const doc of placements) {
    const placementDocument = doc.data();
    if (!isPlacementV2Document(doc.id, placementDocument)) continue;

    const placement = buildPlacementV2(doc.id, placementDocument);
    placementsById[placement.id] = placement;
  }

  return placementsById;
}

function buildPlacementV2(id: PlacementIdV2, placement: PlacementV2): PlacementV2 {
  return {
    ...placement,
    id,
    items: placement.items.filter(isPlacementItemV2),
  };
}

function getItemsV2(placement: PlacementV2 | undefined): PlacementItemV2[] {
  return placement?.items ?? [];
}

// ============ v2 Type Guards ================================================= //

// Contract: schema/placements-v2.schema.json
function isPlacementV2Document(id: string, placement: unknown): placement is PlacementV2 {
  if (typeof placement !== 'object' || placement === null) return false;

  const document = placement as Partial<PlacementV2>;

  return (
    isNonEmptyString(id) &&
    document.id === id &&
    document.version === 2 &&
    isPlacementRefPairV2(document.source, document.type) &&
    Array.isArray(document.items)
  );
}

function isPlacementItemV2(item: unknown): item is PlacementItemV2 {
  if (typeof item !== 'object' || item === null) return false;

  const id = (item as Partial<PlacementItemV2>).id;
  return isNonEmptyString(id);
}

function isPlacementRefPairV2(source: unknown, type: unknown): source is PlacementSourceV2 {
  if (!isPlacementSourceV2(source) || !isPlacementTypeV2(type)) return false;

  switch (source) {
    case 'hyperliquid':
      return type === 'perp';
    case 'polymarket':
      return type === 'prediction';
    case 'rainbow':
      return type === 'token';
  }
}

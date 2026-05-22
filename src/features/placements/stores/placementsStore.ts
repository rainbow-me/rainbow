import { getApp } from '@react-native-firebase/app';
import { collection, getDocs, getFirestore, query, where, type FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

import {
  type Placement,
  type PlacementId,
  type PlacementItem,
  type PlacementSource,
  type PlacementType,
} from '@/features/placements/types';
import { getConsistentArray } from '@/helpers/getConsistentArray';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';

// ============ Types ========================================================== //

export type PlacementsState = {
  placementsById: PlacementsById;
  getPlacement: (id: PlacementId) => Placement | undefined;
  getItemsBySource: <Source extends PlacementSource>(id: PlacementId, source: Source) => PlacementItem[];
  getRefIds: (id: PlacementId, filter: PlacementItemFilter) => string[];
  hasRefIds: (id: PlacementId, filter: PlacementItemFilter) => boolean;
  getAllRefIds: (filter: PlacementItemFilter) => string[];
};

export type PlacementsById = Record<PlacementId, Placement>;

type PlacementDocument = Partial<Placement>;
type PlacementItemFilter = {
  source?: PlacementSource;
  type?: PlacementType;
};
type PlacementDocumentSnapshot = {
  data: () => unknown;
  id: string;
};

// ============ Constants ====================================================== //

const EMPTY_PLACEMENT_ITEMS: PlacementItem[] = [];
const PLACEMENT_SOURCE_SET = new Set<PlacementSource>(['hyperliquid', 'polymarket', 'rainbow']);
const PLACEMENT_TYPE_SET = new Set<PlacementType>(['perp', 'prediction', 'token']);

// ============ Query Store ==================================================== //

export const usePlacementsStore = createQueryStore<PlacementsById, never, PlacementsState>(
  {
    fetcher: fetchPlacements,
    setData: ({ data, set }) => set({ placementsById: data }),
    staleTime: time.minutes(15),
    cacheTime: time.days(2),
  },

  (_, get) => ({
    placementsById: {},

    getPlacement: id => {
      return getCachedV2Placement(id, get().placementsById);
    },

    getItemsBySource: (id, source) => {
      const placement = getCachedV2Placement(id, get().placementsById);
      if (placement?.source !== source) return EMPTY_PLACEMENT_ITEMS;
      return getItems(placement);
    },

    getRefIds: (id, filter) => {
      const placement = getCachedV2Placement(id, get().placementsById);
      return buildStableRefIds(placement, filter);
    },

    hasRefIds: (id, filter) => {
      const placement = getCachedV2Placement(id, get().placementsById);
      return getItems(placement).some(item => isPlacementMatch(placement, item, filter));
    },

    getAllRefIds: filter => {
      const refIds: string[] = [];
      const placementsById = get().placementsById;

      for (const id of Object.keys(placementsById)) {
        const placement = getCachedV2Placement(id, placementsById);
        if (!placement || !isPlacementFilterMatch(placement, filter)) continue;

        for (const item of placement.items) {
          if (isPlacementItem(item)) refIds.push(item.id);
        }
      }
      return getConsistentArray(refIds);
    },
  }),

  { storageKey: 'placementsStore', version: 4 }
);

// ============ Fetcher ======================================================== //

export async function fetchPlacements(): Promise<PlacementsById> {
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

function getCachedV2Placement(id: PlacementId, placementsById: PlacementsById): Placement | undefined {
  const placement = placementsById[id];
  return isV2Placement(id, placement) ? placement : undefined;
}

function getItems(placement: Placement | undefined): PlacementItem[] {
  const items = placement?.items.filter(isPlacementItem) ?? EMPTY_PLACEMENT_ITEMS;
  return items.length ? items : EMPTY_PLACEMENT_ITEMS;
}

function buildStableRefIds(placement: Placement | undefined, filter: PlacementItemFilter): string[] {
  if (!placement || !isPlacementFilterMatch(placement, filter)) return [];
  return getConsistentArray(placement.items.filter(isPlacementItem).map(item => item.id));
}

function isPlacementMatch(placement: Placement | undefined, item: unknown, filter: PlacementItemFilter): item is PlacementItem {
  return isPlacementItem(item) && isPlacementFilterMatch(placement, filter);
}

function isPlacementFilterMatch(placement: Placement | undefined, filter: PlacementItemFilter): placement is Placement {
  if (!placement) return false;
  if (filter.source && placement.source !== filter.source) return false;
  if (filter.type && placement.type !== filter.type) return false;
  return true;
}

// ============ Type Guards ==================================================== //

function isPlacementDocument(id: string, placement: unknown): placement is Placement {
  if (typeof placement !== 'object' || placement === null) return false;

  const document = placement as Partial<Placement>;

  return (
    typeof id === 'string' &&
    id.length > 0 &&
    document.id === id &&
    document.version === 2 &&
    isPlacementRefPair(document.source, document.type) &&
    Array.isArray(document.items)
  );
}

function isV2Placement(id: PlacementId, placement: Placement | undefined): placement is Placement {
  return (
    placement?.id === id &&
    placement.version === 2 &&
    isPlacementRefPair(placement.source, placement.type) &&
    Array.isArray(placement.items)
  );
}

function isPlacementItem(item: unknown): item is PlacementItem {
  if (typeof item !== 'object' || item === null) return false;

  const id = (item as Partial<PlacementItem>).id;
  return typeof id === 'string' && id.length > 0;
}

function isPlacementSource(source: unknown): source is PlacementSource {
  return typeof source === 'string' && PLACEMENT_SOURCE_SET.has(source as PlacementSource);
}

function isPlacementType(type: unknown): type is PlacementType {
  return typeof type === 'string' && PLACEMENT_TYPE_SET.has(type as PlacementType);
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

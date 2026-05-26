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
  getAllRefIds: (filter: PlacementItemFilter) => string[];
};

type PlacementsById = Partial<Record<PlacementId, Placement>>;

type PlacementDocument = Partial<Placement>;
type PlacementItemFilter = {
  source?: PlacementSource;
  type?: PlacementType;
};
type PlacementDocumentSnapshot = {
  data: () => unknown;
  id: string;
};
type RefIdsCache = {
  placementsById: PlacementsById | null;
  resultsByFilterKey: Map<string, string[]>;
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
    keepPreviousData: true,
    staleTime: time.minutes(15),
    cacheTime: time.days(2),
  },

  (_, get) => {
    const refIdsCache: RefIdsCache = {
      placementsById: null,
      resultsByFilterKey: new Map(),
    };

    return {
      placementsById: {},

      getPlacement: id => {
        return get().placementsById[id];
      },

      getItemsBySource: (id, source) => {
        const placement = get().placementsById[id];
        if (placement?.source !== source) return EMPTY_PLACEMENT_ITEMS;
        return getItems(placement);
      },

      getAllRefIds: filter => {
        const placementsById = get().placementsById;
        const filterKey = getPlacementItemFilterKey(filter);
        if (refIdsCache.placementsById !== placementsById) {
          refIdsCache.placementsById = placementsById;
          refIdsCache.resultsByFilterKey.clear();
        }

        const cachedRefIds = refIdsCache.resultsByFilterKey.get(filterKey);
        if (cachedRefIds) return cachedRefIds;

        const refIds: string[] = [];
        for (const id of Object.keys(placementsById)) {
          const placement = placementsById[id];
          if (!placement || !isPlacementFilterMatch(placement, filter)) continue;

          for (const item of placement.items) {
            refIds.push(item.id);
          }
        }

        const result = getConsistentArray(refIds);
        refIdsCache.resultsByFilterKey.set(filterKey, result);
        return result;
      },
    };
  },

  { storageKey: 'placementsStore', version: 4 }
);

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
  const items = placement?.items ?? EMPTY_PLACEMENT_ITEMS;
  return items.length ? items : EMPTY_PLACEMENT_ITEMS;
}

function isPlacementFilterMatch(placement: Placement | undefined, filter: PlacementItemFilter): placement is Placement {
  if (!placement) return false;
  if (filter.source && placement.source !== filter.source) return false;
  if (filter.type && placement.type !== filter.type) return false;
  return true;
}

function getPlacementItemFilterKey(filter: PlacementItemFilter): string {
  return `${filter.source ?? '*'}:${filter.type ?? '*'}`;
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

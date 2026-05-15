import { getApp } from '@react-native-firebase/app';
import { collection, getDocs, getFirestore, query, where, type FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

import { PLACEMENT_IDS, PLACEMENT_IDS_BY_SURFACE, PLACEMENT_SURFACES } from '@/features/placements/constants';
import {
  type Placement,
  type PlacementCategory,
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
  getItemsBySource: <Source extends PlacementSource>(id: PlacementId, source: Source) => PlacementItem<Source>[];
  getRefIds: (id: PlacementId, filter: PlacementItemFilter) => string[];
  hasRefIds: (id: PlacementId, filter: PlacementItemFilter) => boolean;
  getAllRefIds: (filter: PlacementItemFilter) => string[];
  getCategories: (id: PlacementId) => PlacementCategory[];
};

type PlacementDocument = Partial<Placement>;
type PlacementsById = Partial<Record<PlacementId, Placement>>;
type PlacementItemFilter = {
  source?: PlacementSource;
  type?: PlacementType;
};
type PlacementDocumentSnapshot = {
  data: () => unknown;
  id: string;
};
type PartialPlacementItemRef = Partial<PlacementItem['ref']>;

// ============ Constants ====================================================== //

const EMPTY_PLACEMENT_ITEMS: PlacementItem[] = [];
const PLACEMENT_ID_LIST = Object.values(PLACEMENT_IDS);
const DISCOVER_PLACEMENT_ID_SET = new Set<string>(PLACEMENT_IDS_BY_SURFACE[PLACEMENT_SURFACES.DISCOVER]);
const PLACEMENT_SOURCE_SET = new Set<PlacementSource>(['hyperliquid', 'polymarket', 'rainbow']);
const PLACEMENT_TYPE_SET = new Set<PlacementType>(['perp', 'prediction', 'token']);

// ============ Query Store ==================================================== //

export const usePlacementsStore = createQueryStore<PlacementsById, never, PlacementsState>(
  {
    fetcher: fetchPlacements,
    setData: ({ data, set }) =>
      set(state => {
        let placementsById = data;

        for (const id of PLACEMENT_ID_LIST) {
          const cachedPlacement = state.placementsById[id];
          if (placementsById[id] !== undefined || cachedPlacement === undefined) continue;

          if (placementsById === data) placementsById = { ...data };
          placementsById[id] = cachedPlacement;
        }

        return { placementsById };
      }),
    staleTime: time.minutes(15),
    cacheTime: time.days(2),
  },

  (_, get) => ({
    placementsById: {},

    getPlacement: id => {
      return getCachedV2DiscoverPlacement(id, get().placementsById);
    },

    getItemsBySource: (id, source) => {
      const placement = getCachedV2DiscoverPlacement(id, get().placementsById);
      return filterBySource(getItems(placement), source);
    },

    getRefIds: (id, filter) => {
      const placement = getCachedV2DiscoverPlacement(id, get().placementsById);
      return buildStableRefIds(getItems(placement), filter);
    },

    hasRefIds: (id, filter) => {
      const placement = getCachedV2DiscoverPlacement(id, get().placementsById);
      return getItems(placement).some(item => isPlacementItemMatch(item, filter));
    },

    getAllRefIds: filter => {
      const refIds: string[] = [];
      const placementsById = get().placementsById;

      for (const id of Object.keys(placementsById)) {
        if (!isPlacementId(id)) continue;

        const v2Placement = getCachedV2DiscoverPlacement(id, placementsById);
        if (!v2Placement) continue;

        for (const item of getItems(v2Placement)) {
          const refId = getPlacementItemRefId(item, filter);
          if (refId) refIds.push(refId);
        }
      }
      return getConsistentArray(refIds);
    },

    getCategories: id => {
      const placement = getCachedV2DiscoverPlacement(id, get().placementsById);
      return getSortedEnabledCategories(placement?.categories);
    },
  }),

  { storageKey: 'placementsStore' }
);

// ============ Fetcher ======================================================== //

export async function fetchPlacements(): Promise<PlacementsById> {
  const db = getFirestore(getApp());
  const placementsRef = collection(db, 'placements');
  const q = query(
    placementsRef,
    where('enabled', '==', true),
    where('version', '==', 2),
    where('surfaces', 'array-contains', PLACEMENT_SURFACES.DISCOVER)
  );

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

    const placement = buildPlacement(doc.id as PlacementId, placementDocument);
    placementsById[placement.id] = placement;
  }

  return placementsById;
}

function buildPlacement(id: PlacementId, placement: Placement): Placement {
  return {
    ...placement,
    id,
    items: placement.items.filter(isPlacementItemDocument).sort((a, b) => a.order - b.order),
  };
}

function getCachedV2DiscoverPlacement(id: PlacementId, placementsById: PlacementsById): Placement | undefined {
  if (!isPlacementId(id)) return undefined;

  const placement = placementsById[id];
  // Persisted cache and direct setState calls can hold stale v1 or malformed docs even though live fetches are v2-filtered.
  return isV2DiscoverPlacement(id, placement) ? placement : undefined;
}

function getItems(placement: Placement | undefined): PlacementItem[] {
  return placement?.items ?? EMPTY_PLACEMENT_ITEMS;
}

function filterBySource<Source extends PlacementSource>(items: PlacementItem[], source: Source): PlacementItem<Source>[] {
  return items.filter(item => isPlacementItemSource(item, source));
}

function buildStableRefIds(items: PlacementItem[], filter: PlacementItemFilter): string[] {
  const refIds: string[] = [];
  for (const item of items) {
    const refId = getPlacementItemRefId(item, filter);
    if (refId) refIds.push(refId);
  }
  return getConsistentArray(refIds);
}

function getSortedEnabledCategories(categories: PlacementCategory[] | undefined): PlacementCategory[] {
  if (!categories?.length) return [];
  return categories.filter(isEnabledPlacementCategory).sort((a, b) => a.order - b.order);
}

// ============ Type Guards ==================================================== //

function isPlacementId(id: string): id is PlacementId {
  return DISCOVER_PLACEMENT_ID_SET.has(id);
}

function isPlacementDocument(id: string, placement: unknown): placement is Placement {
  if (typeof placement !== 'object' || placement === null) return false;

  const document = placement as Partial<Placement>;

  return (
    isPlacementId(id) &&
    document.id === id &&
    document.enabled === true &&
    document.version === 2 &&
    Array.isArray(document.surfaces) &&
    document.surfaces.includes(PLACEMENT_SURFACES.DISCOVER) &&
    Array.isArray(document.items)
  );
}

function isV2DiscoverPlacement(id: PlacementId, placement: Placement | undefined): placement is Placement {
  return (
    placement?.id === id &&
    placement.enabled === true &&
    placement.version === 2 &&
    placement.surfaces?.includes(PLACEMENT_SURFACES.DISCOVER) === true &&
    Array.isArray(placement.items)
  );
}

function isPlacementItemSource<Source extends PlacementSource>(item: unknown, source: Source): item is PlacementItem<Source> {
  const ref = getPlacementItemRef(item);
  return ref?.source === source && isPlacementRefPair(ref.source, ref.type) && typeof ref.id === 'string' && ref.id.length > 0;
}

function isPlacementItemDocument(item: unknown): item is PlacementItem {
  const ref = getPlacementItemRef(item);
  return (
    typeof item === 'object' &&
    item !== null &&
    typeof (item as Partial<PlacementItem>).order === 'number' &&
    Number.isFinite((item as Partial<PlacementItem>).order) &&
    isPlacementRefPair(ref?.source, ref?.type) &&
    typeof ref.id === 'string' &&
    ref.id.length > 0
  );
}

function isPlacementItemMatch(item: unknown, filter: PlacementItemFilter): boolean {
  return getPlacementItemRefId(item, filter) !== undefined;
}

function isEnabledPlacementCategory(category: unknown): category is PlacementCategory {
  if (typeof category !== 'object' || category === null) return false;

  const placementCategory = category as Partial<PlacementCategory>;

  return (
    typeof placementCategory.order === 'number' &&
    Number.isFinite(placementCategory.order) &&
    typeof placementCategory.category === 'string' &&
    placementCategory.category.length > 0 &&
    placementCategory.enabled === true
  );
}

function getPlacementItemRefId(item: unknown, filter: PlacementItemFilter): string | undefined {
  const ref = getPlacementItemRef(item);
  if (typeof ref?.id !== 'string' || !ref.id) return undefined;
  if (!isPlacementRefPair(ref.source, ref.type)) return undefined;
  if (filter.source && ref.source !== filter.source) return undefined;
  if (filter.type && ref.type !== filter.type) return undefined;
  return ref.id;
}

function getPlacementItemRef(item: unknown): PartialPlacementItemRef | undefined {
  if (typeof item !== 'object' || item === null) return undefined;

  const ref = (item as Partial<PlacementItem>).ref;
  return typeof ref === 'object' && ref !== null ? ref : undefined;
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

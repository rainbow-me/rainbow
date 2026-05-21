import { getApp } from '@react-native-firebase/app';
import { collection, getDocs, getFirestore, orderBy, query, where, type FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { createQueryStore } from '@storesjs/stores';

import { PLACEMENT_IDS } from '@/features/placements/constants';
import { type Placement, type PlacementId, type PlacementItem, type PlacementSource } from '@/features/placements/types';
import { getConsistentArray } from '@/helpers/getConsistentArray';
import { time } from '@/utils/time';

// ============ Types ========================================================== //

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

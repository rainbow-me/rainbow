import { getApp } from '@react-native-firebase/app';
import { collection, documentId, getDocs, getFirestore, query, where } from '@react-native-firebase/firestore';

import { placementSchema } from '@/features/placements/schema/placementContract';
import { getSurfaceStore } from '@/features/placements/surfaces/stores/surfaceStore';
import { type SurfaceDocument } from '@/features/placements/surfaces/types';
import { type Placement, type PlacementId, type PlacementSource } from '@/features/placements/types';
import { isEnabledSchedule } from '@/features/placements/utils/scheduling';
import { time } from '@/framework/core/utils/time';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { deepEqual } from '@/worklets/comparisons';

// ============ Types ========================================================== //

type PlacementsState = {
  placementsById: PlacementsById;
  getPlacement: (id: PlacementId) => Placement | undefined;
};

export type DiscoverPlacementResult<Hydrated> = {
  isLoading: boolean;
  items: Hydrated[];
  placement: Placement | undefined;
};

type PlacementsById = Partial<Record<PlacementId, Placement>>;

type PlacementsParams = {
  placementIds: PlacementId[];
};
type PlacementDocumentSnapshot = {
  data: () => unknown;
  id: string;
};
type PlacementQuerySnapshot = {
  docs: PlacementDocumentSnapshot[];
};

const PLACEMENT_FETCH_CHUNK_SIZE = 30;

// ============ Query Store ==================================================== //

const useDiscoverSurfaceStore = getSurfaceStore('discover');

const useDiscoverSurfacePlacementIds = createDerivedStore<{ placementIds: PlacementId[] }>(
  $ => {
    const surface = $(useDiscoverSurfaceStore, state => state.getData());
    return { placementIds: getDiscoverSurfacePlacementIds(surface, Date.now()) };
  },
  { equalityFn: deepEqual, fastMode: true }
);

export const useDiscoverPlacementsStore = createQueryStore<PlacementsById, PlacementsParams, PlacementsState>(
  {
    fetcher: fetchPlacements,
    enabled: $ => $(useDiscoverSurfacePlacementIds, state => state.placementIds.length > 0),
    params: {
      placementIds: $ => $(useDiscoverSurfacePlacementIds, state => state.placementIds),
    },
    setData: ({ data, set }) => set({ placementsById: data }),
    keepPreviousData: true,
    staleTime: time.seconds(5),
    cacheTime: time.days(2),
  },

  (_, get) => {
    return {
      placementsById: {},

      getPlacement: id => {
        return get().placementsById[id];
      },
    };
  },

  { storageKey: 'placementsStore', version: 2 }
);

export function selectDiscoverPlacementBySource<Source extends PlacementSource>(
  state: ReturnType<typeof useDiscoverPlacementsStore.getState>,
  placementId: PlacementId,
  source: Source
): Extract<Placement, { source: Source }> | undefined {
  const placement = state.getPlacement(placementId);
  if (placement?.source !== source) return undefined;
  return placement as Extract<Placement, { source: Source }>;
}

export function isDiscoverPlacementHydrating<Source extends PlacementSource>(
  state: ReturnType<typeof useDiscoverPlacementsStore.getState>,
  placementId: PlacementId,
  source?: Source
): boolean {
  const placement = source ? selectDiscoverPlacementBySource(state, placementId, source) : state.getPlacement(placementId);
  if (placement !== undefined) return false;

  return state.getStatus('isInitialLoad') || state.getStatus('isIdle') || state.getStatus('isLoading');
}

// ============ Fetcher ======================================================== //

async function fetchPlacements({ placementIds }: PlacementsParams): Promise<PlacementsById> {
  if (!placementIds.length) return {};

  const db = getFirestore(getApp());
  const placementCollection = collection(db, 'placements');
  const placementChunks = chunk([...new Set(placementIds)], PLACEMENT_FETCH_CHUNK_SIZE);
  const placementSnapshots: PlacementQuerySnapshot[] = await Promise.all(
    placementChunks.map(ids => getDocs(query(placementCollection, where(documentId(), 'in', ids))))
  );
  const placementDocs = placementSnapshots.flatMap(snapshot => snapshot.docs);

  return buildPlacementsById(placementDocs);
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
  const parsed = placementSchema.safeParse(placement);
  if (!parsed.success || parsed.data.id !== id) return undefined;

  return parsed.data;
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function getDiscoverSurfacePlacementIds(surface: SurfaceDocument | null | undefined, now: number): PlacementId[] {
  if (!surface) return [];
  if (!isEnabledSchedule(surface.enabled, now)) return [];

  const placementIds = new Set<PlacementId>();

  for (const item of surface.items) {
    if (!isEnabledSchedule(item.enabled, now)) continue;

    for (const section of item.items) {
      if (!isEnabledSchedule(section.enabled, now)) continue;
      if (!section.placement) continue;
      placementIds.add(section.placement);
    }
  }

  return placementIds.size ? [...placementIds].sort() : [];
}

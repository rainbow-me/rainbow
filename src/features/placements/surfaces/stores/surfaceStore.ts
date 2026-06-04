import { getApp } from '@react-native-firebase/app';
import { doc, getDoc, getFirestore } from '@react-native-firebase/firestore';

import { type SurfaceDocument, surfaceDocumentSchema } from '@/features/placements/surfaces/types';
import { time } from '@/framework/core/utils/time';
import { createQueryStore } from '@/state/internal/createQueryStore';

type SurfaceStore = ReturnType<typeof createSurfaceStore>;

const storesBySurfaceId = new Map<string, SurfaceStore>();

export function getSurfaceStore(surfaceId: string): SurfaceStore {
  let store = storesBySurfaceId.get(surfaceId);
  if (!store) {
    store = createSurfaceStore(surfaceId);
    storesBySurfaceId.set(surfaceId, store);
  }
  return store;
}

function createSurfaceStore(surfaceId: string) {
  return createQueryStore<SurfaceDocument | undefined>(
    {
      fetcher: () => fetchSurface(surfaceId),
      staleTime: time.minutes(10),
      cacheTime: time.minutes(15),
    },
    { storageKey: `surfaceStore:${surfaceId}`, version: 5 }
  );
}

async function fetchSurface(surfaceId: string): Promise<SurfaceDocument | undefined> {
  const db = getFirestore(getApp());
  const surfaceRef = doc(db, 'surfaces', surfaceId);
  const snap = await getDoc(surfaceRef);
  const surface = snap.data();

  return parseSurfaceDocument(surfaceId, surface);
}

function parseSurfaceDocument(surfaceId: string, surface: unknown): SurfaceDocument | undefined {
  const parsed = surfaceDocumentSchema.safeParse(surface);
  if (!parsed.success || parsed.data.id !== surfaceId) return undefined;

  return parsed.data;
}

import { getApp } from '@react-native-firebase/app';
import { doc, getDoc, getFirestore } from '@react-native-firebase/firestore';

import { parseSurfaceDocument } from '@/features/placements/surfaces/schema/surfaceContract';
import { type SurfaceDocument } from '@/features/placements/surfaces/types';
import { time } from '@/framework/core/utils/time';
import { createQueryStore } from '@/state/internal/createQueryStore';

export type SurfaceStore = ReturnType<typeof createSurfaceStore>;

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
  return createQueryStore<SurfaceDocument>(
    {
      fetcher: async () => fetchSurface(surfaceId),
      staleTime: time.seconds(5),
      cacheTime: time.minutes(15),
    },
    { storageKey: `surfaceStore:${surfaceId}`, version: 6 }
  );
}

async function fetchSurface(surfaceId: string): Promise<SurfaceDocument> {
  const db = getFirestore(getApp());
  const surfaceRef = doc(db, 'surfaces', surfaceId);
  const snap = await getDoc(surfaceRef);
  const surface = snap.data();

  return parseSurfaceDocument(surfaceId, surface);
}

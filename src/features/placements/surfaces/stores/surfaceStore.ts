import { getApp } from '@react-native-firebase/app';
import { doc, getDoc, getFirestore } from '@react-native-firebase/firestore';

import { DESTINATION_ROOT_VALUES, DISPLAY_VALUES } from '@/features/placements/surfaces/constants';
import { type DestinationRoot, type Display, type Surface } from '@/features/placements/surfaces/types';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';

type SurfaceStore = ReturnType<typeof createSurfaceStore>;

const storesBySurfaceId = new Map<string, SurfaceStore>();
const SURFACE_ID_PATTERN = /^[a-z][a-z0-9_]*$/;

export function getSurfaceStore(surfaceId: string): SurfaceStore {
  let store = storesBySurfaceId.get(surfaceId);
  if (!store) {
    store = createSurfaceStore(surfaceId);
    storesBySurfaceId.set(surfaceId, store);
  }
  return store;
}

function createSurfaceStore(surfaceId: string) {
  return createQueryStore<Surface | undefined>(
    {
      fetcher: () => fetchSurface(surfaceId),
      staleTime: time.minutes(10),
      cacheTime: time.days(2),
    },
    { storageKey: `surfaceStore:${surfaceId}`, version: 4 }
  );
}

async function fetchSurface(surfaceId: string): Promise<Surface | undefined> {
  const db = getFirestore(getApp());
  const surfaceRef = doc(db, 'surfaces', surfaceId);
  const snap = await getDoc(surfaceRef);
  const surface = snap.data();

  return isSurfaceDocument(surfaceId, surface) ? surface : undefined;
}

function isSurfaceDocument(surfaceId: string, surface: unknown): surface is Surface {
  return isSurfaceNode(surface) && 'items' in surface && surface.id === surfaceId && surface.version === 1;
}

function isSurfaceNode(surface: unknown): surface is Surface {
  if (!isSurfaceBase(surface)) return false;

  const document = surface as Partial<Surface>;

  if ('items' in document) {
    return Array.isArray(document.items) && document.items.every(isSurfaceNode);
  }

  if (!('placement' in document) || !('display' in document)) return false;

  return (
    typeof document.placement === 'string' &&
    isSurfaceDisplay(document.display) &&
    isSurfaceDestination(document.destination) &&
    (document.limit === undefined || (Number.isInteger(document.limit) && document.limit > 0))
  );
}

function isSurfaceBase(surface: unknown): surface is Partial<Surface> {
  if (typeof surface !== 'object' || surface === null) return false;

  const document = surface as Partial<Surface>;

  return (
    isSurfaceId(document.id) &&
    isSurfaceEnabled(document.enabled) &&
    (document.label === undefined || isNonEmptyString(document.label)) &&
    (document.updatedAt === undefined || isValidDateString(document.updatedAt))
  );
}

function isSurfaceEnabled(enabled: unknown): boolean {
  if (typeof enabled === 'boolean') return true;
  if (typeof enabled !== 'object' || enabled === null) return false;

  const schedule = enabled as { endsAt?: unknown; startsAt?: unknown };
  return (
    (schedule.startsAt !== undefined || schedule.endsAt !== undefined) &&
    (schedule.startsAt === undefined || isValidDateString(schedule.startsAt)) &&
    (schedule.endsAt === undefined || isValidDateString(schedule.endsAt))
  );
}

function isSurfaceDestination(destination: unknown): boolean {
  if (destination === null) return true;
  if (!Array.isArray(destination) || destination.length === 0) return false;

  return isDestinationRoot(destination[0]) && destination.every(isNonEmptyString);
}

function isSurfaceDisplay(display: unknown): display is Display {
  return typeof display === 'string' && DISPLAY_VALUES.includes(display);
}

function isSurfaceId(value: unknown): value is string {
  return typeof value === 'string' && SURFACE_ID_PATTERN.test(value);
}

function isDestinationRoot(root: unknown): root is DestinationRoot {
  return typeof root === 'string' && DESTINATION_ROOT_VALUES.includes(root as DestinationRoot);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isValidDateString(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

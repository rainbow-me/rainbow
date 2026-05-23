import { getApp } from '@react-native-firebase/app';
import { doc, getDoc, getFirestore } from '@react-native-firebase/firestore';

import { DESTINATION_ROOT_VALUES, DISPLAY_VALUES } from '@/features/placements/surfaces/constants';
import { type DestinationRoot, type Display, type Surface } from '@/features/placements/surfaces/types';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';

type SurfaceStore = ReturnType<typeof createSurfaceStore>;

const storesBySurfaceId = new Map<string, SurfaceStore>();
const SURFACE_ID_PATTERN = /^[a-z][a-z0-9_]*$/;
const SURFACE_BASE_KEYS = ['id', 'label', 'enabled', 'updatedAt'] as const;
const SURFACE_CONTAINER_KEYS = [...SURFACE_BASE_KEYS, 'items'] as const;
const SURFACE_DOCUMENT_KEYS = [...SURFACE_CONTAINER_KEYS, 'version'] as const;
const SURFACE_ENABLED_KEYS = ['startsAt', 'endsAt'] as const;
const SURFACE_LEAF_KEYS = [...SURFACE_BASE_KEYS, 'placement', 'display', 'destination', 'limit'] as const;

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
      cacheTime: time.minutes(15),
    },
    { storageKey: `surfaceStore:${surfaceId}`, version: 5 }
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
  if (!isSurfaceBase(surface, { labelRequired: false })) return false;

  const document = surface as Partial<Surface>;
  return (
    hasOnlyKeys(document, SURFACE_DOCUMENT_KEYS) &&
    Array.isArray(document.items) &&
    document.items.every(isSurfaceNode) &&
    document.id === surfaceId &&
    document.version === 1
  );
}

function isSurfaceNode(surface: unknown): surface is Surface {
  if (!isSurfaceBase(surface, { labelRequired: true })) return false;

  const document = surface as Partial<Surface>;

  if ('items' in document) {
    return hasOnlyKeys(document, SURFACE_CONTAINER_KEYS) && Array.isArray(document.items) && document.items.every(isSurfaceNode);
  }

  if (!hasOnlyKeys(document, SURFACE_LEAF_KEYS) || !('display' in document)) return false;

  return (
    (document.placement === undefined || typeof document.placement === 'string' || document.placement === null) &&
    isSurfaceDisplay(document.display) &&
    isSurfaceDestination(document.destination) &&
    (document.limit === undefined || (Number.isInteger(document.limit) && document.limit > 0))
  );
}

function isSurfaceBase(surface: unknown, { labelRequired }: { labelRequired: boolean }): surface is Partial<Surface> {
  if (typeof surface !== 'object' || surface === null) return false;

  const document = surface as Partial<Surface>;

  return (
    isSurfaceId(document.id) &&
    isSurfaceEnabled(document.enabled) &&
    (!labelRequired || document.label !== undefined) &&
    (document.label === undefined || isNonEmptyString(document.label)) &&
    (document.updatedAt === undefined || isValidDateString(document.updatedAt))
  );
}

function isSurfaceEnabled(enabled: unknown): boolean {
  if (typeof enabled === 'boolean') return true;
  if (typeof enabled !== 'object' || enabled === null) return false;

  const schedule = enabled as { endsAt?: unknown; startsAt?: unknown };
  return (
    hasOnlyKeys(schedule, SURFACE_ENABLED_KEYS) &&
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
  return typeof display === 'string' && (DISPLAY_VALUES as readonly string[]).includes(display);
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

function hasOnlyKeys(value: object, allowedKeys: readonly string[]): boolean {
  return Object.keys(value).every(key => allowedKeys.includes(key));
}

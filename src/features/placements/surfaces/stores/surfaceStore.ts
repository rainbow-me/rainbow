import { getApp } from '@react-native-firebase/app';
import { doc, getDoc, getFirestore } from '@react-native-firebase/firestore';

import { isNonEmptyString, isValidDateString, oneOf } from '@/features/placements/decoders';
import { DESTINATION_ROOT_VALUES, DISPLAY_VALUES } from '@/features/placements/surfaces/constants';
import {
  type DestinationRoot,
  type Display,
  type SurfaceDocument,
  type SurfaceNode,
  type SurfaceNodeBase,
} from '@/features/placements/surfaces/types';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';

type SurfaceStore = ReturnType<typeof createSurfaceStore>;

const storesBySurfaceId = new Map<string, SurfaceStore>();
const SURFACE_ID_PATTERN = /^[a-z][a-z0-9_]*$/;
const isDestinationRoot = oneOf<DestinationRoot>(DESTINATION_ROOT_VALUES);
const isSurfaceDisplay = oneOf<Display>(DISPLAY_VALUES);

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

  return isSurfaceDocument(surfaceId, surface) ? surface : undefined;
}

function isSurfaceDocument(surfaceId: string, surface: unknown): surface is SurfaceDocument {
  if (!isSurfaceBase(surface, { labelRequired: false })) return false;

  const document = surface as Partial<SurfaceDocument>;
  return Array.isArray(document.items) && document.items.every(isSurfaceNode) && document.id === surfaceId && document.version === 1;
}

function isSurfaceNode(surface: unknown): surface is SurfaceNode {
  if (!isSurfaceBase(surface, { labelRequired: true })) return false;

  const document = surface as Partial<SurfaceNode>;

  if ('items' in document) {
    return Array.isArray(document.items) && document.items.every(isSurfaceNode);
  }

  if (!('display' in document)) return false;

  return (
    (document.placement === undefined || typeof document.placement === 'string' || document.placement === null) &&
    isSurfaceDisplay(document.display) &&
    isSurfaceDestination(document.destination) &&
    (document.limit === undefined || (Number.isInteger(document.limit) && document.limit > 0))
  );
}

function isSurfaceBase(surface: unknown, { labelRequired }: { labelRequired: boolean }): surface is Partial<SurfaceNodeBase> {
  if (typeof surface !== 'object' || surface === null) return false;

  const document = surface as Partial<SurfaceNodeBase>;

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

function isSurfaceId(value: unknown): value is string {
  return typeof value === 'string' && SURFACE_ID_PATTERN.test(value);
}

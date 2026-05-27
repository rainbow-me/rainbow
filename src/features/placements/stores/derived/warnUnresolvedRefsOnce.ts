import { type PlacementId } from '@/features/placements/types';
import { logger } from '@/logger';

const lastUnresolvedKeyByPlacement = new Map<string, string>();

export function warnUnresolvedRefsOnce({
  diagnosticKey,
  message,
  metadata,
  placementId,
  source,
}: {
  diagnosticKey: string;
  message: string;
  metadata: Record<string, unknown>;
  placementId: PlacementId;
  source: string;
}): void {
  const warningKey = `${source}:${placementId}`;
  if (lastUnresolvedKeyByPlacement.get(warningKey) === diagnosticKey) return;

  lastUnresolvedKeyByPlacement.set(warningKey, diagnosticKey);
  logger.warn(message, metadata);
}

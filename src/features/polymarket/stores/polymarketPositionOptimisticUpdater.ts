import { type Address } from 'viem';

import { type PolymarketPosition, type PolymarketPositionsByAsset } from '@/features/polymarket/types';
import { greaterThanOrEqualTo } from '@/helpers/utilities';
import { createOptimisticUpdater, type OptimisticUpdate } from '@/state/internal/utils/createOptimisticUpdater';

// ============ Types ========================================================== //

type PositionChange = {
  apply: (position: PolymarketPosition | undefined) => PolymarketPosition | undefined;
  canConfirmFromBackend: boolean;
  operationId: number;
};

type DiscardPositionChangeParams = {
  asset: string;
  operationId: number;
  positions: PolymarketPositionsByAsset;
  proxyAddress: Address;
};

type ApplyPositionChangeParams = DiscardPositionChangeParams & Pick<PositionChange, 'apply'>;

type OptimisticPositionUpdate = OptimisticUpdate<PolymarketPositionsByAsset, string> & {
  baselinePosition: PolymarketPosition | undefined;
  changes: readonly PositionChange[];
};

// ============ Factory ======================================================== //

/** Tracks accepted position changes while Polymarket's indexed positions API catches up. */
export function createPolymarketPositionOptimisticUpdater(conflictWindow: number) {
  const updates = createOptimisticUpdater<Address, string, PolymarketPositionsByAsset, OptimisticPositionUpdate>(conflictWindow);

  function track({
    apply,
    asset,
    canConfirmFromBackend = true,
    operationId,
    positions,
    proxyAddress,
  }: ApplyPositionChangeParams & { canConfirmFromBackend?: boolean }): PolymarketPositionsByAsset {
    const previousUpdate = updates.getUpdate(proxyAddress, asset);
    const baselinePosition = previousUpdate ? previousUpdate.baselinePosition : positions[asset];
    const changes = previousUpdate?.changes.filter(change => change.operationId !== operationId) ?? [];
    changes.push({ apply, canConfirmFromBackend, operationId });

    const expectedPosition = applyChanges(baselinePosition, changes);

    updates.track(proxyAddress, buildPositionUpdate({ asset, baselinePosition, changes, expectedPosition }));
    return replacePosition(positions, asset, expectedPosition);
  }

  function accept(params: ApplyPositionChangeParams): PolymarketPositionsByAsset | null {
    const previousUpdate = updates.getUpdate(params.proxyAddress, params.asset);
    if (!previousUpdate?.changes.some(change => change.operationId === params.operationId)) return null;

    return track({ ...params, canConfirmFromBackend: true });
  }

  function amend({ apply, asset, operationId, positions, proxyAddress }: ApplyPositionChangeParams): PolymarketPositionsByAsset | null {
    const previousUpdate = updates.getUpdate(proxyAddress, asset);
    if (!previousUpdate?.changes.some(change => change.operationId === operationId)) return null;

    const changes = previousUpdate.changes.map(change => (change.operationId === operationId ? { ...change, apply } : change));
    const baselinePosition = previousUpdate.baselinePosition;
    const expectedPosition = applyChanges(baselinePosition, changes);
    updates.track(proxyAddress, buildPositionUpdate({ asset, baselinePosition, changes, expectedPosition }));
    return replacePosition(positions, asset, expectedPosition);
  }

  function discard({ asset, operationId, positions, proxyAddress }: DiscardPositionChangeParams): PolymarketPositionsByAsset | null {
    const previousUpdate = updates.getUpdate(proxyAddress, asset);
    if (!previousUpdate?.changes.some(change => change.operationId === operationId)) return null;

    const changes = previousUpdate.changes.filter(change => change.operationId !== operationId);
    const expectedPosition = applyChanges(previousUpdate.baselinePosition, changes);

    if (changes.length) {
      updates.track(
        proxyAddress,
        buildPositionUpdate({
          asset,
          baselinePosition: previousUpdate.baselinePosition,
          changes,
          expectedPosition,
        })
      );
    } else {
      updates.discard(proxyAddress, asset);
    }

    return replacePosition(positions, asset, expectedPosition);
  }

  return {
    accept,
    amend,
    discard,
    mergeBackendPositions: updates.mergeBackendData,
    track,
  };
}

// ============ Helpers ======================================================== //

function buildPositionUpdate({
  asset,
  baselinePosition,
  changes,
  expectedPosition,
}: {
  asset: string;
  baselinePosition: PolymarketPosition | undefined;
  changes: readonly PositionChange[];
  expectedPosition: PolymarketPosition | undefined;
}): OptimisticPositionUpdate {
  const canConfirmFromBackend = changes.every(change => change.canConfirmFromBackend);

  return {
    apply: positions => replacePosition(positions, asset, expectedPosition),
    baselinePosition,
    changes,
    id: asset,
    shouldIgnoreBackend: backendPositions => {
      if (!canConfirmFromBackend || !expectedPosition) return true;
      const backendPosition = backendPositions[asset];
      return !backendPosition || !isBackendPositionCaughtUp(backendPosition, expectedPosition);
    },
  };
}

function applyChanges(
  baselinePosition: PolymarketPosition | undefined,
  changes: readonly PositionChange[]
): PolymarketPosition | undefined {
  return changes.reduce<PolymarketPosition | undefined>((position, change) => change.apply(position), baselinePosition);
}

function isBackendPositionCaughtUp(backendPosition: PolymarketPosition, position: PolymarketPosition): boolean {
  return greaterThanOrEqualTo(backendPosition.size, position.size);
}

function replacePosition(
  positions: PolymarketPositionsByAsset,
  asset: string,
  position: PolymarketPosition | undefined
): PolymarketPositionsByAsset {
  if (positions[asset] === position) return positions;

  const nextPositions = { ...positions };
  if (position) nextPositions[asset] = position;
  else delete nextPositions[asset];

  return nextPositions;
}

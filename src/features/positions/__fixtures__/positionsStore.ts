import { vi } from 'vitest';

import { appSettingsActions } from '@/features/settings/data/appSettingsStore';
import { useWalletsStore } from '@/state/wallets/walletsStore';

import { usePositionsStore } from '../stores/positionsStore';
import { FIXTURE_PARAMS, FIXTURE_WALLET_ADDRESS } from './ListPositions';
import { setPositionValueFilter } from './positionFilters';

/** Prepares real account and positions stores for balance cases without value filtering. */
export function preparePositionsStore(): void {
  setPositionValueFilter(false);
  useWalletsStore.setState({ accountAddress: FIXTURE_WALLET_ADDRESS });
  appSettingsActions.setCurrency(FIXTURE_PARAMS.currency);
  usePositionsStore.setState({ queryCache: {}, queryKey: '' });
}

vi.mock('@/state/wallets/walletsStore', async () => {
  const { createBaseStore } = await import('@storesjs/stores');
  return { useWalletsStore: createBaseStore(() => ({ accountAddress: '' })) };
});

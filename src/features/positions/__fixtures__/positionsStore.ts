import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';

import { usePositionsStore } from '../stores/positionsStore';
import { FIXTURE_PARAMS } from './ListPositions';
import { setPositionValueFilter } from './positionFilters';

/** Prepares real account and positions stores for balance cases without value filtering. */
export function preparePositionsStore(): void {
  setPositionValueFilter(false);
  userAssetsStoreManager.setState({ address: FIXTURE_PARAMS.address, currency: FIXTURE_PARAMS.currency });
  usePositionsStore.setState({ queryCache: {}, queryKey: '' });
}

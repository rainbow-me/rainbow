import { UniqueId } from '@/__swaps__/types/assets';
import { Migration, MigrationName } from '../types';
import { swapsStore } from '@/state/swaps/swapsStore';
import { RecentSwap } from '@/__swaps__/types/swap';
import { ChainId } from '@/__swaps__/types/chains';

export function removeDuplicateRecentSwaps(): Migration {
  return {
    name: MigrationName.removeDuplicateRecentSwaps,
    async migrate() {
      const { recentSwaps } = swapsStore.getState();
      const updatedRecentSwaps = new Map<ChainId, RecentSwap[]>();

      for (const [chainId] of recentSwaps) {
        const uniqueSwaps = new Map<UniqueId, RecentSwap>();
        const sortedSwaps = swapsStore.getState().getRecentSwapsByChain(chainId);

        for (const swap of sortedSwaps) {
          if (!uniqueSwaps.has(swap.uniqueId)) {
            uniqueSwaps.set(swap.uniqueId, swap);
          }
        }

        updatedRecentSwaps.set(chainId, Array.from(uniqueSwaps.values()));
      }

      swapsStore.setState({ recentSwaps: updatedRecentSwaps });
    },
  };
}

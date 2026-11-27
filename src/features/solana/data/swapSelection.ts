import { createBaseStore } from '@storesjs/stores';

import { type SolanaSwapAsset, type SwapAsset } from '@/features/solana/core/swap';
import { useSolanaBalancesAddress } from '@/features/solana/data/solanaBalancesStore';
import { useWalletsStore } from '@/state/wallets/walletsStore';

export type SolanaSwapSelection = {
  address: string;
  accountKey: string;
  inputAsset: SwapAsset | null;
  outputAsset: SolanaSwapAsset;
  amount: string;
};

// Screen-only state: never persist a quote or a previous account's selection.
export const useSolanaSwapSelection = createBaseStore<{ selection: SolanaSwapSelection | null }>(() => ({ selection: null }));

export function selectSolanaSwap(selection: Omit<SolanaSwapSelection, 'address' | 'accountKey'>): void {
  const address = useSolanaBalancesAddress.getState();
  const wallet = useWalletsStore.getState();
  if (address)
    useSolanaSwapSelection.setState({
      selection: { ...selection, address, accountKey: `${wallet.selected?.id}:${wallet.accountAddress.toLowerCase()}` },
    });
}

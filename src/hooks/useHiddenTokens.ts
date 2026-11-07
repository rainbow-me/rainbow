import { useEffect } from 'react';

import { fetchHiddenTokens, hiddenNftsActions, useHiddenNftsStore } from '@/features/nfts/data/hiddenNftsStore';
import { useAccountAddress } from '@/state/wallets/walletsStore';

const EMPTY_TOKENS: string[] = [];

export default function useHiddenTokens(address?: string) {
  const accountAddress = useAccountAddress();
  const addressToUse = address || accountAddress;
  const hiddenTokens = useHiddenNftsStore(state => state.getData({ address: addressToUse }) ?? EMPTY_TOKENS);
  useEffect(() => {
    if (address && address !== accountAddress) void fetchHiddenTokens({ address });
  }, [accountAddress, address]);
  return { hiddenTokens, ...hiddenNftsActions };
}

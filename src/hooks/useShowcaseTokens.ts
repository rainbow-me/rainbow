import { useEffect } from 'react';

import { fetchShowcaseTokens, showcaseActions, useShowcaseStore } from '@/features/nfts/data/showcaseStore';
import { useAccountAddress } from '@/state/wallets/walletsStore';

const EMPTY_TOKENS: string[] = [];

export default function useShowcaseTokens(address?: string) {
  const accountAddress = useAccountAddress();
  const addressToUse = address || accountAddress;
  const showcaseTokens = useShowcaseStore(state => state.getData({ address: addressToUse }) ?? EMPTY_TOKENS);
  useEffect(() => {
    if (address && address !== accountAddress) void fetchShowcaseTokens({ address });
  }, [accountAddress, address]);
  return { showcaseTokens, ...showcaseActions };
}

import { Types } from 'rainbow-token-list';
import { useMemo } from 'react';
import { getTokenMetadata } from '@rainbow-me/utils';

export default function useTokenMetadata(
  tokenAddress: string
): Types.Token | undefined {
  return useMemo(() => getTokenMetadata(tokenAddress), [tokenAddress]);
}

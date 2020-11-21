import { find } from 'lodash';
import { Types } from 'rainbow-token-list';
import { useMemo } from 'react';
import { toChecksumAddress } from '../handlers/web3';
import { RAINBOW_TOKEN_LIST } from '@rainbow-me/references';

export default function useTokenMetadata(
  tokenAddress: string
): Types.Token | undefined {
  return useMemo(
    () =>
      find(RAINBOW_TOKEN_LIST.tokens, [
        'address',
        toChecksumAddress(tokenAddress),
      ]),
    [tokenAddress]
  );
}

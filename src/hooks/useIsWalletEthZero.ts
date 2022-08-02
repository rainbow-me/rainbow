import { useMemo } from 'react';
import { checkWalletEthZero } from '../utils/ethereumUtils';

export default function useIsWalletEthZero() {
  return useMemo(() => checkWalletEthZero(), []);
}

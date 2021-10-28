import { useMemo } from 'react';
import { checkWalletEthZero } from '../utils/ethereumUtils';
import { useAppSelector } from './useRedux';

export default function useIsWalletEthZero() {
  const assets = useAppSelector(state => state.data.assets);
  return useMemo(() => checkWalletEthZero(assets), [assets]);
}

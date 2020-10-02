import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { checkWalletEthZero } from '../utils/ethereumUtils';

export default function useIsWalletEthZero() {
  const assets = useSelector(state => state.data.assets);
  return useMemo(() => checkWalletEthZero(assets), [assets]);
}

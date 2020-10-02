import { useMemo } from 'react';
import { checkWalletEthZero } from '../utils/ethereumUtils';
import { useSelector } from '@rainbow-me/react-redux';

export default function useIsWalletEthZero() {
  const assets = useSelector(state => state.data.assets);
  return useMemo(() => checkWalletEthZero(assets), [assets]);
}

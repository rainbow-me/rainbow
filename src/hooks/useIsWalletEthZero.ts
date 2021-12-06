import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { checkWalletEthZero } from '../utils/ethereumUtils';

export default function useIsWalletEthZero() {
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'data' does not exist on type 'DefaultRoo... Remove this comment to see the full error message
  const assets = useSelector(state => state.data.assets);
  return useMemo(() => checkWalletEthZero(assets), [assets]);
}

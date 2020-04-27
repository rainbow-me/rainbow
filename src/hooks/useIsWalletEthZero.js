import { useSelector } from 'react-redux';
import { checkWalletEthZero } from '../utils/ethereumUtils';

export default function useIsWalletEthZero() {
  const { assets } = useSelector(({ data: { assets } }) => ({
    assets,
  }));

  return checkWalletEthZero(assets);
}

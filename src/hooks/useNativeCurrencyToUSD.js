import ethereumUtils, { useEthUSDPrice } from '../utils/ethereumUtils';
import useAccountSettings from './useAccountSettings';
import { ETH_ADDRESS } from '@rainbow-me/references';

export default function useNativeCurrencyToUSD() {
  const { nativeCurrency } = useAccountSettings();
  const ethNative = ethereumUtils.getAssetPrice({
    nativeCurrency,
    uniqueId: ETH_ADDRESS,
  });
  const ethUSD = useEthUSDPrice() || Infinity;
  return ethNative / ethUSD;
}

import ethereumUtils, { useEthUSDPrice } from '../utils/ethereumUtils';
import { ETH_ADDRESS } from '@rainbow-me/references';

export default function useNativeCurrencyToUSD() {
  const ethNative = ethereumUtils.getAssetPrice({ uniqueId: ETH_ADDRESS });
  const ethUSD = useEthUSDPrice() || Infinity;
  return ethNative / ethUSD;
}

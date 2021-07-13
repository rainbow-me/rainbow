import { useEth, useEthUSDPrice } from '../utils/ethereumUtils';

export default function useNativeCurrencyToUSD() {
  const { price: { value: ethNative = 0 } = {} } = useEth() || {};
  const ethUSD = useEthUSDPrice() || Infinity;
  return ethNative / ethUSD;
}

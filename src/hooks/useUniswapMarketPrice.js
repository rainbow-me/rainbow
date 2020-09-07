import { getMarketDetails as getUniswapMarketDetails } from '@uniswap/sdk';
import { get } from 'lodash';
import { useCallback } from 'react';
import { divide } from '../helpers/utilities';
import { ethereumUtils } from '../utils';
import useAccountAssets from './useAccountAssets';

export default function useUniswapMarketPrice() {
  const { allAssets } = useAccountAssets();

  const getMarketPrice = useCallback(
    (inputCurrency, outputCurrency, useInputReserve = true) => {
      const ethPrice = ethereumUtils.getEthPriceUnit(allAssets);
      if (
        (useInputReserve && get(inputCurrency, 'address') === 'eth') ||
        (!useInputReserve && get(outputCurrency, 'address') === 'eth')
      )
        return ethPrice;

      // TODO JIN - find reserve to get market details with and check validity
      const reserve = null;

      const marketDetails = getUniswapMarketDetails(undefined, reserve);
      const assetToEthPrice = get(marketDetails, 'marketRate.rate');
      return divide(ethPrice, assetToEthPrice);
    },
    [allAssets]
  );

  return {
    getMarketPrice,
  };
}

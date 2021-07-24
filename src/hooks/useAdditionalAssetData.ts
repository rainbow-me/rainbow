import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useNativeCurrencyToUSD from './useNativeCurrencyToUSD';
import { useAccountSettings } from './index';
import { bigNumberFormat } from '@rainbow-me/helpers/bigNumberFormat';
import {
  additionalAssetsDataAddCoingecko,
  additionalAssetsDataAddUniswap,
  AdditionalDataCongecko,
  AdditionalDataUniswap,
} from '@rainbow-me/redux/additionalAssetsData';

import type { AppState } from '@rainbow-me/redux/store';
import { WETH_ADDRESS } from '@rainbow-me/references';

function cutIfOver10000(value: number): number {
  return value > 10000 ? Math.round(value) : value;
}

export default function useAdditionalAssetData(
  address: string,
  tokenPrice = 0
):
  | {
      description?: string;
      totalVolume?: string;
      totalLiquidity?: string;
      marketCap?: string;
      totalVolumeLoading: boolean;
      totalLiquidityLoading: boolean;
      marketCapLoading: boolean;
    }
  | undefined {
  // @ts-ignore
  const coingeckoId: string | undefined = useSelector(
    // @ts-ignore
    ({ additionalAssetsData: { coingeckoIds } }): AppState =>
      coingeckoIds[address?.toLowerCase()]
  );

  // @ts-ignore
  const coingeckoData: AdditionalDataCongecko | undefined = useSelector(
    // @ts-ignore
    ({ additionalAssetsData: { coingeckoData } }): AppState =>
      coingeckoData[address?.toLowerCase()]
  );

  // @ts-ignore
  const uniswapData: AdditionalDataUniswap | undefined = useSelector(
    // @ts-ignore
    ({ additionalAssetsData: { uniswapData } }): AppState =>
      uniswapData[address?.toLowerCase()]
  );

  const allTokens = useSelector((state: AppState) => state.uniswap.allTokens);
  const uniswapToken =
    allTokens[address?.toLowerCase() === 'eth' ? WETH_ADDRESS : address];

  const totalLiquidity = uniswapToken?.totalLiquidity;
  const dispatch = useDispatch();

  const { nativeCurrency } = useAccountSettings();

  const format = useCallback(
    value =>
      value
        ? bigNumberFormat(cutIfOver10000(value), nativeCurrency, value >= 10000)
        : '',
    [nativeCurrency]
  );

  const rate = useNativeCurrencyToUSD();

  useEffect(() => {
    coingeckoId &&
      !coingeckoData &&
      dispatch(additionalAssetsDataAddCoingecko(address?.toLowerCase()));
  }, [coingeckoId, address, coingeckoData, dispatch]);

  useEffect(() => {
    !uniswapData &&
      dispatch(additionalAssetsDataAddUniswap(address?.toLowerCase()));
  }, [coingeckoId, address, coingeckoData, dispatch, uniswapData]);

  const newData = {
    description: coingeckoData?.description,
    totalVolumeLoading: typeof uniswapData?.oneDayVolumeUSD !== 'number',
    ...(uniswapData?.oneDayVolumeUSD
      ? {
          totalVolume: format(uniswapData?.oneDayVolumeUSD * rate),
        }
      : {}),
    marketCapLoading:
      typeof coingeckoData?.circulatingSupply !== 'number' && !!coingeckoId,
    ...(coingeckoData?.circulatingSupply
      ? {
          marketCap: format(coingeckoData?.circulatingSupply * tokenPrice),
        }
      : {}),
    totalLiquidityLoading: typeof totalLiquidity !== 'number',
    ...(totalLiquidity
      ? {
          totalLiquidity: format(tokenPrice * totalLiquidity),
        }
      : {}),
    links: coingeckoData?.links,
  };

  return newData || {};
}

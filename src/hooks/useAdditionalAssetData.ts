import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useNativeCurrencyToUSD from './useNativeCurrencyToUSD';
import { useAccountSettings } from './index';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/bigNumberF... Remove this comment to see the full error message
import { bigNumberFormat } from '@rainbow-me/helpers/bigNumberFormat';
import {
  additionalAssetsDataAddCoingecko,
  additionalAssetsDataAddUniswap,
  AdditionalDataCongecko,
  AdditionalDataUniswap,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/additionalAs... Remove this comment to see the full error message
} from '@rainbow-me/redux/additionalAssetsData';

// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/store' or it... Remove this comment to see the full error message
import type { AppState } from '@rainbow-me/redux/store';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/references' or its... Remove this comment to see the full error message
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
  const coingeckoId: string | undefined = useSelector(
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'additionalAssetsData' does not exist on ... Remove this comment to see the full error message
    ({ additionalAssetsData: { coingeckoIds } }): AppState =>
      coingeckoIds[address?.toLowerCase()]
  );

  const coingeckoData: AdditionalDataCongecko | undefined = useSelector(
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'additionalAssetsData' does not exist on ... Remove this comment to see the full error message
    ({ additionalAssetsData: { coingeckoData } }): AppState =>
      coingeckoData[address?.toLowerCase()]
  );

  const uniswapData: AdditionalDataUniswap | undefined = useSelector(
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'additionalAssetsData' does not exist on ... Remove this comment to see the full error message
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

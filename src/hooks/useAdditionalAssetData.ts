import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { bigNumberFormat } from '../components/investment-cards/PoolValue';
import useNativeCurrencyToUSD from './useNativeCurrencyToUSD';
import { useAccountSettings } from './index';
import {
  additionalAssetsDataAdd,
  AdditionalData,
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
    }
  | undefined {
  // @ts-ignore
  const data: AdditionalData | undefined = useSelector(
    // @ts-ignore
    ({ additionalAssetsData }): AppState =>
      additionalAssetsData[address?.toLowerCase()]?.data
  );

  const allTokens = useSelector((state: AppState) => state.uniswap.allTokens);
  const uniswapToken =
    allTokens[address.toLowerCase() === 'eth' ? WETH_ADDRESS : address];

  const totalLiquidity = uniswapToken?.totalLiquidity;
  const dispatch = useDispatch();

  const { nativeCurrency } = useAccountSettings();

  const format = useCallback(
    value =>
      bigNumberFormat(cutIfOver10000(value), nativeCurrency, value >= 10000),
    [nativeCurrency]
  );

  const rate = useNativeCurrencyToUSD();

  useEffect(() => {
    !data && dispatch(additionalAssetsDataAdd(address?.toLowerCase()));
  }, [data, address, dispatch]);

  const newData = {
    description: data?.description,
    ...(data?.oneDayVolumeUSD
      ? {
          totalVolume: format(data?.oneDayVolumeUSD * rate),
        }
      : {}),
    ...(data?.circulatingSupply
      ? {
          marketCap: format(data?.circulatingSupply * tokenPrice),
        }
      : {}),
    ...(totalLiquidity
      ? {
          totalLiquidity: format(tokenPrice * totalLiquidity),
        }
      : {}),
  };

  return newData || {};
}

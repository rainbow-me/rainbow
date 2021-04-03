import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useEth } from '../utils/ethereumUtils';
import { useAccountSettings } from './index';
import {
  additionalAssetsDataAdd,
  AdditionalData,
} from '@rainbow-me/redux/additionalAssetsData';

import type { AppState } from '@rainbow-me/redux/store';
import { WETH_ADDRESS } from '@rainbow-me/references';

function cutIfOver10000(
  localeValue: string | undefined,
  value: number
): string | undefined {
  return localeValue?.slice(0, value > 10000 ? -3 : 0);
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
  const { price: { value: ethNative = 0 } = {} } = useEth() || {};

  const totalLiquidity = uniswapToken?.totalLiquidity;
  const dispatch = useDispatch();

  const { nativeCurrency } = useAccountSettings();

  useEffect(() => {
    !data && dispatch(additionalAssetsDataAdd(address?.toLowerCase()));
  }, [data, address, dispatch]);

  const newData = {
    description: data?.description,
    ...(data?.totalVolumeInEth
      ? {
          totalVolume: cutIfOver10000(
            (data?.totalVolumeInEth * ethNative).toLocaleString('en-US', {
              currency: nativeCurrency,
              style: 'currency',
            }),
            data?.totalVolumeInEth * ethNative
          ),
        }
      : {}),
    ...(data?.circulatingSupply
      ? {
          marketCap: cutIfOver10000(
            (data?.circulatingSupply * tokenPrice).toLocaleString('en-US', {
              currency: nativeCurrency,
              style: 'currency',
            }),
            data?.circulatingSupply * tokenPrice
          ),
        }
      : {}),
    ...(totalLiquidity
      ? {
          totalLiquidity: cutIfOver10000(
            (tokenPrice * totalLiquidity).toLocaleString('en-US', {
              currency: nativeCurrency,
              style: 'currency',
            }),
            tokenPrice * totalLiquidity
          ),
        }
      : {}),
  };

  return newData || {};
}

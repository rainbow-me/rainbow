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
      additionalAssetsData[address?.toLowerCase()].data
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
          totalVolume: (data?.totalVolumeInEth * ethNative).toLocaleString(
            'en-US',
            {
              currency: nativeCurrency,
              style: 'currency',
            }
          ),
        }
      : {}),
    ...(data?.circulatingSupply
      ? {
          marketCap: (data?.circulatingSupply * tokenPrice).toLocaleString(
            'en-US',
            {
              currency: nativeCurrency,
              style: 'currency',
            }
          ),
        }
      : {}),
    ...(totalLiquidity
      ? {
          totalLiquidity: (tokenPrice * totalLiquidity).toLocaleString(
            'en-US',
            {
              currency: nativeCurrency,
              style: 'currency',
            }
          ),
        }
      : {}),
  };

  return newData || {};
}

import { useCallback } from 'react';
import { useQuery } from 'react-query';
import useNativeCurrencyToUSD from './useNativeCurrencyToUSD';
import { useAccountSettings } from './index';
import { EthereumAddress } from '@rainbow-me/entities';
import { getAdditionalAssetData } from '@rainbow-me/handlers/dispersion';
import { bigNumberFormat } from '@rainbow-me/helpers/bigNumberFormat';
import { ETH_ADDRESS, WETH_ADDRESS } from '@rainbow-me/references';

function cutIfOver10000(value: number): number {
  return value > 10000 ? Math.round(value) : value;
}

export default function useAdditionalAssetData(
  rawAddress: EthereumAddress,
  tokenPrice = 0
): {
  description?: string;
  loading: boolean;
  totalVolume?: string;
  totalLiquidity?: string;
  marketCap?: string;
  links: Record<string, string[]>;
} {
  const address = rawAddress === ETH_ADDRESS ? WETH_ADDRESS : rawAddress;
  const { data } = useQuery(['additionalAssetData', address], () =>
    getAdditionalAssetData(address)
  );
  const { nativeCurrency } = useAccountSettings();
  const format = useCallback(
    value =>
      value
        ? bigNumberFormat(cutIfOver10000(value), nativeCurrency, value >= 10000)
        : '',
    [nativeCurrency]
  );
  const rate = useNativeCurrencyToUSD();
  const loading = !data;
  return {
    description: data?.description,
    links: data?.links,
    loading,
    marketCap: format(data?.circulatingSupply * tokenPrice),
    totalLiquidity: format(data?.totalLiquidity * tokenPrice),
    totalVolume: format(data?.oneDayVolumeUSD * rate),
  };
}

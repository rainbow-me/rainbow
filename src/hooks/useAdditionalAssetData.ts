import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import useNativeCurrencyToUSD from './useNativeCurrencyToUSD';
import { useAccountSettings } from './index';
import { EthereumAddress } from '@/entities';
import { getAdditionalAssetData } from '@/handlers/dispersion';
import { bigNumberFormat } from '@/helpers/bigNumberFormat';
import { greaterThanOrEqualTo, multiply } from '@/helpers/utilities';
import { ETH_ADDRESS, WETH_ADDRESS } from '@/references';
import { implementation } from '@/entities/dispersion';
import { Network } from '@/helpers';

export default function useAdditionalAssetData(
  rawAddress: EthereumAddress,
  tokenPrice = 0,
  chainId = 1
): {
  description?: string;
  loading: boolean;
  totalVolume: string | null;
  totalLiquidity: string | null;
  marketCap: string | null;
  links: Record<string, string[]>;
  networks: Record<string, implementation>;
} {
  const { data } = useQuery(['additionalAssetData', rawAddress], () =>
    getAdditionalAssetData(rawAddress, chainId)
  );
  const { nativeCurrency } = useAccountSettings();
  const format = useCallback(
    (value: string) =>
      bigNumberFormat(
        value,
        nativeCurrency,
        greaterThanOrEqualTo(value, 10000)
      ),
    [nativeCurrency]
  );
  const rate = useNativeCurrencyToUSD();
  const loading = !data;
  const marketCap = data?.circulatingSupply
    ? format(multiply(data?.circulatingSupply, tokenPrice))
    : null;
  const totalLiquidity = data?.totalLiquidity
    ? format(multiply(data?.totalLiquidity, tokenPrice))
    : null;
  const totalVolume = data?.oneDayVolumeUSD
    ? format(multiply(data?.oneDayVolumeUSD, rate))
    : null;
  return {
    description: data?.description,
    links: data?.links,
    loading,
    marketCap,
    networks: data?.networks,
    totalLiquidity,
    totalVolume,
  };
}

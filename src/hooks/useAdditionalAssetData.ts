import { useCallback } from 'react';
import { useQuery } from 'react-query';
import useNativeCurrencyToUSD from './useNativeCurrencyToUSD';
import { useAccountSettings } from './index';
import { EthereumAddress } from '@rainbow-me/entities';
import { getAdditionalAssetData } from '@rainbow-me/handlers/dispersion';
import { bigNumberFormat } from '@rainbow-me/helpers/bigNumberFormat';
import { greaterThanOrEqualTo, multiply } from '@rainbow-me/helpers/utilities';
import { ETH_ADDRESS, WETH_ADDRESS } from '@rainbow-me/references';

export default function useAdditionalAssetData(
  rawAddress: EthereumAddress,
  tokenPrice = 0
): {
  description?: string;
  loading: boolean;
  totalVolume: string | null;
  totalLiquidity: string | null;
  marketCap: string | null;
  links: Record<string, string[]>;
} {
  const address = rawAddress === ETH_ADDRESS ? WETH_ADDRESS : rawAddress;
  const { data } = useQuery(['additionalAssetData', address], () =>
    getAdditionalAssetData(address)
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
    totalLiquidity,
    totalVolume,
  };
}

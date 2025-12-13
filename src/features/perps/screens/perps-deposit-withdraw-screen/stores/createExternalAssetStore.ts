import { NativeCurrencyKey } from '@/entities';
import { PerpsDepositStoreType } from '@/features/perps/screens/perps-deposit-withdraw-screen/stores/createPerpsDepositStore';
import { metadataClient } from '@/graphql';
import { Token } from '@/graphql/__generated__/metadata';
import { isNativeAsset } from '@/handlers/assets';
import { convertAmountAndPriceToNativeDisplay, convertAmountToPercentageDisplay } from '@/helpers/utilities';
import { ETH_ADDRESS } from '@/references';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { ChainId } from '@/state/backendNetworks/types';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { AddressOrEth } from '@/__swaps__/types/assets';
import { time } from '@/utils';

type NativeAssetParams = {
  chainId: ChainId;
  currency: NativeCurrencyKey;
};

export function createExternalTokenStore({ useDepositStore }: { useDepositStore: PerpsDepositStoreType }) {
  return createQueryStore<FormattedExternalAsset | null, NativeAssetParams>({
    fetcher: externalTokenQueryFunction,
    params: {
      currency: $ => $(userAssetsStoreManager).currency,
      chainId: $ => $(useDepositStore, state => state.getAssetChainId()),
    },
    cacheTime: time.hours(1),
    staleTime: time.minutes(1),
  });
}

async function externalTokenQueryFunction({ currency, chainId }: NativeAssetParams, abortController: AbortController | null) {
  const address = useBackendNetworksStore.getState().getChainsNativeAsset()[chainId]?.address || ETH_ADDRESS;
  if (!chainId) {
    abortController?.abort();
    return null;
  }
  const tokenData = await fetchExternalToken({
    address,
    chainId,
    currency,
  });
  return tokenData;
}

type ExternalToken = Pick<Token, 'decimals' | 'iconUrl' | 'name' | 'networks' | 'symbol' | 'colors' | 'price' | 'transferable'>;

type ExternalTokenArgs = {
  address: string;
  chainId: ChainId;
  currency: NativeCurrencyKey;
};

export type FormattedExternalAsset = ExternalToken & {
  address: string;
  chainId: ChainId;
  icon_url?: string;
  isNativeAsset: boolean;
  native: {
    change: string;
    price: {
      amount: string;
      display: string;
    };
  };
};

async function fetchExternalToken({ address, chainId, currency }: ExternalTokenArgs) {
  const response = await metadataClient.externalToken({
    address,
    chainId,
    currency,
  });
  if (response.token) return formatExternalAsset(address, chainId, response.token, currency);
  return null;
}

function formatExternalAsset(
  address: string,
  chainId: ChainId,
  asset: ExternalToken,
  nativeCurrency: NativeCurrencyKey
): FormattedExternalAsset {
  return {
    ...asset,
    address,
    chainId,
    icon_url: asset?.iconUrl || undefined,
    isNativeAsset: isNativeAsset(address as AddressOrEth, chainId),
    native: {
      change: asset?.price?.relativeChange24h ? convertAmountToPercentageDisplay(`${asset?.price?.relativeChange24h}`) : '',
      price: convertAmountAndPriceToNativeDisplay(1, asset?.price?.value || 0, nativeCurrency),
    },
  };
}

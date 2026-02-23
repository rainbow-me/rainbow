import type { NativeCurrencyKey } from '@/entities/nativeCurrencyTypes';
import { type Token } from '@/graphql/__generated__/metadata';
import { metadataClient } from '@/graphql';
import { isNativeAsset } from '@/handlers/assets';
import { convertAmountAndPriceToNativeDisplay, convertAmountToPercentageDisplay } from '@/helpers/utilities';
import { ETH_ADDRESS } from '@/references';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { type ChainId } from '@/state/backendNetworks/types';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';
import { type DepositStoreType } from '../types';

// ============ Types ========================================================= //

type NativeAssetParams = {
  chainId: ChainId;
  currency: NativeCurrencyKey;
};

type ExternalToken = Pick<Token, 'colors' | 'decimals' | 'iconUrl' | 'name' | 'networks' | 'price' | 'symbol' | 'transferable'>;

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

// ============ Store Factory ================================================= //

export function createExternalTokenStore(useDepositStore: DepositStoreType) {
  return createQueryStore<FormattedExternalAsset | null, NativeAssetParams>({
    fetcher: externalTokenQueryFunction,
    params: {
      chainId: $ => $(useDepositStore, state => state.getAssetChainId()),
      currency: $ => $(userAssetsStoreManager).currency,
    },
    cacheTime: time.hours(1),
    staleTime: time.minutes(1),
  });
}

// ============ Query Function ================================================ //

async function externalTokenQueryFunction(
  { chainId, currency }: NativeAssetParams,
  abortController: AbortController | null
): Promise<FormattedExternalAsset | null> {
  const address = useBackendNetworksStore.getState().getChainsNativeAsset()[chainId]?.address || ETH_ADDRESS;
  if (!chainId) {
    abortController?.abort();
    return null;
  }
  return fetchExternalToken({ address, chainId, currency });
}

// ============ External Token Fetching ======================================= //

type ExternalTokenArgs = {
  address: string;
  chainId: ChainId;
  currency: NativeCurrencyKey;
};

async function fetchExternalToken({ address, chainId, currency }: ExternalTokenArgs): Promise<FormattedExternalAsset | null> {
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
    isNativeAsset: isNativeAsset(address, chainId),
    native: {
      change: asset?.price?.relativeChange24h ? convertAmountToPercentageDisplay(`${asset?.price?.relativeChange24h}`) : '',
      price: convertAmountAndPriceToNativeDisplay(1, asset?.price?.value || 0, nativeCurrency),
    },
  };
}

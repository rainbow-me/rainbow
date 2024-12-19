import { SupportedCurrencyKey } from '@/references';
import {
  AddressOrEth,
  AssetApiResponse,
  AssetMetadata,
  ParsedAsset,
  ParsedSearchAsset,
  ParsedUserAsset,
  UniqueId,
  ZerionAsset,
  ZerionAssetPrice,
} from '@/__swaps__/types/assets';
import { ChainId, ChainName } from '@/state/backendNetworks/types';

import * as i18n from '@/languages';
import { SearchAsset } from '@/__swaps__/types/search';

import { isNativeAsset } from '@/handlers/assets';
import {
  convertAmountAndPriceToNativeDisplay,
  convertAmountToBalanceDisplay,
  convertAmountToNativeDisplayWorklet,
  convertAmountToPercentageDisplay,
  convertRawAmountToDecimalFormat,
} from '@/helpers/utilities';
import { isLowerCaseMatch } from '@/utils';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

export const isSameAsset = (a1: Pick<ParsedAsset, 'chainId' | 'address'>, a2: Pick<ParsedAsset, 'chainId' | 'address'>) =>
  +a1.chainId === +a2.chainId && isLowerCaseMatch(a1.address, a2.address);

const get24HrChange = (priceData?: ZerionAssetPrice) => {
  const twentyFourHrChange = priceData?.relative_change_24h;
  return twentyFourHrChange ? convertAmountToPercentageDisplay(twentyFourHrChange) : '';
};

export const getNativeAssetPrice = ({ priceData, currency }: { priceData?: ZerionAssetPrice; currency: SupportedCurrencyKey }) => {
  const priceUnit = priceData?.value;
  return {
    change: get24HrChange(priceData),
    amount: priceUnit || 0,
    display: convertAmountToNativeDisplayWorklet(priceUnit || 0, currency),
  };
};

export const getNativeAssetBalance = ({
  currency,
  priceUnit,
  value,
}: {
  currency: SupportedCurrencyKey;
  decimals: number;
  priceUnit: number;
  value: string | number;
}) => {
  return convertAmountAndPriceToNativeDisplay(value, priceUnit, currency);
};

const isZerionAsset = (asset: ZerionAsset | AssetApiResponse): asset is ZerionAsset => 'implementations' in asset || !('networks' in asset);

const getUniqueIdForAsset = ({ asset }: { asset: ZerionAsset | AssetApiResponse }): UniqueId => {
  const address = asset.asset_code;
  const chainName = asset.network ?? ChainName.mainnet;
  const networks = 'networks' in asset ? asset.networks || {} : {};
  const chainId =
    ('chain_id' in asset && asset.chain_id) ||
    useBackendNetworksStore.getState().getChainsIdByName()[chainName] ||
    Number(Object.keys(networks)[0]);

  // ZerionAsset should be removed when we move fully away from websckets/refraction api
  const mainnetAddress = isZerionAsset(asset)
    ? asset.mainnet_address || asset.implementations?.[ChainName.mainnet]?.address || undefined
    : networks[ChainId.mainnet]?.address;

  return `${address || mainnetAddress}_${chainId}`;
};

export function parseAsset({ asset, currency }: { asset: ZerionAsset | AssetApiResponse; currency: SupportedCurrencyKey }): ParsedAsset {
  const address = asset.asset_code;
  const chainName = asset.network ?? ChainName.mainnet;
  const networks = 'networks' in asset ? asset.networks || {} : {};
  const chainId =
    ('chain_id' in asset && asset.chain_id) ||
    useBackendNetworksStore.getState().getChainsIdByName()[chainName] ||
    Number(Object.keys(networks)[0]);

  // ZerionAsset should be removed when we move fully away from websckets/refraction api
  const mainnetAddress = isZerionAsset(asset)
    ? asset.mainnet_address || asset.implementations?.[ChainName.mainnet]?.address || undefined
    : networks[ChainId.mainnet]?.address;

  const standard = 'interface' in asset ? asset.interface : undefined;
  const uniqueId = getUniqueIdForAsset({ asset });
  const parsedAsset = {
    address,
    uniqueId,
    chainId,
    chainName,
    mainnetAddress,
    isNativeAsset: isNativeAsset(address, chainId),
    native: {
      price: getNativeAssetPrice({
        currency,
        priceData: asset?.price,
      }),
    },
    name: asset.name || i18n.t('tokens_tab.unknown_token'),
    price: asset.price,
    symbol: asset.symbol,
    type: asset.type,
    decimals: asset.decimals,
    icon_url: asset.icon_url,
    colors: asset.colors,
    standard,
    ...('networks' in asset && { networks: asset.networks }),
    ...('bridging' in asset && {
      bridging: {
        isBridgeable: !!asset.bridging.bridgeable,
        networks: asset.bridging.networks,
      },
    }),
  };

  return parsedAsset;
}

export function parseAssetMetadata({
  address,
  asset,
  chainId,
  currency,
}: {
  address: AddressOrEth;
  asset: AssetMetadata;
  chainId: ChainId;
  currency: SupportedCurrencyKey;
}): ParsedAsset {
  const mainnetAddress = asset.networks?.[ChainId.mainnet]?.address || address;
  const uniqueId = getUniqueIdForAsset({
    asset: {
      ...asset,
      asset_code: address,
      chain_id: chainId,
      icon_url: '',
      price: {
        changed_at: -1,
        relative_change_24h: asset.price.relativeChange24h,
        value: asset.price.value,
      },
      bridging: {
        bridgeable: false,
        networks: {},
      },
    } as AssetApiResponse,
  });
  const priceData = {
    relative_change_24h: asset?.price?.relativeChange24h,
    value: asset?.price?.value,
  };
  const parsedAsset = {
    address,
    chainId,
    chainName: useBackendNetworksStore.getState().getChainsName()[chainId],
    colors: asset?.colors,
    decimals: asset?.decimals,
    icon_url: asset?.iconUrl,
    isNativeAsset: isNativeAsset(address, chainId),
    mainnetAddress,
    name: asset?.name || i18n.t(i18n.l.tokens_tab.unknown_token),
    native: {
      price: getNativeAssetPrice({
        currency,
        priceData,
      }),
    },
    price: priceData,
    symbol: asset?.symbol,
    uniqueId,
    networks: asset?.networks,
  } satisfies ParsedAsset;
  return parsedAsset;
}

export function parseUserAsset({
  asset,
  currency,
  balance,
  smallBalance,
}: {
  asset: ZerionAsset | AssetApiResponse;
  currency: SupportedCurrencyKey;
  balance: string;
  smallBalance?: boolean;
}) {
  const parsedAsset = parseAsset({ asset, currency });
  return parseUserAssetBalances({
    asset: parsedAsset,
    currency,
    balance,
    smallBalance,
  });
}

export function parseUserAssetBalances({
  asset,
  currency,
  balance,
  smallBalance = false,
}: {
  asset: ParsedAsset;
  currency: SupportedCurrencyKey;
  balance: string;
  smallBalance?: boolean;
}) {
  const { decimals, symbol, price } = asset;
  const amount = convertRawAmountToDecimalFormat(balance, decimals);

  return {
    ...asset,
    balance: {
      amount,
      display: convertAmountToBalanceDisplay(amount, { decimals, symbol }),
    },
    native: {
      ...asset.native,
      balance: getNativeAssetBalance({
        currency,
        decimals,
        priceUnit: price?.value || 0,
        value: amount,
      }),
    },
    smallBalance,
  };
}

export const parseSearchAsset = ({
  assetWithPrice,
  searchAsset,
  userAsset,
}: {
  assetWithPrice?: Partial<ParsedAsset>;
  searchAsset: ParsedSearchAsset | SearchAsset;
  userAsset?: ParsedUserAsset;
}): ParsedSearchAsset => ({
  ...searchAsset,
  isNativeAsset: isNativeAsset(searchAsset.address, searchAsset.chainId),
  address: searchAsset.address,
  chainId: searchAsset.chainId,
  chainName: useBackendNetworksStore.getState().getChainsName()[searchAsset.chainId],
  native: {
    balance: userAsset?.native.balance || {
      amount: '0',
      display: '0.00',
    },
    price: assetWithPrice?.native?.price || userAsset?.native?.price,
  },
  price: assetWithPrice?.price || userAsset?.price,
  balance: userAsset?.balance || { amount: '0', display: '0.00' },
  icon_url: userAsset?.icon_url || assetWithPrice?.icon_url || searchAsset?.icon_url,
  colors: userAsset?.colors || assetWithPrice?.colors || searchAsset?.colors,
  type: userAsset?.type || assetWithPrice?.type || searchAsset?.type,
});

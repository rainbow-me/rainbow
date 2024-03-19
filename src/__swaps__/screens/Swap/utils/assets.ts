import { AddressZero } from '@ethersproject/constants';
import isValidDomain from 'is-valid-domain';

import { ETH_ADDRESS, SupportedCurrencyKey } from '@/references';
import {
  AddressOrEth,
  AssetApiResponse,
  ParsedAsset,
  ParsedSearchAsset,
  ParsedUserAsset,
  UniqueId,
  ZerionAsset,
  ZerionAssetPrice,
} from '@/__swaps__/screens/Swap/types/assets';
import { ChainId, ChainName } from '@/__swaps__/screens/Swap/types/chains';

import { metadataClient } from '@/graphql';
import * as i18n from '@/languages';
import { SearchAsset } from '../types/search';

import { chainIdFromChainName, chainNameFromChainId, customChainIdsToAssetNames, isNativeAsset } from './chains';
import {
  convertAmountAndPriceToNativeDisplay,
  convertAmountToBalanceDisplay,
  convertAmountToNativeDisplay,
  convertAmountToPercentageDisplay,
  convertAmountToRawAmount,
  convertRawAmountToDecimalFormat,
} from './numbers';
import { Token } from '@/graphql/__generated__/metadata';

const get24HrChange = (priceData?: ZerionAssetPrice) => {
  const twentyFourHrChange = priceData?.relative_change_24h;
  return twentyFourHrChange ? convertAmountToPercentageDisplay(twentyFourHrChange) : '';
};

export const getCustomChainIconUrl = (chainId: ChainId, address: AddressOrEth) => {
  if (!chainId || !customChainIdsToAssetNames[chainId]) return '';
  const baseUrl = 'https://raw.githubusercontent.com/rainbow-me/assets/master/blockchains/';

  if (address === AddressZero || address === ETH_ADDRESS) {
    return `${baseUrl}${customChainIdsToAssetNames[chainId]}/info/logo.png`;
  } else {
    return `${baseUrl}${customChainIdsToAssetNames[chainId]}/assets/${address}/logo.png`;
  }
};

export const getNativeAssetPrice = ({ priceData, currency }: { priceData?: ZerionAssetPrice; currency: SupportedCurrencyKey }) => {
  const priceUnit = priceData?.value;
  return {
    change: get24HrChange(priceData),
    amount: priceUnit || 0,
    display: convertAmountToNativeDisplay(priceUnit || 0, currency),
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

export function parseAsset({ asset, currency }: { asset: ZerionAsset | AssetApiResponse; currency: SupportedCurrencyKey }): ParsedAsset {
  const address = asset.asset_code;
  const chainName = asset.network ?? ChainName.mainnet;
  const networks = 'networks' in asset ? asset.networks || {} : {};
  const chainId = ('chain_id' in asset && asset.chain_id) || chainIdFromChainName(chainName) || Number(Object.keys(networks)[0]);

  // ZerionAsset should be removed when we move fully away from websckets/refraction api
  const mainnetAddress = isZerionAsset(asset)
    ? asset.mainnet_address || asset.implementations?.[ChainName.mainnet]?.address || undefined
    : networks[ChainId.mainnet]?.address;

  const standard = 'interface' in asset ? asset.interface : undefined;

  const uniqueId: UniqueId = `${mainnetAddress || address}_${chainId}`;
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
    icon_url: asset.icon_url || getCustomChainIconUrl(chainId, address),
    colors: asset.colors,
    standard,
    ...('networks' in asset && { networks: asset.networks }),
    ...('bridging' in asset && {
      bridging: {
        isBridgeable: asset.bridging.bridgeable,
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
  asset: Token;
  chainId: ChainId;
  currency: SupportedCurrencyKey;
}): ParsedAsset {
  const mainnetAddress = asset.networks?.[ChainId.mainnet]?.address || address;
  const uniqueId = `${mainnetAddress || address}_${chainId}`;
  const priceData = {
    relative_change_24h: asset?.price?.relativeChange24h ?? undefined,
    value: asset?.price?.value ?? 0,
  };
  const parsedAsset = {
    address,
    chainId,
    chainName: chainNameFromChainId(chainId),
    colors: {
      primary: asset?.colors?.primary,
      fallback: asset?.colors?.fallback ?? undefined,
      shadow: asset?.colors?.shadow ?? undefined,
    },
    decimals: asset?.decimals,
    icon_url: asset?.iconUrl ?? undefined,
    isNativeAsset: isNativeAsset(address, chainId),
    mainnetAddress,
    name: asset?.name || i18n.t('tokens_tab.unknown_token'),
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

export function parseParsedUserAsset({
  parsedAsset,
  currency,
  quantity,
}: {
  parsedAsset: ParsedUserAsset;
  currency: SupportedCurrencyKey;
  quantity: string;
}): ParsedUserAsset {
  const amount = convertRawAmountToDecimalFormat(quantity, parsedAsset?.decimals);
  return {
    ...parsedAsset,
    balance: {
      amount,
      display: convertAmountToBalanceDisplay(amount, {
        decimals: parsedAsset?.decimals,
        symbol: parsedAsset?.symbol,
      }),
    },
    native: {
      ...parsedAsset.native,
      balance: getNativeAssetBalance({
        currency,
        decimals: parsedAsset?.decimals,
        priceUnit: parsedAsset?.price?.value || 0,
        value: amount,
      }),
    },
  };
}

export const parseSearchAsset = ({
  assetWithPrice,
  searchAsset,
  userAsset,
}: {
  assetWithPrice?: ParsedAsset;
  searchAsset: ParsedSearchAsset | SearchAsset;
  userAsset?: ParsedUserAsset;
}): ParsedSearchAsset => ({
  ...searchAsset,
  address: searchAsset.address,
  chainId: searchAsset.chainId,
  chainName: chainNameFromChainId(searchAsset.chainId),
  native: {
    balance: userAsset?.native.balance || {
      amount: '0',
      display: '0.00',
    },
    price: assetWithPrice?.native.price || userAsset?.native?.price,
  },
  price: assetWithPrice?.price || userAsset?.price,
  balance: userAsset?.balance || { amount: '0', display: '0.00' },
  icon_url: userAsset?.icon_url || assetWithPrice?.icon_url || searchAsset?.icon_url,
  colors: userAsset?.colors || assetWithPrice?.colors || searchAsset?.colors,
  type: userAsset?.type || assetWithPrice?.type,
});

export function filterAsset(asset: ZerionAsset) {
  const nameFragments = asset?.name?.split(' ');
  const nameContainsURL = nameFragments.some(f => isValidDomain(f));
  const symbolFragments = asset?.symbol?.split(' ');
  const symbolContainsURL = symbolFragments.some(f => isValidDomain(f));
  const shouldFilter = nameContainsURL || symbolContainsURL;
  return shouldFilter;
}

export const chunkArray = <TItem>(arr: TItem[], chunkSize: number) => {
  const result = [];

  for (let i = 0; i < arr.length; i += chunkSize) {
    result.push(arr.slice(i, i + chunkSize));
  }

  return result;
};

export const extractFulfilledValue = <T>(result: PromiseSettledResult<T>): T | undefined =>
  result.status === 'fulfilled' ? result.value : undefined;

export const fetchAssetWithPrice = async ({
  parsedAsset,
  currency,
}: {
  parsedAsset: ParsedUserAsset;
  currency: SupportedCurrencyKey;
}): Promise<ParsedUserAsset | null> => {
  const data = await metadataClient.tokenMetadata(
    {
      address: parsedAsset.address,
      chainId: parsedAsset.chainId,
      currency,
    },
    {
      timeout: 10000,
    }
  );

  if (!data.token) {
    return null;
  }

  const asset = data.token;
  const parsedAssetWithPrice = parseAssetMetadata({
    address: parsedAsset.address,
    asset,
    chainId: parsedAsset.chainId,
    currency,
  });
  if (parsedAssetWithPrice?.native.price) {
    const assetToReturn = {
      ...parsedAsset,
      native: {
        ...parsedAsset.native,
        price: parsedAssetWithPrice.native.price,
      },
      price: {
        value: parsedAssetWithPrice.native.price.amount,
      },
      icon_url: parsedAssetWithPrice.icon_url,
    } as ParsedAsset;

    return parseUserAssetBalances({
      asset: assetToReturn,
      currency,
      balance: convertAmountToRawAmount(parsedAsset.balance.amount, parsedAsset.decimals),
      smallBalance: false,
    });
  }
  return null;
};

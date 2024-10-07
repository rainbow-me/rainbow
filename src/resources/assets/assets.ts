import * as i18n from '@/languages';
import isEmpty from 'lodash/isEmpty';
import { MMKV } from 'react-native-mmkv';
import { NativeCurrencyKey, ParsedAddressAsset, ZerionAssetPrice } from '@/entities';
import { isNativeAsset } from '@/handlers/assets';
import {
  convertAmountAndPriceToNativeDisplay,
  convertAmountToBalanceDisplay,
  convertAmountToPercentageDisplay,
  convertRawAmountToBalance,
  convertRawAmountToDecimalFormat,
} from '@/helpers/utilities';
import { BooleanMap } from '@/hooks/useCoinListEditOptions';
import { queryClient } from '@/react-query';
import { setHiddenCoins } from '@/redux/editOptions';
import store from '@/redux/store';
import { positionsQueryKey } from '@/resources/defi/PositionsQuery';
import { RainbowPositions } from '@/resources/defi/types';
import { AddysAddressAsset, ParsedAsset, RainbowAddressAssets } from './types';
import { getUniqueId } from '@/utils/ethereumUtils';
import { ChainId, ChainName } from '@/chains/types';
import { chainsIdByName, chainsName } from '@/chains';
import { AddressOrEth, AssetApiResponse, AssetMetadata, ParsedSearchAsset, ParsedUserAsset, ZerionAsset } from '@/__swaps__/types/assets';
import { SupportedCurrencyKey } from '@/references';
import { convertAmountToNativeDisplayWorklet } from '@/__swaps__/utils/numbers';
import { SearchAsset } from '@/__swaps__/types/search';

const storage = new MMKV();

export const filterPositionsData = (
  address: string,
  currency: NativeCurrencyKey,
  assetsData: RainbowAddressAssets
): RainbowAddressAssets => {
  const positionsObj: RainbowPositions | undefined = queryClient.getQueryData(positionsQueryKey({ address, currency }));
  const positionTokens = positionsObj?.positionTokens || [];

  if (isEmpty(positionTokens)) {
    return assetsData;
  }

  return Object.keys(assetsData)
    .filter(uniqueId => !positionTokens.find(positionToken => positionToken === uniqueId))
    .reduce((cur, uniqueId) => {
      return Object.assign(cur, {
        [uniqueId]: assetsData[uniqueId],
      });
    }, {});
};

export function parseAddressAsset({ assetData }: { assetData: AddysAddressAsset }): ParsedAddressAsset {
  const asset = assetData?.asset;
  const quantity = assetData?.quantity;
  const address = assetData?.asset?.asset_code;

  const parsedAsset = parseAsset({
    address,
    asset,
  });
  return {
    ...parsedAsset,
    balance: convertRawAmountToBalance(quantity, asset),
  };
}

/**
 * Adds new hidden coins for an address and updates key-value storage.
 *
 * @param coins New coin IDs.
 * @param address The address to hide coins for.
 */
function addHiddenCoins(coins: string[], address: string) {
  const { dispatch } = store;
  const storageKey = 'hidden-coins-obj-' + address;
  const storageEntity = storage.getString(storageKey);
  const list = Object.keys(storageEntity ? JSON.parse(storageEntity) : {});
  const newHiddenCoins = [...list.filter((i: string) => !coins.includes(i)), ...coins].reduce((acc, curr) => {
    acc[curr] = true;
    return acc;
  }, {} as BooleanMap);
  dispatch(setHiddenCoins(newHiddenCoins));
  storage.set(storageKey, JSON.stringify(newHiddenCoins));
}

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

export function parseAsset({ asset, currency }: { asset: ZerionAsset | AssetApiResponse; currency: SupportedCurrencyKey }): ParsedAsset {
  const address = asset.asset_code;
  const chainName = asset.network ?? ChainName.mainnet;
  const networks = 'networks' in asset ? asset.networks || {} : {};
  const chainId = ('chain_id' in asset && asset.chain_id) || chainsIdByName[chainName] || Number(Object.keys(networks)[0]);

  // ZerionAsset should be removed when we move fully away from websckets/refraction api
  const mainnetAddress = isZerionAsset(asset)
    ? asset.mainnet_address || asset.implementations?.[ChainName.mainnet]?.address || undefined
    : networks[ChainId.mainnet]?.address;

  const standard = 'interface' in asset ? asset.interface : undefined;
  const uniqueId = getUniqueId(address, chainId);
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
    chainName: chainsName[chainId],
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
  isNativeAsset: isNativeAsset(searchAsset.address, searchAsset.chainId),
  address: searchAsset.address,
  chainId: searchAsset.chainId,
  chainName: chainsName[searchAsset.chainId],
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
  type: userAsset?.type || assetWithPrice?.type || searchAsset?.type,
});

const assetQueryFragment = (
  address: AddressOrEth,
  chainId: ChainId,
  currency: SupportedCurrencyKey,
  index: number,
  withPrice?: boolean
) => {
  const priceQuery = withPrice ? 'price { value relativeChange24h }' : '';
  return `Q${index}: token(address: "${address}", chainID: ${chainId}, currency: "${currency}") {
      colors {
        primary
        fallback
        shadow
      }
      decimals
      iconUrl
      name
      networks
      symbol
      ${priceQuery}
  }`;
};

export const chunkArray = <TItem>(arr: TItem[], chunkSize: number) => {
  const result = [];

  for (let i = 0; i < arr.length; i += chunkSize) {
    result.push(arr.slice(i, i + chunkSize));
  }

  return result;
};

export const createAssetQuery = (addresses: AddressOrEth[], chainId: ChainId, currency: SupportedCurrencyKey, withPrice?: boolean) => {
  return `{
        ${addresses.map((a, i) => assetQueryFragment(a, chainId, currency, i, withPrice)).join(',')}
    }`;
};

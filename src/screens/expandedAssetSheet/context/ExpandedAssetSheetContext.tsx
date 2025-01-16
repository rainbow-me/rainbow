import { ParsedAddressAsset } from '@/entities';
import { useAccountSettings, useAdditionalAssetData } from '@/hooks';
import { TokenMetadata } from '@/hooks/useAdditionalAssetData';
import useAccountAsset from '@/hooks/useAccountAsset';
import { colors } from '@/styles';
import { getUniqueId } from '@/utils/ethereumUtils';
import chroma from 'chroma-js';
import React, { createContext, useContext, useMemo } from 'react';
import { SharedValue, useSharedValue } from 'react-native-reanimated';
import { ChainId } from '@/state/backendNetworks/types';
import { TrendingToken } from '@/resources/trendingTokens/trendingTokens';
import { UniqueId } from '@/__swaps__/types/assets';
import { isNativeAsset } from '@/handlers/assets';
import { getNetwork } from '@ethersproject/providers';
import { TokenColors } from '@/graphql/__generated__/metadata';

export enum SectionId {
  PROFIT = 'profit',
  MARKET_STATS = 'marketStats',
  BUY = 'buy',
  BRIDGE = 'bridge',
  HISTORY = 'history',
  HOLDERS = 'holders',
  ABOUT = 'about',
}

interface AccentColors {
  opacity100: string;
  opacity56: string;
  opacity24: string;
  opacity12: string;
  opacity10: string;
  opacity6: string;
  opacity3: string;
  opacity2: string;
  opacity1: string;
  background: string;
}

const DEFAULT_SECTIONS_STATE: Record<SectionId, boolean> = {
  [SectionId.PROFIT]: true,
  [SectionId.MARKET_STATS]: true,
  [SectionId.BUY]: true,
  [SectionId.BRIDGE]: true,
  [SectionId.HISTORY]: true,
  [SectionId.HOLDERS]: true,
  [SectionId.ABOUT]: true,
};

type BasicAsset = {
  chainId: ChainId;
  address: string;
  colors: TokenColors | undefined;
  uniqueId: UniqueId;
  name: string;
  symbol: string;
  decimals: number;
  icon_url: string | undefined;
  isNativeAsset: boolean;
  network: string;
  price: {
    relative_change_24h: number | undefined;
    value: number | undefined;
  };
  creationDate: string | null;
};

function isTrendingToken(token: ParsedAddressAsset | TrendingToken): token is TrendingToken {
  return 'highlightedFriends' in token;
}

function normalizeTrendingToken(token: TrendingToken): BasicAsset {
  return {
    chainId: token.chainId,
    address: token.address,
    uniqueId: token.uniqueId,
    name: token.name,
    symbol: token.symbol,
    decimals: token.decimals,
    icon_url: token.icon_url,
    isNativeAsset: isNativeAsset(token.address, token.chainId),
    network: getNetwork(token.chainId).name,
    colors: token.colors,
    price: {
      relative_change_24h: token.priceChange.day,
      value: token.price,
    },
    creationDate: token.creationDate,
  };
}

function normalizeParsedAddressAsset(token: ParsedAddressAsset): BasicAsset {
  return {
    chainId: token.chainId,
    address: token.address,
    uniqueId: token.uniqueId,
    name: token.name,
    symbol: token.symbol,
    decimals: token.decimals,
    icon_url: token.icon_url,
    isNativeAsset: isNativeAsset(token.address, token.chainId),
    network: token.network,
    colors: token.colors,
    price: {
      relative_change_24h: token.price?.relative_change_24h,
      value: token.price?.value,
    },
    creationDate: null,
  };
}

type ExpandedAssetSheetContextType = {
  accentColors: AccentColors;
  basicAsset: BasicAsset;
  accountAsset: ParsedAddressAsset | null | undefined;
  assetMetadata: TokenMetadata | null | undefined;
  expandedSections: SharedValue<Record<SectionId, boolean>>;
  isOwnedAsset: boolean;
};

type ExpandedAssetSheetContextProviderProps = {
  asset: ParsedAddressAsset | TrendingToken;
  address: string;
  chainId: ChainId;
  children: React.ReactNode;
};

const ExpandedAssetSheetContext = createContext<ExpandedAssetSheetContextType | undefined>(undefined);

export function useExpandedAssetSheetContext() {
  const context = useContext(ExpandedAssetSheetContext);
  if (context === undefined) {
    throw new Error('useExpandedAssetSheetContext must be used within an ExpandedAssetSheetContextProvider');
  }
  return context;
}

export function ExpandedAssetSheetContextProvider({ asset, address, chainId, children }: ExpandedAssetSheetContextProviderProps) {
  const { nativeCurrency } = useAccountSettings();
  const expandedSections = useSharedValue<Record<SectionId, boolean>>(DEFAULT_SECTIONS_STATE);
  const assetUniqueId = getUniqueId(address, chainId);
  const accountAsset = useAccountAsset(assetUniqueId, nativeCurrency);
  const isOwnedAsset = !!accountAsset;

  console.log('param asset', asset);

  const basicAsset = useMemo(() => {
    if (isTrendingToken(asset)) return normalizeTrendingToken(asset);
    return normalizeParsedAddressAsset(asset);
  }, [asset]);

  const { data: metadata } = useAdditionalAssetData({
    address,
    chainId,
    currency: nativeCurrency,
  });

  const accentColors: AccentColors = useMemo(() => {
    const opacity100 = basicAsset.colors?.primary as string;
    const assetColor = basicAsset.colors?.primary ?? colors.appleBlue;
    const background = chroma(
      chroma(assetColor)
        .rgb()
        .map(channel => Math.round(channel * (1 - 0.8) + 0 * 0.8))
    ).css();

    return {
      opacity100,
      opacity80: colors.alpha(opacity100, 0.8),
      opacity56: colors.alpha(opacity100, 0.56),
      opacity24: colors.alpha(opacity100, 0.24),
      opacity12: colors.alpha(opacity100, 0.12),
      opacity10: colors.alpha(opacity100, 0.1),
      opacity6: colors.alpha(opacity100, 0.06),
      opacity3: colors.alpha(opacity100, 0.03),
      opacity2: colors.alpha(opacity100, 0.02),
      opacity1: colors.alpha(opacity100, 0.01),
      border: colors.alpha(opacity100, 0.06),
      background,
    };
  }, [basicAsset.colors?.primary]);

  return (
    <ExpandedAssetSheetContext.Provider
      value={{
        accentColors,
        basicAsset,
        accountAsset,
        assetMetadata: metadata,
        expandedSections,
        isOwnedAsset,
      }}
    >
      {children}
    </ExpandedAssetSheetContext.Provider>
  );
}

import { ParsedAddressAsset } from '@/entities';
import { useAccountSettings, useAdditionalAssetData } from '@/hooks';
import { TokenMetadata } from '@/hooks/useAdditionalAssetData';
import useAccountAsset from '@/hooks/useAccountAsset';
import { colors } from '@/styles';
import { getUniqueId } from '@/utils/ethereumUtils';
import chroma from 'chroma-js';
import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { SharedValue, useSharedValue } from 'react-native-reanimated';
import { ChainId } from '@/state/backendNetworks/types';
import { TrendingToken } from '@/resources/trendingTokens/trendingTokens';
import { UniqueId } from '@/__swaps__/types/assets';
import { isNativeAsset } from '@/handlers/assets';
import { TokenColors } from '@/graphql/__generated__/metadata';
import { extractColorValueForColors } from '@/__swaps__/utils/swaps';
import { ETH_COLOR, ETH_COLOR_DARK } from '@/__swaps__/screens/Swap/constants';
import { useColorMode } from '@/design-system';
import { FormattedExternalAsset } from '@/resources/assets/externalAssetsQuery';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
// import { useTokenMetadataStore } from '@/resources/tokenMetadata/tokenMetadata';

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
  opacity4: string;
  opacity3: string;
  opacity2: string;
  opacity1: string;
  color: string;
  background: string;
  border: string;
  borderSecondary: string;
  surface: string;
  surfaceSecondary: string;
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

type ParamToken = ParsedAddressAsset | TrendingToken | FormattedExternalAsset;

export type BasicAsset = {
  chainId: ChainId;
  address: string;
  network: string;
  colors: TokenColors | undefined;
  uniqueId: UniqueId;
  name: string;
  symbol: string;
  decimals: number;
  icon_url: string | undefined;
  isNativeAsset: boolean;
  transferable: boolean;
  price: {
    relative_change_24h: number | undefined;
    value: number | undefined;
  };
  creationDate: string | null;
};

function isTrendingToken(token: ParamToken): token is TrendingToken {
  return 'highlightedFriends' in token;
}

function isFormattedExternalAsset(token: ParamToken): token is FormattedExternalAsset {
  return 'transferable' in token;
}

function normalizeTrendingToken({ token, chainId, chainName }: { token: TrendingToken; chainId: ChainId; chainName: string }): BasicAsset {
  return {
    chainId,
    address: token.address,
    uniqueId: getUniqueId(token.address, chainId),
    network: chainName,
    name: token.name,
    symbol: token.symbol,
    decimals: token.decimals,
    icon_url: token.icon_url,
    isNativeAsset: isNativeAsset(token.address, token.chainId),
    colors: token.colors,
    transferable: token.transferable,
    price: {
      relative_change_24h: token.priceChange.day,
      value: token.price,
    },
    creationDate: token.creationDate,
  };
}

function normalizeParsedAddressAsset({
  token,
  chainId,
  chainName,
}: {
  token: ParsedAddressAsset;
  chainId: ChainId;
  chainName: string;
}): BasicAsset {
  return {
    chainId: chainId,
    address: token.address,
    uniqueId: getUniqueId(token.address, chainId),
    network: chainName,
    name: token.name,
    symbol: token.symbol,
    decimals: token.decimals,
    icon_url: token.icon_url,
    isNativeAsset: isNativeAsset(token.address, chainId),
    colors: token.colors,
    transferable: true,
    price: {
      relative_change_24h: token.price?.relative_change_24h,
      value: token.price?.value,
    },
    creationDate: null,
  };
}

function normalizeFormattedExternalAsset({
  token,
  chainId,
  chainName,
}: {
  token: FormattedExternalAsset;
  chainId: ChainId;
  chainName: string;
}): BasicAsset {
  return {
    chainId: chainId,
    address: token.address,
    uniqueId: getUniqueId(token.address, chainId),
    network: chainName,
    name: token.name,
    symbol: token.symbol,
    decimals: token.decimals,
    icon_url: token.icon_url,
    isNativeAsset: isNativeAsset(token.address, chainId),
    colors: token.colors,
    transferable: token.transferable,
    price: {
      relative_change_24h: token.price?.relativeChange24h ?? undefined,
      value: token.price?.value ?? undefined,
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
  asset: ParamToken;
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
  const { isDarkMode } = useColorMode();
  const expandedSections = useSharedValue<Record<SectionId, boolean>>(DEFAULT_SECTIONS_STATE);
  const assetUniqueId = getUniqueId(address, chainId);
  const accountAsset = useAccountAsset(assetUniqueId, nativeCurrency);
  const isOwnedAsset = !!accountAsset;

  const basicAsset = useMemo(() => {
    const chainNameById = useBackendNetworksStore.getState().getChainsName();
    const chainName = chainNameById[chainId];

    if (isTrendingToken(asset)) return normalizeTrendingToken({ token: asset, chainId, chainName });
    if (isFormattedExternalAsset(asset)) return normalizeFormattedExternalAsset({ token: asset, chainId, chainName });
    return normalizeParsedAddressAsset({ token: asset, chainId, chainName });
  }, [asset, chainId]);

  const { data: metadata } = useAdditionalAssetData({
    address,
    chainId,
    currency: nativeCurrency,
  });

  const getAssetColor = useCallback(
    (asset: BasicAsset) => {
      const isAssetEth = asset.isNativeAsset && asset.symbol === 'ETH';
      const color = asset.colors?.primary ?? asset.colors?.fallback ?? ETH_COLOR;
      return isAssetEth ? (isDarkMode ? ETH_COLOR_DARK : ETH_COLOR) : color;
    },
    [isDarkMode]
  );

  const assetColor = getAssetColor(basicAsset);

  // const extractedColors = extractColorValueForColors({ colors: basicAsset.colors });

  const accentColors: AccentColors = useMemo(() => {
    const background = chroma(
      chroma(assetColor)
        .rgb()
        .map(channel => Math.round(channel * (1 - 0.8) + 0 * 0.8))
    ).css();

    return {
      opacity100: assetColor,
      opacity80: colors.alpha(assetColor, 0.8),
      opacity56: colors.alpha(assetColor, 0.56),
      opacity24: colors.alpha(assetColor, 0.24),
      opacity12: colors.alpha(assetColor, 0.12),
      opacity10: colors.alpha(assetColor, 0.1),
      opacity6: colors.alpha(assetColor, 0.06),
      opacity4: colors.alpha(assetColor, 0.04),
      opacity3: colors.alpha(assetColor, 0.03),
      opacity2: colors.alpha(assetColor, 0.02),
      opacity1: colors.alpha(assetColor, 0.01),
      color: assetColor,
      border: colors.alpha(assetColor, 0.03),
      borderSecondary: colors.alpha(assetColor, 0.02),
      surface: colors.alpha(assetColor, 0.06),
      surfaceSecondary: colors.alpha(assetColor, 0.03),
      background: background,
    };
  }, [assetColor]);

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

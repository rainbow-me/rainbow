import { ParsedAddressAsset } from '@/entities';
import { useAccountSettings, useAdditionalAssetData, useColorForAsset } from '@/hooks';
import { TokenMetadata } from '@/hooks/useAdditionalAssetData';
import useAccountAsset from '@/hooks/useAccountAsset';
import { getUniqueId } from '@/utils/ethereumUtils';
import chroma from 'chroma-js';
import React, { createContext, useContext, useMemo } from 'react';
import { SharedValue, useSharedValue } from 'react-native-reanimated';
import { ChainId } from '@/state/backendNetworks/types';
import { TrendingToken } from '@/resources/trendingTokens/trendingTokens';
import { UniqueId } from '@/__swaps__/types/assets';
import { isNativeAsset } from '@/handlers/assets';
import { Token } from '@/graphql/__generated__/metadata';
import { useColorMode } from '@/design-system';
import { FormattedExternalAsset, useExternalToken } from '@/resources/assets/externalAssetsQuery';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { EnrichedExchangeAsset } from '@/components/ExchangeAssetList';
import { useTheme } from '@/theme';
import { time } from '@/utils';
import { extractColorValueForColors } from '@/__swaps__/utils/swaps';

export enum SectionId {
  PROFIT = 'profit',
  MARKET_STATS = 'marketStats',
  BUY = 'buy',
  BRIDGE = 'bridge',
  HISTORY = 'history',
  HOLDERS = 'holders',
  ABOUT = 'about',
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
  textOnAccent: string;
  background: string;
  border: string;
  borderSecondary: string;
  surface: string;
  surfaceSecondary: string;
}
// We can receive a variety of assets as param depending on where we navigated from
export type ExpandedSheetParamAsset = ParsedAddressAsset | TrendingToken | FormattedExternalAsset | EnrichedExchangeAsset;

export type BasicAsset = Pick<
  Token,
  'decimals' | 'iconUrl' | 'name' | 'networks' | 'symbol' | 'colors' | 'price' | 'transferable' | 'creationDate'
> & {
  address: string;
  chainId: ChainId;
  uniqueId: UniqueId;
  network: string;
  isNativeAsset: boolean;
};

export type ExpandedSheetAsset = BasicAsset | (BasicAsset & FormattedExternalAsset);

type ExpandedAssetSheetContextType = {
  accentColors: AccentColors;
  basicAsset: ExpandedSheetAsset;
  accountAsset: ParsedAddressAsset | undefined;
  assetMetadata: TokenMetadata | null | undefined;
  expandedSections: SharedValue<Record<SectionId, boolean>>;
  isOwnedAsset: boolean;
  isLoadingMetadata: boolean;
};

type ExpandedAssetSheetContextProviderProps = {
  asset: ExpandedSheetParamAsset;
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
  const { colors } = useTheme();

  const expandedSections = useSharedValue<Record<SectionId, boolean>>(DEFAULT_SECTIONS_STATE);
  const assetUniqueId = getUniqueId(address, chainId);
  const accountAsset = useAccountAsset(assetUniqueId, nativeCurrency);
  const isOwnedAsset = !!accountAsset;

  // The asset is fetched regardless of the information in param so that we do not have to be concerned with the staleness of the data or missing fields
  const { data: externalAsset } = useExternalToken(
    {
      address,
      chainId,
      currency: nativeCurrency,
    },
    {
      // We're okay with initially showing stale data
      keepPreviousData: true,
      // We always want to know the latest price
      staleTime: time.zero,
      // Refetch at the same interval as the chart data
      refetchInterval: time.seconds(30),
    }
  );

  // This is constructed so that rendering is not delayed by the external asset fetch
  const basicAsset = useMemo(() => {
    const chainNameById = useBackendNetworksStore.getState().getChainsName();
    const chainName = chainNameById[chainId];
    const assetColors = 'color' in asset && asset.color ? { primary: asset.color } : asset.colors;

    const base: BasicAsset = {
      chainId,
      address,
      uniqueId: assetUniqueId,
      network: chainName,
      name: asset.name,
      symbol: asset.symbol,
      decimals: asset.decimals,
      iconUrl: asset.icon_url,
      isNativeAsset: isNativeAsset(address, chainId),
      colors: assetColors ?? { primary: colors.blueGreyDark },
      transferable: 'transferable' in asset ? asset.transferable : true,
      networks: 'networks' in asset ? asset.networks : {},
      price: {
        relativeChange24h: null,
        value: null,
      },
      creationDate: 'creationDate' in asset ? asset.creationDate : null,
    };

    if ('price' in asset && typeof asset.price === 'object') {
      if ('relativeChange24h' in asset.price) {
        base.price.relativeChange24h = asset.price.relativeChange24h ?? null;
      }
      if ('relative_change_24h' in asset.price) {
        base.price.relativeChange24h = asset.price.relative_change_24h ?? null;
      }
      if ('value' in asset.price) {
        base.price.value = asset.price.value ?? null;
      }
    }

    // TrendingToken format
    if ('price' in asset && typeof asset.price === 'number') {
      base.price.value = asset.price;
    }
    if ('priceChange' in asset && typeof asset.priceChange === 'object') {
      base.price.relativeChange24h = asset.priceChange.day ?? null;
    }

    return base;
  }, [address, asset, assetUniqueId, chainId, colors]);

  const fullAsset = useMemo(() => {
    if (externalAsset)
      return {
        ...basicAsset,
        ...externalAsset,
      } satisfies ExpandedSheetAsset;
    return basicAsset;
  }, [externalAsset, basicAsset]);

  // @ts-expect-error: the field with a type difference is not used & irrelevant to the hook (price)
  const assetColor = useColorForAsset(fullAsset);

  const { data: metadata, isLoading: isLoadingMetadata } = useAdditionalAssetData({
    address,
    chainId,
    currency: nativeCurrency,
  });

  const accentColors: AccentColors = useMemo(() => {
    const background = isDarkMode
      ? chroma(
          chroma(assetColor)
            .rgb()
            .map(channel => Math.round(channel * (1 - 0.8) + 0 * 0.8))
        ).css()
      : colors.white;

    const { textColor } = extractColorValueForColors({
      colors: {
        primary: assetColor,
      },
    });

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
      textOnAccent: textColor[isDarkMode ? 'dark' : 'light'],
      border: colors.alpha(assetColor, 0.03),
      borderSecondary: colors.alpha(assetColor, 0.02),
      surface: colors.alpha(assetColor, 0.06),
      surfaceSecondary: colors.alpha(assetColor, 0.03),
      background: background,
    };
  }, [assetColor, colors, isDarkMode]);

  return (
    <ExpandedAssetSheetContext.Provider
      value={{
        accentColors,
        basicAsset: fullAsset,
        accountAsset,
        assetMetadata: metadata,
        expandedSections,
        isOwnedAsset,
        isLoadingMetadata,
      }}
    >
      {children}
    </ExpandedAssetSheetContext.Provider>
  );
}

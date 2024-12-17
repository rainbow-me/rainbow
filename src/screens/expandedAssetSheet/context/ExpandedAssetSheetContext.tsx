import { ParsedAddressAsset } from '@/entities';
import { colors } from '@/styles';
import React, { createContext, useContext, useMemo } from 'react';
import { SharedValue, useSharedValue } from 'react-native-reanimated';

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

type ExpandedAssetSheetContextType = {
  accentColors: AccentColors;
  asset: ParsedAddressAsset;
  expandedSections: SharedValue<Record<SectionId, boolean>>;
};

const ExpandedAssetSheetContext = createContext<ExpandedAssetSheetContextType | undefined>(undefined);

export function useExpandedAssetSheetContext() {
  const context = useContext(ExpandedAssetSheetContext);
  if (context === undefined) {
    throw new Error('useExpandedAssetSheetContext must be used within an ExpandedAssetSheetContextProvider');
  }
  return context;
}

export function ExpandedAssetSheetContextProvider({ asset, children }: { asset: ParsedAddressAsset; children: React.ReactNode }) {
  const expandedSections = useSharedValue<Record<SectionId, boolean>>(DEFAULT_SECTIONS_STATE);

  const accentColors: AccentColors = useMemo(() => {
    const opacity100 = asset.colors?.primary as string;

    return {
      opacity100,
      opacity56: colors.alpha(opacity100, 0.56),
      opacity24: colors.alpha(opacity100, 0.24),
      opacity12: colors.alpha(opacity100, 0.12),
      opacity10: colors.alpha(opacity100, 0.1),
      opacity6: colors.alpha(opacity100, 0.06),
      opacity3: colors.alpha(opacity100, 0.03),
      opacity2: colors.alpha(opacity100, 0.02),
    };
  }, [asset.colors?.primary]);

  return (
    <ExpandedAssetSheetContext.Provider
      value={{
        accentColors,
        asset,
        expandedSections,
      }}
    >
      {children}
    </ExpandedAssetSheetContext.Provider>
  );
}

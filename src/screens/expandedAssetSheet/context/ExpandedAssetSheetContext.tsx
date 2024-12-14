import React, { createContext, useContext } from 'react';
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

export function ExpandedAssetSheetContextProvider({ children }: { children: React.ReactNode }) {
  const expandedSections = useSharedValue<Record<SectionId, boolean>>(DEFAULT_SECTIONS_STATE);

  return (
    <ExpandedAssetSheetContext.Provider
      value={{
        expandedSections,
      }}
    >
      {children}
    </ExpandedAssetSheetContext.Provider>
  );
}

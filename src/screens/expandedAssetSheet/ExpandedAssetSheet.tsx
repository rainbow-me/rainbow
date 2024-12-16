import React from 'react';
import { ExpandedAssetSheetContextProvider } from './context/ExpandedAssetSheetContext';
import { ParsedAddressAsset } from '@/entities';
import { RouteProp, useRoute } from '@react-navigation/native';
import { SheetContent } from './components/SheetContent';

export type ExpandedAssetSheetParams = {
  asset: ParsedAddressAsset;
};

type RouteParams = {
  ExpandedAssetSheetParams: ExpandedAssetSheetParams;
};

export function ExpandedAssetSheet() {
  const {
    params: { asset },
  } = useRoute<RouteProp<RouteParams, 'ExpandedAssetSheetParams'>>();

  return (
    <ExpandedAssetSheetContextProvider asset={asset}>
      <SheetContent />
    </ExpandedAssetSheetContextProvider>
  );
}

import { requireNativeComponent, ViewProps } from 'react-native';
import { memo } from 'react';
export const RecyclerListView = memo(
  requireNativeComponent<
    ViewProps & {
      count: number;
      id: number;
      identifier: number;
      onRefresh?: () => void;
      isRefreshing: boolean;
    }
  >('RecyclerListView')
);
export const RecyclerRow = requireNativeComponent('RecyclerRow');
export const RecyclerRowWrapper = requireNativeComponent('RecyclerRowWrapper');
export const CellStorage = requireNativeComponent('CellStorage');
export const UltraFastTextWrapper = requireNativeComponent(
  'UltraFastTextWrapper'
);

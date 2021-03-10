import { createRef } from 'react';
import { RecyclerListView } from 'recyclerlistview';
import {
  RecyclerListViewProps,
  RecyclerListViewState,
} from 'recyclerlistview/dist/reactnative/core/RecyclerListView';

export type RecyclerListViewRef = RecyclerListView<
  RecyclerListViewProps,
  RecyclerListViewState
>;

export type Shared = {
  globalDeviceDimensions: number;
  smallBalancedChanged: boolean;
  coinDividerIndex: number;
  rlv: RecyclerListViewRef;
};

export default ((): Shared => {
  let globalDeviceDimensions = 0;
  let smallBalancedChanged = false;
  let coinDividerIndex: number = -1;
  let rlv = (createRef() as unknown) as RecyclerListViewRef;

  return {
    get coinDividerIndex(): number {
      return coinDividerIndex;
    },
    set coinDividerIndex(nextCoinDividerIndex: number) {
      coinDividerIndex = nextCoinDividerIndex;
    },
    get globalDeviceDimensions(): number {
      return globalDeviceDimensions;
    },
    set globalDeviceDimensions(nextGlobalDeviceDimensions: number) {
      globalDeviceDimensions = nextGlobalDeviceDimensions;
    },
    get rlv(): RecyclerListViewRef {
      return rlv;
    },
    set rlv(next: RecyclerListViewRef) {
      rlv = next;
    },
    get smallBalancedChanged(): boolean {
      return smallBalancedChanged;
    },
    set smallBalancedChanged(nextSmallBalancedChanged: boolean) {
      smallBalancedChanged = nextSmallBalancedChanged;
    },
  };
})();

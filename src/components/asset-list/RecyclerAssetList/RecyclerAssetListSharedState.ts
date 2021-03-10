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
  //smallBalancedChanged: boolean;
  rlv: RecyclerListViewRef;
};

export default ((): Shared => {
  let rlv = (createRef() as unknown) as RecyclerListViewRef;

  return {
    get rlv(): RecyclerListViewRef {
      return rlv;
    },
    set rlv(next: RecyclerListViewRef) {
      rlv = next;
    },
  };
})();

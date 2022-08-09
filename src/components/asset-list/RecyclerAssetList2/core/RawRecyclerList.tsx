import React, {
  LegacyRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { LayoutChangeEvent } from 'react-native';
import { SetterOrUpdater } from 'recoil';
import { DataProvider, RecyclerListView } from 'recyclerlistview';
import { useMemoOne } from 'use-memo-one';
import { BooleanMap } from '../../../../hooks/useCoinListEditOptions';
import { AssetListType } from '..';
import { useRecyclerAssetListPosition } from './Contexts';
import ExternalENSProfileScrollViewWithRef from './ExternalENSProfileScrollView';
import ExternalScrollViewWithRef from './ExternalScrollView';
import RefreshControl from './RefreshControl';
import rowRenderer from './RowRenderer';
import { BaseCellType, CellTypes, RecyclerListViewRef } from './ViewTypes';
import getLayoutProvider from './getLayoutProvider';
import useLayoutItemAnimator from './useLayoutItemAnimator';
import { UniqueAsset } from '@rainbow-me/entities';
import {
  useAccountSettings,
  useCoinListEdited,
  useCoinListEditOptions,
} from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import { useTheme } from '@rainbow-me/theme';

const dataProvider = new DataProvider((r1, r2) => {
  return r1.uid !== r2.uid;
});

export type ExtendedState = {
  theme: any;
  nativeCurrencySymbol: string;
  nativeCurrency: string;
  navigate: any;
  isCoinListEdited: boolean;
  hiddenCoins: BooleanMap;
  pinnedCoins: BooleanMap;
  toggleSelectedCoin: (id: string) => void;
  setIsCoinListEdited: SetterOrUpdater<boolean>;
  additionalData: Record<string, CellTypes>;
  externalAddress?: string;
  onPressUniqueToken?: (asset: UniqueAsset) => void;
};

const RawMemoRecyclerAssetList = React.memo(function RawRecyclerAssetList({
  briefSectionsData,
  extendedState,
  type,
}: {
  briefSectionsData: BaseCellType[];
  type?: AssetListType;
  extendedState: Partial<ExtendedState> & Pick<ExtendedState, 'additionalData'>;
}) {
  const currentDataProvider = useMemoOne(
    () => dataProvider.cloneWithRows(briefSectionsData),
    [briefSectionsData]
  );
  const { isCoinListEdited, setIsCoinListEdited } = useCoinListEdited();
  const y = useRecyclerAssetListPosition()!;

  const layoutProvider = useMemoOne(
    () => getLayoutProvider(briefSectionsData, isCoinListEdited),
    [briefSectionsData]
  );

  const { accountAddress } = useAccountSettings();

  const topMarginRef = useRef<number>(0);

  const ref = useRef<RecyclerListViewRef>();

  useEffect(() => {
    if (ios) {
      return;
    }
    // this is hacky, but let me explain what's happening here:
    // RecyclerListView is trying to persist the position while updating the component.
    // Therefore, internally the library wants to scroll to old position.
    // However, Android is setting the position to 0, because there's no content so
    // the event has no effect on content position and this is set to 0 as expected.
    // To avoid generating this nonsense event, I firstly set internally the position to 0.
    // Then the update might happen, but this is OK, because I overrode the position
    // with `updateOffset` method. However, this is happening inside `setTimeout`
    // so the callback might be already scheduled (this is a race condition, happens randomly).
    // We need to clear this scheduled event with `clearTimeout` method.
    // Then, in case the event was not emitted, we want to emit this anyway (`scrollToOffset`)
    // to make headers located in `0` position.
    // @ts-ignore
    ref.current?._virtualRenderer
      ?.getViewabilityTracker?.()
      ?.updateOffset?.(0, true, 0);
    // @ts-ignore
    clearTimeout(ref.current?._processInitialOffsetTimeout);
    ref.current?.scrollToOffset(0, 0);
    y.setValue(0);
  }, [y, accountAddress]);

  const onLayout = useCallback(
    () => ({ nativeEvent }: LayoutChangeEvent) => {
      topMarginRef.current = nativeEvent.layout.y;
    },
    []
  );

  const layoutItemAnimator = useLayoutItemAnimator(ref, topMarginRef);

  const theme = useTheme();
  const { nativeCurrencySymbol, nativeCurrency } = useAccountSettings();
  const {
    hiddenCoinsObj: hiddenCoins,
    pinnedCoinsObj: pinnedCoins,
    toggleSelectedCoin,
  } = useCoinListEditOptions();

  const { navigate } = useNavigation();

  const mergedExtendedState = useMemo<ExtendedState>(() => {
    return {
      ...extendedState,
      hiddenCoins,
      isCoinListEdited,
      nativeCurrency,
      nativeCurrencySymbol,
      navigate,
      pinnedCoins,
      setIsCoinListEdited,
      theme,
      toggleSelectedCoin,
    };
  }, [
    extendedState,
    theme,
    navigate,
    nativeCurrencySymbol,
    nativeCurrency,
    pinnedCoins,
    hiddenCoins,
    toggleSelectedCoin,
    isCoinListEdited,
    setIsCoinListEdited,
  ]);

  return (
    <RecyclerListView
      dataProvider={currentDataProvider}
      extendedState={mergedExtendedState}
      // @ts-ignore
      externalScrollView={
        type === 'ens-profile'
          ? ExternalENSProfileScrollViewWithRef
          : ExternalScrollViewWithRef
      }
      itemAnimator={layoutItemAnimator}
      layoutProvider={layoutProvider}
      onLayout={onLayout}
      ref={ref as LegacyRef<RecyclerListViewRef>}
      refreshControl={<RefreshControl />}
      renderAheadOffset={1000}
      rowRenderer={rowRenderer}
    />
  );
});

export default RawMemoRecyclerAssetList;

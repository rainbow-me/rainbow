import { UniqueId } from '@/__swaps__/types/assets';
import { useExperimentalConfig } from '@/config/experimentalHooks';
import { NativeCurrencyKey, UniqueAsset } from '@/entities';
import { useAccountSettings, useCoinListEdited, useCoinListEditOptions } from '@/hooks';
import { useRemoteConfig } from '@/model/remoteConfig';
import { useNavigation } from '@/navigation';
import { useRecyclerListViewScrollToTopContext } from '@/navigation/RecyclerListViewScrollToTopContext';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { useTheme } from '@/theme';
import { deviceUtils } from '@/utils';
import React, { LegacyRef, useCallback, useEffect, useMemo, useRef } from 'react';
import { LayoutChangeEvent } from 'react-native';
import { SetterOrUpdater } from 'recoil';
import { DataProvider, RecyclerListView } from 'recyclerlistview';
import { useMemoOne } from 'use-memo-one';
import { AssetListType } from '..';
import { BooleanMap } from '../../../../hooks/useCoinListEditOptions';
import { useRecyclerAssetListPosition } from './Contexts';
import { ExternalENSProfileScrollViewWithRef, ExternalSelectNFTScrollViewWithRef } from './ExternalENSProfileScrollView';
import ExternalScrollViewWithRef from './ExternalScrollView';
import RefreshControl from './RefreshControl';
import rowRenderer from './RowRenderer';
import { CellTypes, RecyclerListViewRef } from './ViewTypes';
import getLayoutProvider from './getLayoutProvider';
import useLayoutItemAnimator from './useLayoutItemAnimator';
import { useAccountAddress } from '../../../../state/wallets/walletsStore';

const dimensions = {
  height: deviceUtils.dimensions.height,
  width: deviceUtils.dimensions.width,
};

const dataProvider = new DataProvider((r1: CellTypes, r2: CellTypes) => {
  return r1.uid !== r2.uid;
});

export type ExtendedState = {
  theme: any;
  nativeCurrencySymbol: string;
  nativeCurrency: NativeCurrencyKey;
  navigate: any;
  isCoinListEdited: boolean;
  hiddenAssets: Set<UniqueId>;
  pinnedCoins: BooleanMap;
  toggleSelectedCoin: (id: string) => void;
  setIsCoinListEdited: SetterOrUpdater<boolean>;
  additionalData: Record<string, CellTypes>;
  externalAddress?: string;
  onPressUniqueToken?: (asset: UniqueAsset) => void;
};

const RawMemoRecyclerAssetList = React.memo(function RawRecyclerAssetList({
  briefSectionsData,
  disablePullDownToRefresh,
  scrollIndicatorInsets,
  extendedState,
  type,
}: {
  briefSectionsData: CellTypes[];
  disablePullDownToRefresh: boolean;
  extendedState: Partial<ExtendedState> & Pick<ExtendedState, 'additionalData'>;
  scrollIndicatorInsets?: object;
  type?: AssetListType;
}) {
  const remoteConfig = useRemoteConfig();
  const experimentalConfig = useExperimentalConfig();
  const currentDataProvider = useMemoOne(() => dataProvider.cloneWithRows(briefSectionsData), [briefSectionsData]);
  const { isCoinListEdited, setIsCoinListEdited } = useCoinListEdited();
  const y = useRecyclerAssetListPosition()!;
  const hiddenAssets = useUserAssetsStore(state => state.hiddenAssets);

  const layoutProvider = useMemo(
    () =>
      getLayoutProvider({
        briefSectionsData,
        isCoinListEdited,
        remoteConfig,
        experimentalConfig,
      }),
    [briefSectionsData, isCoinListEdited, remoteConfig, experimentalConfig]
  );

  const accountAddress = useAccountAddress();
  const { setScrollToTopRef } = useRecyclerListViewScrollToTopContext();

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
    ref.current?._virtualRenderer?.getViewabilityTracker?.()?.updateOffset?.(0, true, 0);
    // @ts-ignore
    clearTimeout(ref.current?._processInitialOffsetTimeout);
    ref.current?.scrollToOffset(0, 0);
    y.setValue(0);
  }, [y, accountAddress]);

  useEffect(() => {
    if (!ref.current) return;

    setScrollToTopRef(ref.current);
  }, [ref, setScrollToTopRef]);

  const onLayout = useCallback(
    () =>
      ({ nativeEvent }: LayoutChangeEvent) => {
        topMarginRef.current = nativeEvent.layout.y;
      },
    []
  );

  const layoutItemAnimator = useLayoutItemAnimator(ref, topMarginRef);

  const theme = useTheme();
  const { nativeCurrencySymbol, nativeCurrency } = useAccountSettings();
  const { pinnedCoinsObj: pinnedCoins, toggleSelectedCoin } = useCoinListEditOptions();

  const { navigate } = useNavigation();

  const mergedExtendedState = useMemo<ExtendedState>(() => {
    return {
      ...extendedState,
      isCoinListEdited,
      nativeCurrency,
      nativeCurrencySymbol,
      navigate,
      hiddenAssets,
      pinnedCoins,
      setIsCoinListEdited,
      theme,
      toggleSelectedCoin,
    };
  }, [
    extendedState,
    isCoinListEdited,
    nativeCurrency,
    nativeCurrencySymbol,
    navigate,
    hiddenAssets,
    pinnedCoins,
    setIsCoinListEdited,
    theme,
    toggleSelectedCoin,
  ]);

  return (
    <RecyclerListView
      automaticallyAdjustScrollIndicatorInsets={true}
      dataProvider={currentDataProvider}
      extendedState={mergedExtendedState}
      // @ts-ignore
      externalScrollView={
        type === 'ens-profile'
          ? ExternalENSProfileScrollViewWithRef
          : type === 'select-nft'
            ? ExternalSelectNFTScrollViewWithRef
            : ExternalScrollViewWithRef
      }
      itemAnimator={layoutItemAnimator}
      layoutProvider={layoutProvider}
      onLayout={onLayout}
      ref={ref as LegacyRef<RecyclerListViewRef>}
      refreshControl={disablePullDownToRefresh ? undefined : <RefreshControl />}
      renderAheadOffset={1000}
      rowRenderer={rowRenderer}
      canChangeSize={type === 'wallet'}
      layoutSize={type === 'wallet' ? dimensions : undefined}
      scrollIndicatorInsets={scrollIndicatorInsets}
    />
  );
});

export default RawMemoRecyclerAssetList;

import { map } from 'lodash';
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Animated, LayoutAnimation, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useRecyclerAssetListPosition } from '../asset-list/RecyclerAssetList2/core/Contexts';
import { StickyHeaderContext } from '../asset-list/RecyclerAssetList2/core/StickyHeaders';
import { Row, RowWithMargins } from '../layout';
import CoinDividerAssetsValue from './CoinDividerAssetsValue';
import CoinDividerEditButton from './CoinDividerEditButton';
import CoinDividerOpenButton from './CoinDividerOpenButton';
import EditAction from '@rainbow-me/helpers/EditAction';
import {
  useAccountSettings,
  useCoinListEdited,
  useCoinListEditOptions,
  useCoinListFinishEditingOptions,
  useDimensions,
  useOpenSmallBalances,
} from '@rainbow-me/hooks';
import { emitChartsRequest } from '@rainbow-me/redux/explorer';
import styled from 'styled-components';
import { padding } from '@rainbow-me/styles';

export const CoinDividerHeight = 30;
export const CoinDividerContainerHeight = CoinDividerHeight + 11;

const Container = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})({
  ...padding.object(5, 19, 6),
  backgroundColor: ({ isSticky, theme: { colors } }) =>
    isSticky ? colors.white : colors.transparent,
  height: CoinDividerContainerHeight,
  width: ({ deviceWidth }) => deviceWidth,
});

const CoinDividerButtonRow = styled(RowWithMargins).attrs(
  ({ isCoinListEdited }) => ({
    margin: 10,
    pointerEvents: isCoinListEdited ? 'auto' : 'none',
  })
)({
  position: 'absolute',
});

const EditButtonWrapper = styled(Row).attrs({
  align: 'end',
})({
  position: 'absolute',
  right: 0,
});

const useInterpolationRange = () => {
  const { isCoinListEdited } = useCoinListEdited();
  const position = useRecyclerAssetListPosition();
  const ref = useRef();

  const { scrollViewRef } = useContext(StickyHeaderContext) || {};
  const [range, setRanges] = useState([0, 0]);
  const onLayout = useCallback(() => {
    const nativeScrollRef = scrollViewRef?.current?.getNativeScrollRef();
    if (!nativeScrollRef) {
      return;
    }
    ref.current?.measureLayout?.(
      nativeScrollRef,
      (_left, top) => {
        setRanges([top - 50, top]);
      },
      () => {}
    );
  }, [scrollViewRef]);
  return {
    onLayout,
    ref,
    style: {
      transform: [
        {
          translateY:
            position?.interpolate({
              extrapolateLeft: 'clamp',
              extrapolateRight: 'extend',
              inputRange: range,
              outputRange: range.map(r =>
                isCoinListEdited ? r - range[0] : 0
              ),
            }) ?? 0,
        },
      ],
    },
  };
};

export default function CoinDivider({ balancesSum }) {
  const interpolation = useInterpolationRange();
  const { nativeCurrency } = useAccountSettings();
  const dispatch = useDispatch();
  const assets = useSelector(({ data: { assets } }) => assets);

  const [fetchedCharts, setFetchedCharts] = useState(false);
  const { width: deviceWidth } = useDimensions();

  const { clearSelectedCoins } = useCoinListEditOptions();

  const {
    currentAction,
    setHiddenCoins,
    setPinnedCoins,
  } = useCoinListFinishEditingOptions();

  const { isCoinListEdited, setIsCoinListEdited } = useCoinListEdited();

  const {
    isSmallBalancesOpen,
    toggleOpenSmallBalances,
  } = useOpenSmallBalances();

  useEffect(() => {
    if (isSmallBalancesOpen && !fetchedCharts) {
      const assetCodes = map(assets, 'address');
      dispatch(emitChartsRequest(assetCodes));
      setFetchedCharts(true);
    }
  }, [
    assets,
    dispatch,
    fetchedCharts,
    isSmallBalancesOpen,
    toggleOpenSmallBalances,
  ]);

  const handlePressEdit = useCallback(() => {
    setIsCoinListEdited(prev => !prev);
    clearSelectedCoins();
    LayoutAnimation.configureNext(
      LayoutAnimation.create(200, 'easeInEaseOut', 'opacity')
    );
  }, [clearSelectedCoins, setIsCoinListEdited]);

  return (
    <Animated.View {...interpolation}>
      <Container deviceWidth={deviceWidth} isSticky>
        <Row>
          <View pointerEvents={isCoinListEdited ? 'none' : 'auto'}>
            <CoinDividerOpenButton
              coinDividerHeight={CoinDividerHeight}
              isSmallBalancesOpen={isSmallBalancesOpen}
              isVisible={isCoinListEdited}
              onPress={toggleOpenSmallBalances}
            />
          </View>
          <CoinDividerButtonRow isCoinListEdited={isCoinListEdited}>
            <CoinDividerEditButton
              isActive={currentAction !== EditAction.none}
              isVisible={isCoinListEdited}
              onPress={setPinnedCoins}
              shouldReloadList
              text={currentAction === EditAction.unpin ? 'Unpin' : 'Pin'}
            />
            <CoinDividerEditButton
              isActive={currentAction !== EditAction.none}
              isVisible={isCoinListEdited}
              onPress={setHiddenCoins}
              shouldReloadList
              text={currentAction === EditAction.unhide ? 'Unhide' : 'Hide'}
            />
          </CoinDividerButtonRow>
        </Row>
        <Row justify="end">
          <CoinDividerAssetsValue
            balancesSum={balancesSum}
            nativeCurrency={nativeCurrency}
            openSmallBalances={isSmallBalancesOpen}
          />
          <EditButtonWrapper
            pointerEvents={
              isCoinListEdited || isSmallBalancesOpen ? 'auto' : 'none'
            }
          >
            <CoinDividerEditButton
              isActive={isCoinListEdited}
              isVisible={isCoinListEdited || isSmallBalancesOpen}
              onPress={handlePressEdit}
              text={isCoinListEdited ? 'Done' : 'Edit'}
              textOpacityAlwaysOn
            />
          </EditButtonWrapper>
        </Row>
      </Container>
    </Animated.View>
  );
}

import lang from 'i18n-js';
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
  useCoinListEditOptions,
  useCoinListFinishEditingOptions,
  useDimensions,
  useOpenSmallBalances,
} from '@rainbow-me/hooks';
import { emitChartsRequest } from '@rainbow-me/redux/explorer';
import styled from '@rainbow-me/styled-components';
import { padding } from '@rainbow-me/styles';

export const CoinDividerHeight = 30;
export const CoinDividerContainerHeight = CoinDividerHeight + 11;

const Container = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})({
  ...padding.object(4, 19, 5, 0),
  backgroundColor: ({ isCoinListEdited, theme: { colors } }) =>
    isCoinListEdited ? colors.white : colors.transparent,
  height: CoinDividerContainerHeight,
  width: ({ deviceWidth }) => deviceWidth,
});

const CoinDividerButtonRow = styled(RowWithMargins).attrs(
  ({ isCoinListEdited }) => ({
    margin: 10,
    paddingHorizontal: 19,
    paddingVertical: 5,
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

const useInterpolationRange = isCoinListEdited => {
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
          translateY: isCoinListEdited
            ? position?.interpolate({
                extrapolateLeft: 'clamp',
                extrapolateRight: 'extend',
                inputRange: range,
                outputRange: range.map(r => r - range[0]),
              })
            : 0,
        },
      ],
    },
  };
};

export default function CoinDivider({
  balancesSum,
  defaultToEditButton,
  extendedState,
}) {
  const { isCoinListEdited, setIsCoinListEdited } = extendedState;
  const interpolation = useInterpolationRange(isCoinListEdited);
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

  const {
    isSmallBalancesOpen,
    toggleOpenSmallBalances,
  } = useOpenSmallBalances();

  useEffect(() => {
    if (isSmallBalancesOpen && !fetchedCharts) {
      const assetCodes = assets?.map(asset => asset.address);
      dispatch(emitChartsRequest(assetCodes ?? []));
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
      <Container deviceWidth={deviceWidth} isCoinListEdited={isCoinListEdited}>
        <Row>
          <View
            opacity={defaultToEditButton || isCoinListEdited ? 0 : 1}
            pointerEvents={
              defaultToEditButton || isCoinListEdited ? 'none' : 'auto'
            }
          >
            <CoinDividerOpenButton
              coinDividerHeight={CoinDividerHeight}
              isSmallBalancesOpen={isSmallBalancesOpen}
              isVisible={defaultToEditButton || isCoinListEdited}
              onPress={toggleOpenSmallBalances}
            />
          </View>
          <CoinDividerButtonRow isCoinListEdited={isCoinListEdited}>
            <CoinDividerEditButton
              isActive={currentAction !== EditAction.none}
              isVisible={isCoinListEdited}
              onPress={setPinnedCoins}
              shouldReloadList
              text={
                currentAction === EditAction.unpin
                  ? lang.t('button.unpin')
                  : lang.t('button.pin')
              }
            />
            <CoinDividerEditButton
              isActive={currentAction !== EditAction.none}
              isVisible={isCoinListEdited}
              onPress={setHiddenCoins}
              shouldReloadList
              text={
                currentAction === EditAction.unhide
                  ? lang.t('button.unhide')
                  : lang.t('button.hide')
              }
            />
          </CoinDividerButtonRow>
        </Row>
        <Row justify="end">
          <CoinDividerAssetsValue
            balancesSum={balancesSum}
            nativeCurrency={nativeCurrency}
            openSmallBalances={defaultToEditButton || isSmallBalancesOpen}
          />
          <EditButtonWrapper
            pointerEvents={
              defaultToEditButton || isCoinListEdited || isSmallBalancesOpen
                ? 'auto'
                : 'none'
            }
          >
            <CoinDividerEditButton
              isActive={isCoinListEdited}
              isVisible={
                defaultToEditButton || isCoinListEdited || isSmallBalancesOpen
              }
              onPress={handlePressEdit}
              text={
                isCoinListEdited ? lang.t('button.done') : lang.t('button.edit')
              }
              textOpacityAlwaysOn
            />
          </EditButtonWrapper>
        </Row>
      </Container>
    </Animated.View>
  );
}

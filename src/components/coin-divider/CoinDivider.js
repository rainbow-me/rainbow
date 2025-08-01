import lang from 'i18n-js';
import React, { useCallback, useContext, useRef, useState, memo } from 'react';
import { Animated, LayoutAnimation, View } from 'react-native';
import { useRecyclerAssetListPosition } from '../asset-list/RecyclerAssetList2/core/Contexts';
import { StickyHeaderContext } from '../asset-list/RecyclerAssetList2/core/StickyHeaders';
import { Row, RowWithMargins } from '../layout';
import CoinDividerAssetsValue from './CoinDividerAssetsValue';
import CoinDividerEditButton from './CoinDividerEditButton';
import CoinDividerOpenButton from './CoinDividerOpenButton';
import EditAction from '@/helpers/EditAction';
import { navbarHeight } from '@/components/navbar/Navbar';
import { useCoinListEditOptions, useCoinListFinishEditingOptions, useDimensions } from '@/hooks';
import styled from '@/styled-thing';
import { padding } from '@/styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOpenSmallBalances } from '@/state/wallets/smallBalancesStore';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';

export const CoinDividerHeight = 30;
export const CoinDividerContainerHeight = CoinDividerHeight + 11;

const Container = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})({
  ...padding.object(4, 19, 5, 0),
  backgroundColor: ({ isCoinListEdited, theme: { colors } }) => (isCoinListEdited ? colors.white : colors.transparent),
  height: CoinDividerContainerHeight,
  width: ({ deviceWidth }) => deviceWidth,
});

const CoinDividerButtonRow = styled(RowWithMargins).attrs(({ isCoinListEdited }) => ({
  margin: 10,
  paddingHorizontal: 19,
  paddingVertical: 5,
  pointerEvents: isCoinListEdited ? 'auto' : 'none',
}))({
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
  const { top: safeAreaInsetTop } = useSafeAreaInsets();

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
        setRanges([top - (navbarHeight + safeAreaInsetTop), top]);
      },
      () => {
        // empty (avoid formatter messing up)
      }
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

const CoinDivider = memo(function CoinDivider({ balancesSum, defaultToEditButton, extendedState }) {
  const { isCoinListEdited, setIsCoinListEdited } = extendedState;
  const interpolation = useInterpolationRange(isCoinListEdited);
  const nativeCurrency = userAssetsStoreManager(state => state.currency);

  const { width: deviceWidth } = useDimensions();

  const { clearSelectedCoins } = useCoinListEditOptions();

  const { currentAction, setHiddenCoins, setPinnedCoins } = useCoinListFinishEditingOptions();

  const { isSmallBalancesOpen, toggleOpenSmallBalances } = useOpenSmallBalances();

  const handlePressEdit = useCallback(() => {
    setIsCoinListEdited(prev => !prev);
    clearSelectedCoins();
    LayoutAnimation.configureNext(LayoutAnimation.create(200, 'easeInEaseOut', 'opacity'));
  }, [clearSelectedCoins, setIsCoinListEdited]);

  return (
    <Animated.View {...interpolation}>
      <Container deviceWidth={deviceWidth} isCoinListEdited={isCoinListEdited}>
        <Row>
          <View
            opacity={defaultToEditButton || isCoinListEdited ? 0 : 1}
            pointerEvents={defaultToEditButton || isCoinListEdited ? 'none' : 'auto'}
          >
            <CoinDividerOpenButton isSmallBalancesOpen={isSmallBalancesOpen} onPress={toggleOpenSmallBalances} />
          </View>
          <CoinDividerButtonRow isCoinListEdited={isCoinListEdited}>
            <CoinDividerEditButton
              isActive={currentAction !== EditAction.none}
              isVisible={isCoinListEdited}
              onPress={setPinnedCoins}
              shouldReloadList
              text={currentAction === EditAction.unpin ? lang.t('button.unpin') : lang.t('button.pin')}
            />
            <CoinDividerEditButton
              isActive={currentAction !== EditAction.none}
              isVisible={isCoinListEdited}
              onPress={setHiddenCoins}
              shouldReloadList
              text={currentAction === EditAction.unhide ? lang.t('button.unhide') : lang.t('button.hide')}
            />
          </CoinDividerButtonRow>
        </Row>
        <Row justify="end">
          <CoinDividerAssetsValue
            balancesSum={balancesSum}
            nativeCurrency={nativeCurrency}
            openSmallBalances={defaultToEditButton || isSmallBalancesOpen}
          />
          <EditButtonWrapper pointerEvents={defaultToEditButton || isCoinListEdited || isSmallBalancesOpen ? 'auto' : 'none'}>
            <CoinDividerEditButton
              isActive={isCoinListEdited}
              isVisible={defaultToEditButton || isCoinListEdited || isSmallBalancesOpen}
              onPress={handlePressEdit}
              text={isCoinListEdited ? lang.t('button.done') : lang.t('button.edit')}
              textOpacityAlwaysOn
            />
          </EditButtonWrapper>
        </Row>
      </Container>
    </Animated.View>
  );
});

export default CoinDivider;

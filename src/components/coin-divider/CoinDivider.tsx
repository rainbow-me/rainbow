import React, { memo, useCallback, useContext, useRef, useState } from 'react';
import { LayoutAnimation, Animated as RNAnimated, StyleSheet, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { navbarHeight } from '@/components/navbar/Navbar';
import { type NativeCurrencyKey } from '@/features/currency/types';
import { useCoinEditingStore } from '@/features/wallet/data/walletScreen/base/coinEditingStore';
import { editTokensActions } from '@/features/wallet/data/walletScreen/base/editStateStore';
import { selectedCoinsActions } from '@/features/wallet/data/walletScreen/base/selectedCoinsStore';
import { useCurrentWalletToggles, walletListTogglesActions } from '@/features/wallet/data/walletScreen/base/walletListTogglesStore';
import styled from '@/framework/ui/styled-thing';
import { EditAction } from '@/helpers/EditAction';
import useDimensions from '@/hooks/useDimensions';
import * as i18n from '@/languages';
import { padding } from '@/styles';
import { type ThemeContextProps } from '@/theme/ThemeContext';

import { useRecyclerAssetListPosition } from '../asset-list/RecyclerAssetList2/core/Contexts';
import { StickyHeaderContext } from '../asset-list/RecyclerAssetList2/core/StickyHeaders';
import { Row, RowWithMargins } from '../layout';
import CoinDividerAssetsValue from './CoinDividerAssetsValue';
import CoinDividerEditButton from './CoinDividerEditButton';
import CoinDividerOpenButton from './CoinDividerOpenButton';

export const CoinDividerHeight = 30;
export const CoinDividerContainerHeight = CoinDividerHeight + 11;

const Container = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})({
  ...padding.object(4, 19, 5, 0),
  backgroundColor: ({ isCoinListEdited, theme: { colors } }: { isCoinListEdited: boolean; theme: ThemeContextProps }) =>
    isCoinListEdited ? colors.white : colors.transparent,
  height: CoinDividerContainerHeight,
  width: ({ deviceWidth }: { deviceWidth: number }) => deviceWidth,
});

const CoinDividerButtonRow = styled(RowWithMargins).attrs(({ isCoinListEdited }: { isCoinListEdited: boolean }) => ({
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

const useInterpolationRange = (isCoinListEdited: boolean) => {
  const position = useRecyclerAssetListPosition();
  const ref = useRef<View>(null);
  const { top: safeAreaInsetTop } = useSafeAreaInsets();

  const { scrollViewRef } = useContext(StickyHeaderContext) || {};
  const [range, setRanges] = useState([0, 0]);
  const onLayout = useCallback(() => {
    const nativeScrollRef = scrollViewRef?.current?.getNativeScrollRef?.();
    if (!nativeScrollRef) {
      return;
    }
    ref.current?.measureLayout?.(
      nativeScrollRef,
      (_left: number, top: number) => {
        setRanges([top - (navbarHeight + safeAreaInsetTop), top]);
      },
      () => {
        // empty (avoid formatter messing up)
      }
    );
  }, [scrollViewRef, safeAreaInsetTop]);
  return {
    onLayout,
    ref,
    style: {
      transform: [
        {
          translateY: isCoinListEdited
            ? (position?.interpolate({
                extrapolateLeft: 'clamp',
                extrapolateRight: 'extend',
                inputRange: range,
                outputRange: range.map(r => r - range[0]),
              }) ?? 0)
            : 0,
        },
      ],
    },
  };
};

type CoinDividerProps = {
  balancesSum: number;
  defaultToEditButton: boolean;
  isCoinListEdited: boolean;
  nativeCurrency: NativeCurrencyKey;
};

const CoinDivider = memo(function CoinDivider({ balancesSum, defaultToEditButton, isCoinListEdited, nativeCurrency }: CoinDividerProps) {
  const containerProps = useInterpolationRange(isCoinListEdited);

  const { width: deviceWidth } = useDimensions();

  const { clearSelectedCoins } = selectedCoinsActions;

  const { currentAction, setHiddenCoins, setPinnedCoins } = useCoinEditingStore();

  const isSmallBalancesOpen = useCurrentWalletToggles(state => state.smallBalances);

  const handlePressEdit = useCallback(() => {
    editTokensActions.setIsCoinListEdited(prev => !prev);
    clearSelectedCoins();
    LayoutAnimation.configureNext(LayoutAnimation.create(200, 'easeInEaseOut', 'opacity'));
  }, [clearSelectedCoins]);

  return (
    <RNAnimated.View onLayout={containerProps.onLayout} ref={containerProps.ref} style={containerProps.style}>
      <Container deviceWidth={deviceWidth} isCoinListEdited={isCoinListEdited}>
        <Row>
          <View
            pointerEvents={defaultToEditButton || isCoinListEdited ? 'none' : 'auto'}
            style={defaultToEditButton || isCoinListEdited ? styles.transparent : styles.opaque}
          >
            <CoinDividerOpenButton isSmallBalancesOpen={isSmallBalancesOpen} onPress={toggleSmallBalances} />
          </View>
          <CoinDividerButtonRow isCoinListEdited={isCoinListEdited}>
            <CoinDividerEditButton
              isActive={currentAction !== EditAction.none}
              isVisible={isCoinListEdited}
              onPress={setPinnedCoins}
              shouldReloadList
              text={currentAction === EditAction.unpin ? i18n.t(i18n.l.button.unpin) : i18n.t(i18n.l.button.pin)}
            />
            <CoinDividerEditButton
              isActive={currentAction !== EditAction.none}
              isVisible={isCoinListEdited}
              onPress={setHiddenCoins}
              shouldReloadList
              text={currentAction === EditAction.unhide ? i18n.t(i18n.l.button.unhide) : i18n.t(i18n.l.button.hide)}
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
              text={isCoinListEdited ? i18n.t(i18n.l.button.done) : i18n.t(i18n.l.button.edit)}
              textOpacityAlwaysOn
            />
          </EditButtonWrapper>
        </Row>
      </Container>
    </RNAnimated.View>
  );
});

function toggleSmallBalances(): void {
  walletListTogglesActions.toggle('smallBalances');
}

const styles = StyleSheet.create({
  opaque: {
    opacity: 1,
  },
  transparent: {
    opacity: 0,
  },
});

export default CoinDivider;

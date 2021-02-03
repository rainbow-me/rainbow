import React, { useCallback, useEffect } from 'react';
import { LayoutAnimation, View } from 'react-native';
import styled from 'styled-components';
import { Row, RowWithMargins } from '../layout';
import CoinDividerAssetsValue from './CoinDividerAssetsValue';
import CoinDividerEditButton from './CoinDividerEditButton';
import CoinDividerOpenButton from './CoinDividerOpenButton';
import EditOptions from '@rainbow-me/helpers/editOptionTypes';
import {
  useCoinListEdited,
  useCoinListEditOptions,
  useDimensions,
  useOpenSmallBalances,
} from '@rainbow-me/hooks';
import { padding } from '@rainbow-me/styles';

export const CoinDividerHeight = 30;

const Container = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})`
  ${padding(5, 19, 6)};
  background-color: ${({ isSticky, theme: { colors } }) =>
    isSticky ? colors.white : colors.transparent};
  height: ${CoinDividerHeight + 11};
  width: ${({ deviceWidth }) => deviceWidth};
`;

const CoinDividerButtonRow = styled(RowWithMargins).attrs(
  ({ isCoinListEdited }) => ({
    margin: 10,
    pointerEvents: isCoinListEdited ? 'auto' : 'none',
  })
)`
  position: absolute;
`;

const EditButtonWrapper = styled(Row).attrs({
  align: 'end',
})`
  position: absolute;
  right: 0;
`;

export default function CoinDivider({
  balancesSum,
  isSticky,
  nativeCurrency,
  onEndEdit,
}) {
  const { width: deviceWidth } = useDimensions();

  const {
    clearSelectedCoins,
    currentAction,
    setHiddenCoins,
    setIsCoinListEdited,
    setPinnedCoins,
  } = useCoinListEditOptions();

  const { isCoinListEdited } = useCoinListEdited();

  const {
    isSmallBalancesOpen,
    toggleOpenSmallBalances,
  } = useOpenSmallBalances();

  const handlePressEdit = useCallback(() => {
    if (isCoinListEdited && onEndEdit) {
      onEndEdit();
    }
    setIsCoinListEdited(!isCoinListEdited);
    LayoutAnimation.configureNext(
      LayoutAnimation.create(200, 'easeInEaseOut', 'opacity')
    );
  }, [isCoinListEdited, onEndEdit, setIsCoinListEdited]);

  // Clear CoinListEditOptions selection queue on unmount.
  useEffect(() => () => clearSelectedCoins(), [clearSelectedCoins]);

  return (
    <Container deviceWidth={deviceWidth} isSticky={isSticky}>
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
            isActive={currentAction !== EditOptions.none}
            isVisible={isCoinListEdited}
            onPress={setPinnedCoins}
            shouldReloadList
            text={currentAction === EditOptions.unpin ? 'Unpin' : 'Pin'}
          />
          <CoinDividerEditButton
            isActive={currentAction !== EditOptions.none}
            isVisible={isCoinListEdited}
            onPress={setHiddenCoins}
            shouldReloadList
            text={currentAction === EditOptions.unhide ? 'Unhide' : 'Hide'}
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
  );
}

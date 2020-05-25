import React, { useCallback, useEffect, useRef } from 'react';
import { LayoutAnimation, View } from 'react-native';
import { SpringUtils } from 'react-native-reanimated';
import { bin, useSpringTransition } from 'react-native-redash';
import styled from 'styled-components/primitives';
import EditOptions from '../../helpers/editOptionTypes';
import {
  useCoinListEditOptions,
  useDimensions,
  useOpenSmallBalances,
} from '../../hooks';
import { colors, padding } from '../../styles';
import Highlight from '../Highlight';
import { Row, RowWithMargins } from '../layout';
import CoinDividerAssetsValue from './CoinDividerAssetsValue';
import CoinDividerEditButton from './CoinDividerEditButton';
import CoinDividerOpenButton from './CoinDividerOpenButton';

export const CoinDividerHeight = 30;

const springConfig = SpringUtils.makeConfigFromOrigamiTensionAndFriction({
  ...SpringUtils.makeDefaultConfig(),
  friction: 20,
  tension: 200,
});

const Container = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})`
  ${padding(5, 19, 6)};
  background-color: ${({ isSticky }) =>
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

const CoinDivider = ({
  assetsAmount,
  balancesSum,
  isCoinDivider,
  isSticky,
  nativeCurrency,
  onEndEdit,
}) => {
  const { width: deviceWidth } = useDimensions();
  const {
    currentAction,
    isCoinListEdited,
    setHiddenCoins,
    setIsCoinListEdited,
    setPinnedCoins,
  } = useCoinListEditOptions();
  const { isSmallBalancesOpen } = useOpenSmallBalances();

  const animation = useSpringTransition(bin(isSmallBalancesOpen), springConfig);

  const initialOpenState = useRef();

  useEffect(() => {
    initialOpenState.current = isSmallBalancesOpen;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePressEdit = useCallback(() => {
    if (isCoinListEdited && onEndEdit) {
      onEndEdit();
    }
    setIsCoinListEdited(!isCoinListEdited);
    LayoutAnimation.configureNext(
      LayoutAnimation.create(200, 'easeInEaseOut', 'opacity')
    );
  }, [isCoinListEdited, onEndEdit, setIsCoinListEdited]);

  return (
    <Container isSticky={isSticky} deviceWidth={deviceWidth}>
      <Highlight highlight={isCoinDivider} />
      <Row>
        <View
          pointerEvents={
            isCoinListEdited || assetsAmount === 0 ? 'none' : 'auto'
          }
        >
          <CoinDividerOpenButton
            coinDividerHeight={CoinDividerHeight}
            initialState={initialOpenState.current}
            isVisible={isCoinListEdited || assetsAmount === 0}
            node={animation}
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
          assetsAmount={assetsAmount}
          balancesSum={balancesSum}
          nativeCurrency={nativeCurrency}
          node={animation}
          openSmallBalances={isSmallBalancesOpen}
        />
        <EditButtonWrapper
          pointerEvents={
            isSmallBalancesOpen || assetsAmount === 0 ? 'auto' : 'none'
          }
        >
          <CoinDividerEditButton
            animationNode={animation}
            isActive={isCoinListEdited}
            isVisible={isSmallBalancesOpen || assetsAmount === 0}
            onPress={handlePressEdit}
            text={isCoinListEdited ? 'Done' : 'Edit'}
            textOpacityAlwaysOn
          />
        </EditButtonWrapper>
      </Row>
    </Container>
  );
};

export default CoinDivider;

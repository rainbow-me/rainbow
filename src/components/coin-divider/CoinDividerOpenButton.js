import React from 'react';
import { View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { SpringUtils } from 'react-native-reanimated';
import { bin, useSpringTransition } from 'react-native-redash';
import styled from 'styled-components/primitives';
import Caret from '../../assets/family-dropdown-arrow.png';
import { useOpenSmallBalances } from '../../hooks';
import { colors, padding } from '../../styles';
import { magicMemo } from '../../utils';
import {
  ButtonPressAnimation,
  OpacityToggler,
  RotationArrow,
  RoundButtonSizeToggler,
} from '../animations';
import { Row } from '../layout';
import CoinDividerButtonLabel from './CoinDividerButtonLabel';

const closedWidth = 52.5;

const springConfig = SpringUtils.makeConfigFromOrigamiTensionAndFriction({
  ...SpringUtils.makeDefaultConfig(),
  friction: 20,
  tension: 200,
});

const CaretIcon = styled(FastImage).attrs({
  source: Caret,
  tintColor: colors.blueGreyDark,
})`
  height: 17;
  width: 9;
`;

const CaretContainer = styled.View`
  opacity: 0.6;
  padding-bottom: 1;
`;

const ContainerButton = styled(ButtonPressAnimation).attrs({
  scaleTo: 0.9,
})`
  width: ${({ isSmallBalancesOpen }) =>
    isSmallBalancesOpen ? 80 : closedWidth};
`;

const Content = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})`
  ${padding(0, 10)};
  border-radius: ${RoundButtonSizeToggler.capSize / 2};
  height: ${({ height }) => height};
  width: ${closedWidth};
`;

const CoinDividerOpenButton = ({
  coinDividerHeight,
  initialState,
  isVisible,
}) => {
  const {
    isSmallBalancesOpen,
    toggleOpenSmallBalances,
  } = useOpenSmallBalances();

  const animation = useSpringTransition(bin(isSmallBalancesOpen), springConfig);

  return (
    <ContainerButton
      isSmallBalancesOpen={isSmallBalancesOpen}
      onPress={toggleOpenSmallBalances}
    >
      <OpacityToggler
        endingOpacity={0}
        isVisible={isVisible}
        startingOpacity={1}
      >
        <Content height={coinDividerHeight}>
          <RoundButtonSizeToggler
            animationNode={animation}
            endingWidth={28}
            isAbsolute
            reversed={!initialState}
            startingWidth={3}
            toggle={isSmallBalancesOpen}
          />
          <View>
            <CoinDividerButtonLabel
              endingOpacity={0}
              isVisible={isSmallBalancesOpen}
              label="All"
              startingOpacity={1}
            />
            <CoinDividerButtonLabel
              endingOpacity={1}
              isVisible={isSmallBalancesOpen}
              label="Less"
              startingOpacity={0}
            />
          </View>
          <CaretContainer>
            <RotationArrow
              endingOffset={20}
              endingPosition={-90}
              isOpen={isSmallBalancesOpen}
            >
              <CaretIcon />
            </RotationArrow>
          </CaretContainer>
        </Content>
      </OpacityToggler>
    </ContainerButton>
  );
};

export default magicMemo(CoinDividerOpenButton, 'isVisible');

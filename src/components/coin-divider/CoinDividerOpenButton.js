import React from 'react';
import { View } from 'react-native';
import FastImage from 'react-native-fast-image';
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
  node,
}) => {
  const {
    isSmallBalancesOpen,
    toggleOpenSmallBalances,
  } = useOpenSmallBalances();

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
            animationNode={node}
            endingWidth={28}
            isAbsolute
            reversed={!initialState}
            startingWidth={3}
            toggle={isSmallBalancesOpen}
          />
          <View>
            <CoinDividerButtonLabel
              isVisible={isSmallBalancesOpen}
              label="All"
              node={node}
              steps={[1, 0]}
            />
            <CoinDividerButtonLabel
              isVisible={isSmallBalancesOpen}
              label="Less"
              node={node}
              steps={[0, 1]}
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

import React from 'react';
import { View } from 'react-native';
import styled from 'styled-components';
import Caret from '../../assets/family-dropdown-arrow.png';
import { useTheme } from '../../context/ThemeContext';
import {
  ButtonPressAnimation,
  OpacityToggler,
  RotationArrow,
  RoundButtonCapSize,
  RoundButtonSizeToggler,
} from '../animations';
import { Row } from '../layout';
import CoinDividerButtonLabel from './CoinDividerButtonLabel';
import { ImgixImage } from '@rainbow-me/images';
import { padding } from '@rainbow-me/styles';
import { magicMemo } from '@rainbow-me/utils';

const closedWidth = 52.5;

const CaretContainer = styled.View`
  opacity: 0.6;
  padding-bottom: 1;
`;

const CaretIcon = styled(ImgixImage).attrs(({ theme: { colors } }) => ({
  source: Caret,
  tintColor: colors.blueGreyDark,
}))`
  height: 18;
  width: 8;
`;

const ContainerButton = styled(ButtonPressAnimation).attrs(
  ({ isSmallBalancesOpen, isSendSheet }) => ({
    scaleTo: 0.9,
    wrapperStyle: {
      marginLeft: isSendSheet && android ? 16 : 0,
      width: isSmallBalancesOpen ? 80 - (android ? 4 : 0) : closedWidth - 4,
    },
  })
)`
  width: ${({ isSmallBalancesOpen }) =>
    isSmallBalancesOpen ? 80 : closedWidth};
`;

const Content = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})`
  ${padding(0, 10)};
  border-radius: ${RoundButtonCapSize / 2};
  height: ${({ height }) => height};
  width: ${closedWidth};
`;

const CoinDividerOpenButton = ({
  coinDividerHeight,
  isSmallBalancesOpen,
  isVisible,
  onPress,
  isSendSheet,
  ...props
}) => {
  const { colors, isDarkMode } = useTheme();
  return (
    <ContainerButton
      {...props}
      isSendSheet={isSendSheet}
      isSmallBalancesOpen={isSmallBalancesOpen}
      onPress={onPress}
      radiusAndroid={RoundButtonCapSize / 2}
    >
      <OpacityToggler isVisible={isVisible}>
        <Content height={coinDividerHeight}>
          <RoundButtonSizeToggler
            color={colors.blueGreyDarkLight}
            endingWidth={28}
            isDarkMode={isDarkMode}
            isOpen={isSmallBalancesOpen}
            startingWidth={3}
          />
          <View>
            <CoinDividerButtonLabel
              isVisible={isSmallBalancesOpen}
              label="All"
            />
            <CoinDividerButtonLabel
              isVisible={!isSmallBalancesOpen}
              label="Less"
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

export default magicMemo(CoinDividerOpenButton, [
  'isSmallBalancesOpen',
  'isVisible',
]);

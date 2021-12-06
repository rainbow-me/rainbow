import React from 'react';
import { View } from 'react-native';
import styled from 'styled-components';
import Caret from '../../assets/family-dropdown-arrow.png';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
import {
  ButtonPressAnimation,
  OpacityToggler,
  RotationArrow,
  RoundButtonCapSize,
  RoundButtonSizeToggler,
} from '../animations';
import { Row } from '../layout';
// @ts-expect-error ts-migrate(6142) FIXME: Module './CoinDividerButtonLabel' was resolved to ... Remove this comment to see the full error message
import CoinDividerButtonLabel from './CoinDividerButtonLabel';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/images' or its cor... Remove this comment to see the full error message
import { ImgixImage } from '@rainbow-me/images';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { magicMemo } from '@rainbow-me/utils';

const closedWidth = 52.5;

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
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
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
      marginLeft: isSendSheet && android ? 16 : 0,
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
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
}: any) => {
  const { colors, isDarkMode } = useTheme();
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ContainerButton
      {...props}
      isSendSheet={isSendSheet}
      isSmallBalancesOpen={isSmallBalancesOpen}
      onPress={onPress}
      radiusAndroid={RoundButtonCapSize / 2}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <OpacityToggler isVisible={isVisible}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Content height={coinDividerHeight}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <RoundButtonSizeToggler
            color={colors.blueGreyDarkLight}
            endingWidth={28}
            isDarkMode={isDarkMode}
            isOpen={isSmallBalancesOpen}
            startingWidth={3}
          />
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <View>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <CoinDividerButtonLabel
              isVisible={isSmallBalancesOpen}
              label="All"
            />
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <CoinDividerButtonLabel
              isVisible={!isSmallBalancesOpen}
              label="Less"
            />
          </View>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <CaretContainer>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <RotationArrow
              endingOffset={20}
              endingPosition={-90}
              isOpen={isSmallBalancesOpen}
            >
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
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

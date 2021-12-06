import React from 'react';
import { TouchableWithoutFeedback } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import styled, { css } from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
import { deviceUtils } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { Text } from '../text';
import CoinName from './CoinName';
// @ts-expect-error ts-migrate(6142) FIXME: Module './CoinRow' was resolved to '/Users/nickbyt... Remove this comment to see the full error message
import CoinRow from './CoinRow';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useColorForAsset } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';

// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
const isSmallPhone = android || deviceUtils.dimensions.height <= 667;
// @ts-expect-error ts-migrate(2339) FIXME: Property 'dimensions' does not exist on type '{}'.
const isTinyPhone = deviceUtils.dimensions.height <= 568;
// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
const selectedHeight = isTinyPhone ? 50 : android || isSmallPhone ? 64 : 70;

const containerStyles = css`
  padding-bottom: 18;
  padding-left: 19;
  padding-top: 0;
`;

const containerSelectedStyles = css`
  ${isTinyPhone ? padding(10, 0, 0) : isSmallPhone ? padding(12) : padding(15)};
  height: ${selectedHeight};
`;

const NativeAmountBubble = styled(LinearGradient).attrs(
  ({ theme: { colors } }) => ({
    colors: colors.gradients.lighterGrey,
    end: { x: 0.5, y: 1 },
    start: { x: 0, y: 0 },
  })
)`
  border-radius: 15;
  height: 30;
`;

const NativeAmountBubbleText = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.6),
  letterSpacing: 'roundedTight',
  size: 'lmedium',
  weight: 'bold',
}))`
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  ${android ? padding(0, 10) : padding(4.5, 10, 6.5)};
`;

const BottomRow = ({
  balance: { display: balanceDisplay },

  native: {
    balance: { display: balanceNativeValue },
  },

  selected,
  showNativeValue,
}: any) => {
  const { colors } = useTheme();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Text
      color={
        selected
          ? colors.alpha(colors.blueGreyDark, 0.6)
          : colors.alpha(colors.blueGreyDark, 0.5)
      }
      letterSpacing="roundedMedium"
      size="smedium"
      weight={selected ? 'bold' : 'regular'}
    >
      {showNativeValue
        ? `${balanceNativeValue} available`
        : `${balanceDisplay}`}
    </Text>
  );
};

const TopRow = ({ item, name, selected }: any) => {
  const { colors } = useTheme();
  const colorForAsset = useColorForAsset(item, undefined, false);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <CoinName
      color={selected ? colorForAsset || colors.dark : colors.dark}
      size={selected ? 'large' : 'lmedium'}
      weight={selected ? 'bold' : 'regular'}
    >
      {name}
    </CoinName>
  );
};

export default function SendSavingsCoinRow({
  children,
  disablePressAnimation,
  item,
  onPress,
  selected,
  testID,
  ...props
}: any) {
  const fiatValue = item?.native?.balance.display;
  const chopCents =
    fiatValue && fiatValue.split('.')[0].replace(/\D/g, '') > 100;
  const fiatValueFormatted =
    fiatValue && chopCents ? fiatValue.split('.')[0] : fiatValue;

  const Wrapper = disablePressAnimation
    ? TouchableWithoutFeedback
    : ButtonPressAnimation;

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Wrapper onPress={onPress} scaleTo={0.96}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <CoinRow
        {...item}
        {...props}
        bottomRowRender={BottomRow}
        containerStyles={selected ? containerSelectedStyles : containerStyles}
        item={item}
        onPress={onPress}
        selected={selected}
        testID={testID}
        topRowRender={TopRow}
      >
        {selected || !fiatValue ? (
          children
        ) : (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <NativeAmountBubble>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <NativeAmountBubbleText>
              {fiatValueFormatted}
            </NativeAmountBubbleText>
          </NativeAmountBubble>
        )}
      </CoinRow>
    </Wrapper>
  );
}

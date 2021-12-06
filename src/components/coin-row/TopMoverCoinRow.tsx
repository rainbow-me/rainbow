import analytics from '@segment/analytics-react-native';
import React, { useCallback } from 'react';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
import { fonts } from '../../styles';
import { magicMemo, measureText } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { CoinIcon } from '../coin-icon';
import { Centered, ColumnWithMargins, RowWithMargins } from '../layout';
import BottomRowText from './BottomRowText';
import CoinName from './CoinName';

const TopMoverCoinIconSize = 36;
const TopMoverCoinRowMargin = 8;
const TopMoverPriceMargin = 5;

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const Spacer = styled.View`
  width: ${TopMoverPriceMargin};
`;

const TopMoverTitle = styled(CoinName).attrs(({ theme: { colors } }) => ({
  color: colors.alpha(colors.blueGreyDark, 0.8),
  paddingRight: 0,
  weight: 'semibold',
}))``;

export const measureBottomRowText = (text: any) =>
  measureText(text, {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'size' does not exist on type '{}'.
    fontSize: parseFloat(fonts.size.smedium),
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'weight' does not exist on type '{}'.
    fontWeight: fonts.weight.medium,
  });

export const measureTopRowText = (text: any) =>
  measureText(text, {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'size' does not exist on type '{}'.
    fontSize: parseFloat(fonts.size.lmedium),
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'weight' does not exist on type '{}'.
    fontWeight: fonts.weight.semibold,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'letterSpacing' does not exist on type '{... Remove this comment to see the full error message
    letterSpacing: fonts.letterSpacing.roundedMedium,
  });

const PADDING_BETWEEN_ITEMS = 26;

export const measureTopMoverCoinRow = async ({
  change,
  native,
  truncatedName,
}: any) => {
  const { width: nameWidth } = await measureTopRowText(truncatedName);
  const { width: priceWidth } = await measureBottomRowText(
    native?.price?.display ?? ''
  );
  const { width: changeWidth } = await measureBottomRowText(change);

  const textWidth = Math.max(
    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'number | undefined' is not assig... Remove this comment to see the full error message
    nameWidth,
    // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
    priceWidth + changeWidth + TopMoverPriceMargin
  );

  return (
    PADDING_BETWEEN_ITEMS +
    [TopMoverCoinIconSize, textWidth].reduce(
      (acc, val) => acc + val + TopMoverCoinRowMargin
    )
  );
};

const TopMoverCoinRow = (asset: any) => {
  const {
    address,
    change,
    onPress,
    native: {
      price: { display },
    },
    symbol,
    truncatedName,
    onPressCancel,
    onPressStart,
    testID,
  } = asset;
  const handlePress = useCallback(() => {
    const moverOrLoser = change[0] === '+' ? 'Mover' : 'Loser';
    analytics.track('Pressed Top Mover', {
      category: 'discover',
      moverOrLoser,
      symbol,
      truncatedName,
    });
    onPress?.(asset);
  }, [asset, change, onPress, symbol, truncatedName]);
  const { colors } = useTheme();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ButtonPressAnimation
      hapticType="notificationWarning"
      onCancel={({ nativeEvent: { state, close } }: any) => {
        if (state === 5 && close) {
          ReactNativeHapticFeedback.trigger('selection');
          handlePress();
        }
      }}
      onPress={handlePress}
      onPressCancel={onPressCancel}
      // we observe that while integrating with
      // gesture handler event gets always cancelled on iOS
      // Therefore, in this case under given condition
      // onPress should be called
      onPressStart={onPressStart}
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
      reanimatedButton={android}
      scaleTo={0.925}
      testID={testID}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <RowWithMargins
        margin={TopMoverCoinRowMargin}
        paddingHorizontal={PADDING_BETWEEN_ITEMS / 2}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Centered>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <CoinIcon
            address={address}
            size={TopMoverCoinIconSize}
            symbol={symbol}
          />
        </Centered>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <ColumnWithMargins margin={2}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <TopMoverTitle>{truncatedName}</TopMoverTitle>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <BottomRowText weight="medium">
            {display}
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Spacer />
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <BottomRowText
              color={parseFloat(change) > 0 ? colors.green : colors.red}
              weight="medium"
            >
              {change}
            </BottomRowText>
          </BottomRowText>
        </ColumnWithMargins>
      </RowWithMargins>
    </ButtonPressAnimation>
  );
};

// @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 2.
export default magicMemo(TopMoverCoinRow, [
  'change',
  'truncatedName',
  'native',
]);

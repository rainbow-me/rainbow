import { concat } from 'lodash';
import React from 'react';
import { TouchableWithoutFeedback } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import styled, { css } from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
import { buildAssetUniqueIdentifier } from '../../helpers/assets';
import { deviceUtils, magicMemo } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { Text } from '../text';
import CoinName from './CoinName';
// @ts-expect-error ts-migrate(6142) FIXME: Module './CoinRow' was resolved to '/Users/nickbyt... Remove this comment to see the full error message
import CoinRow from './CoinRow';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/web3' or ... Remove this comment to see the full error message
import { isL2Network } from '@rainbow-me/handlers/web3';
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

const containerStyles = `
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  padding-top: ${android ? 9 : 19};
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
  balance,
  native,
  nativeCurrencySymbol,
  selected,
  showNativeValue,
}: any) => {
  const { colors } = useTheme();
  const fiatValue = native?.balance?.display ?? `${nativeCurrencySymbol}0.00`;

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Text
      color={
        selected
          ? colors.alpha(colors.blueGreyDark, 0.6)
          : colors.alpha(colors.blueGreyDark, 0.5)
      }
      letterSpacing="roundedMedium"
      numberOfLines={1}
      size="smedium"
      weight={selected ? 'bold' : 'regular'}
    >
      {showNativeValue
        ? `${fiatValue} available`
        : balance?.display
        ? `${balance?.display}${selected ? ' available' : ''}`
        : 'Fetching balances...'}
    </Text>
  );
};

const TopRow = ({ item, name, selected }: any) => {
  const { colors } = useTheme();
  const address = item?.mainnet_address || item?.address;

  const colorForAsset = useColorForAsset({ address });

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <CoinName
      color={selected ? colorForAsset || colors.dark : colors.dark}
      size={selected ? 'large' : 'lmedium'}
      style={{
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
        marginBottom: android && selected ? -3 : 0,
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
        marginTop: android && selected ? 3 : 0,
      }}
      weight={selected ? 'bold' : 'regular'}
    >
      {name}
    </CoinName>
  );
};

const buildSendCoinRowIdentifier = (props: any) => {
  const uniqueId = buildAssetUniqueIdentifier(props.item);
  // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'boolean' is not assignable to pa... Remove this comment to see the full error message
  return concat(uniqueId, !!props?.showNativeValue);
};

const SendCoinRow = magicMemo(
  ({
    children,
    disablePressAnimation,
    item,
    native,
    onPress,
    rowHeight,
    selected,
    showNativeValue,
    testID,
    ...props
  }: any) => {
    const fiatValue = native?.balance?.display;
    const chopCents =
      fiatValue && fiatValue.split('.')[0].replace(/\D/g, '') > 100;
    const fiatValueFormatted =
      fiatValue && chopCents ? fiatValue.split('.')[0] : fiatValue;

    const Wrapper = disablePressAnimation
      ? TouchableWithoutFeedback
      : ButtonPressAnimation;

    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useMemo'.
    const isL2 = useMemo(() => {
      return isL2Network(item?.type);
    }, [item?.type]);

    const containerSelectedStyles = css`
      ${isTinyPhone
        ? padding(10, 0, 0)
        : isSmallPhone
        ? padding(12, 12, 12, isL2 ? 17 : 12)
        : padding(15, 15, 15, isL2 ? 19 : 15)};
      height: ${selectedHeight};
    `;

    return (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <Wrapper height={rowHeight} onPress={onPress} scaleTo={0.96}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <CoinRow
          {...item}
          {...props}
          badgeYPosition={0}
          bottomRowRender={BottomRow}
          containerStyles={selected ? containerSelectedStyles : containerStyles}
          isHidden={false}
          item={item}
          selected={selected}
          showNativeValue={showNativeValue}
          testID={testID}
          topRowRender={TopRow}
        >
          {selected || !fiatValue ? (
            children
          ) : (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <NativeAmountBubble>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <NativeAmountBubbleText>
                {fiatValueFormatted}
              </NativeAmountBubbleText>
            </NativeAmountBubble>
          )}
        </CoinRow>
      </Wrapper>
    );
  },
  ['item', 'selected', 'showNativeValue'],
  buildSendCoinRowIdentifier
);

SendCoinRow.displayName = 'SendCoinRow';
// @ts-expect-error ts-migrate(2339) FIXME: Property 'selectedHeight' does not exist on type '... Remove this comment to see the full error message
SendCoinRow.selectedHeight = selectedHeight;

export default SendCoinRow;

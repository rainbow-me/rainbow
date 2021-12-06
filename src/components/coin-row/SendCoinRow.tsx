import { concat } from 'lodash';
import React from 'react';
import { TouchableWithoutFeedback } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import styled, { css } from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import { buildAssetUniqueIdentifier } from '../../helpers/assets';
import { deviceUtils, magicMemo } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { Text } from '../text';
import CoinName from './CoinName';
import CoinRow from './CoinRow';
import { isL2Network } from '@rainbow-me/handlers/web3';
import { useColorForAsset } from '@rainbow-me/hooks';
import { padding } from '@rainbow-me/styles';

const isSmallPhone = android || deviceUtils.dimensions.height <= 667;
const isTinyPhone = deviceUtils.dimensions.height <= 568;
const selectedHeight = isTinyPhone ? 50 : android || isSmallPhone ? 64 : 70;

const containerStyles = `
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
  ${android ? padding(0, 10) : padding(4.5, 10, 6.5)};
`;

const BottomRow = ({
  balance,
  native,
  nativeCurrencySymbol,
  selected,
  showNativeValue,
}) => {
  const { colors } = useTheme();
  const fiatValue = native?.balance?.display ?? `${nativeCurrencySymbol}0.00`;

  return (
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

const TopRow = ({ item, name, selected }) => {
  const { colors } = useTheme();
  const address = item?.mainnet_address || item?.address;

  const colorForAsset = useColorForAsset({ address });

  return (
    <CoinName
      color={selected ? colorForAsset || colors.dark : colors.dark}
      size={selected ? 'large' : 'lmedium'}
      style={{
        marginBottom: android && selected ? -3 : 0,
        marginTop: android && selected ? 3 : 0,
      }}
      weight={selected ? 'bold' : 'regular'}
    >
      {name}
    </CoinName>
  );
};

const buildSendCoinRowIdentifier = props => {
  const uniqueId = buildAssetUniqueIdentifier(props.item);
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
  }) => {
    const fiatValue = native?.balance?.display;
    const chopCents =
      fiatValue && fiatValue.split('.')[0].replace(/\D/g, '') > 100;
    const fiatValueFormatted =
      fiatValue && chopCents ? fiatValue.split('.')[0] : fiatValue;

    const Wrapper = disablePressAnimation
      ? TouchableWithoutFeedback
      : ButtonPressAnimation;

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
      <Wrapper height={rowHeight} onPress={onPress} scaleTo={0.96}>
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
            <NativeAmountBubble>
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
SendCoinRow.selectedHeight = selectedHeight;

export default SendCoinRow;

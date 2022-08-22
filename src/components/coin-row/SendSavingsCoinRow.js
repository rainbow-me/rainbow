import React from 'react';
import { TouchableWithoutFeedback } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { deviceUtils } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { Text } from '../text';
import CoinName from './CoinName';
import CoinRow from './CoinRow';
import { useColorForAsset } from '@/hooks';
import styled from '@/styled-thing';
import { padding } from '@/styles';

const isSmallPhone = android || deviceUtils.dimensions.height <= 667;
const isTinyPhone = deviceUtils.dimensions.height <= 568;
const selectedHeight = isTinyPhone ? 50 : android || isSmallPhone ? 64 : 70;

const containerStyles = {
  paddingBottom: 18,
  paddingLeft: 19,
  paddingTop: 0,
};

const containerSelectedStyles = {
  height: selectedHeight,
  ...(isTinyPhone
    ? padding.object(10, 0, 0)
    : isSmallPhone
    ? padding.object(12)
    : padding.object(15)),
};

const NativeAmountBubble = styled(LinearGradient).attrs(
  ({ theme: { colors } }) => ({
    colors: colors.gradients.lighterGrey,
    end: { x: 0.5, y: 1 },
    start: { x: 0, y: 0 },
  })
)({
  borderRadius: 15,
  height: 30,
});

const NativeAmountBubbleText = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.6),
  letterSpacing: 'roundedTight',
  size: 'lmedium',
  weight: 'bold',
}))(android ? padding.object(0, 10) : padding.object(4.5, 10, 6.5));

const BottomRow = ({
  balance: { display: balanceDisplay },
  native: {
    balance: { display: balanceNativeValue },
  },
  selected,
  showNativeValue,
}) => {
  const { colors } = useTheme();

  return (
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

const TopRow = ({ item, name, selected }) => {
  const { colors } = useTheme();
  const colorForAsset = useColorForAsset(item, undefined, false);

  return (
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
}) {
  const fiatValue = item?.native?.balance.display;
  const chopCents =
    fiatValue && fiatValue.split('.')[0].replace(/\D/g, '') > 100;
  const fiatValueFormatted =
    fiatValue && chopCents ? fiatValue.split('.')[0] : fiatValue;

  const Wrapper = disablePressAnimation
    ? TouchableWithoutFeedback
    : ButtonPressAnimation;

  return (
    <Wrapper onPress={onPress} scaleTo={0.96}>
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
          <NativeAmountBubble>
            <NativeAmountBubbleText>
              {fiatValueFormatted}
            </NativeAmountBubbleText>
          </NativeAmountBubble>
        )}
      </CoinRow>
    </Wrapper>
  );
}

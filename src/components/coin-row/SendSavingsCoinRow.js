import React from 'react';
import { TouchableWithoutFeedback } from 'react-native';
import { css } from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import { deviceUtils } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { Text } from '../text';
import CoinName from './CoinName';
import CoinRow from './CoinRow';
import { useColorForAsset } from '@rainbow-me/hooks';
import { padding } from '@rainbow-me/styles';

const isSmallPhone = deviceUtils.dimensions.height <= 667;
const isTinyPhone = deviceUtils.dimensions.height <= 568;
const selectedHeight = isTinyPhone ? 50 : isSmallPhone ? 64 : 70;

const containerStyles = css`
  padding-bottom: 18;
  padding-left: 19;
  padding-top: 6;
`;

const containerSelectedStyles = css`
  ${isTinyPhone ? padding(10, 0, 0) : isSmallPhone ? padding(12) : padding(15)};
  height: ${selectedHeight};
`;

const BottomRow = ({
  balance: { display: balanceDisplay },
  native: {
    balance: { display: balanceNativeValue },
  },
  selected,
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
      {selected
        ? `${balanceNativeValue} available`
        : `${balanceDisplay} ≈ ${balanceNativeValue}`}
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
  disablePressAnimation,
  item,
  onPress,
  selected,
  testID,
  ...props
}) {
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
      />
    </Wrapper>
  );
}

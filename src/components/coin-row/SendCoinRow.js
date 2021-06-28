import { get } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { TouchableWithoutFeedback } from 'react-native';
import { css } from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import { buildAssetUniqueIdentifier } from '../../helpers/assets';
import { deviceUtils, magicMemo } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { Text } from '../text';
import CoinName from './CoinName';
import CoinRow from './CoinRow';
import { useColorForAsset } from '@rainbow-me/hooks';
import { padding } from '@rainbow-me/styles';

const isTinyPhone = deviceUtils.dimensions.height <= 568;
const selectedHeight = isTinyPhone ? 62 : 70;

const containerStyles = `
  padding-left: 19;
  padding-top: 17;
`;

const containerSelectedStyles = css`
  ${padding(15)};
  height: ${selectedHeight};
`;

const BottomRow = ({ balance, native, nativeCurrencySymbol, selected }) => {
  const { colors } = useTheme();
  const fiatValue =
    get(native, 'balance.display') || `${nativeCurrencySymbol}0.00`;

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
        ? `${fiatValue} available`
        : `${get(balance, 'display')} ≈ ${fiatValue}`}
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

const SendCoinRow = magicMemo(
  ({
    disablePressAnimation,
    item,
    onPress,
    rowHeight,
    selected,
    testID,
    ...props
  }) => {
    const Wrapper = disablePressAnimation
      ? TouchableWithoutFeedback
      : ButtonPressAnimation;

    return (
      <Wrapper height={rowHeight} onPress={onPress} scaleTo={0.96}>
        <CoinRow
          {...item}
          {...props}
          bottomRowRender={BottomRow}
          containerStyles={selected ? containerSelectedStyles : containerStyles}
          isHidden={false}
          item={item}
          selected={selected}
          testID={testID}
          topRowRender={TopRow}
        />
      </Wrapper>
    );
  },
  ['item', 'selected'],
  buildAssetUniqueIdentifier
);

SendCoinRow.displayName = 'SendCoinRow';

SendCoinRow.propTypes = {
  item: PropTypes.object,
  onPress: PropTypes.func,
  rowHeight: PropTypes.number,
  selected: PropTypes.bool,
};

SendCoinRow.selectedHeight = selectedHeight;

export default SendCoinRow;

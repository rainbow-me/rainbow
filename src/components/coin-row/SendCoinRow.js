import { get } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { css } from 'styled-components/primitives';
import { buildAssetUniqueIdentifier } from '../../helpers/assets';
import { deviceUtils, magicMemo } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { Text } from '../text';
import CoinName from './CoinName';
import CoinRow from './CoinRow';
import { colors, padding } from '@rainbow-me/styles';

const isTinyPhone = deviceUtils.dimensions.height <= 568;
const selectedHeight = isTinyPhone ? 62 : 78;

const containerStyles = `
  padding-left: 15;
  padding-top: 17;
`;

const containerSelectedStyles = css`
  ${padding(15, 15, 19)};
  height: ${selectedHeight};
`;

const BottomRow = ({ balance, native, nativeCurrencySymbol }) => {
  const fiatValue =
    get(native, 'balance.display') || `${nativeCurrencySymbol}0.00`;

  return (
    <Text color={colors.alpha(colors.blueGreyDark, 0.5)} size="smedium">
      {get(balance, 'display')} ≈ {fiatValue}
    </Text>
  );
};

const TopRow = ({ name, selected }) => (
  <CoinName weight={selected ? 'semibold' : 'regular'}>{name}</CoinName>
);

const SendCoinRow = magicMemo(
  ({ item, onPress, rowHeight, selected, testID, ...props }) => (
    <ButtonPressAnimation height={rowHeight} onPress={onPress} scaleTo={0.96}>
      <CoinRow
        {...item}
        {...props}
        bottomRowRender={BottomRow}
        containerStyles={selected ? containerSelectedStyles : containerStyles}
        isHidden={false}
        selected={selected}
        testID={testID}
        topRowRender={TopRow}
      />
    </ButtonPressAnimation>
  ),
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

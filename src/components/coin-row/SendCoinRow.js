import { get } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { shouldUpdate } from 'recompact';
import { css } from 'styled-components/primitives';
import { buildAssetUniqueIdentifier } from '../../helpers/assets';
import { colors, padding } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import Text from '../text/Text';
import CoinName from './CoinName';
import CoinRow from './CoinRow';

const containerStyles = css`
  padding-left: 15;
  padding-top: 17;
`;

const selectedHeight = 78;

const selectedStyles = css`
  ${padding(15, 15, 19, 15)};
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

BottomRow.propTypes = {
  balance: PropTypes.shape({ display: PropTypes.string }),
  native: PropTypes.object,
  nativeCurrencySymbol: PropTypes.string,
};

const TopRow = ({ name, selected }) => (
  <CoinName weight={selected ? 'semibold' : 'regular'}>{name}</CoinName>
);

TopRow.propTypes = {
  name: PropTypes.string,
  selected: PropTypes.bool,
};

const enhance = shouldUpdate((props, nextProps) => {
  const itemIdentifier = buildAssetUniqueIdentifier(props.item);
  const nextItemIdentifier = buildAssetUniqueIdentifier(nextProps.item);

  return itemIdentifier !== nextItemIdentifier;
});

const SendCoinRow = enhance(({ item, onPress, selected, ...props }) => (
  <ButtonPressAnimation onPress={onPress} scaleTo={0.96}>
    <CoinRow
      {...item}
      bottomRowRender={BottomRow}
      containerStyles={selected ? selectedStyles : containerStyles}
      selected={selected}
      topRowRender={TopRow}
      {...props}
    />
  </ButtonPressAnimation>
));

SendCoinRow.propTypes = {
  item: PropTypes.object,
  onPress: PropTypes.func,
  selected: PropTypes.bool,
};

SendCoinRow.selectedHeight = selectedHeight;

export default SendCoinRow;

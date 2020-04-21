import { get } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { StyleSheet } from 'react-native';
import { shouldUpdate } from 'recompact';
import { buildAssetUniqueIdentifier } from '../../helpers/assets';
import { colors } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import Text from '../text/Text';
import CoinName from './CoinName';
import CoinRow from './CoinRow';

const selectedHeight = 78;

const sx = StyleSheet.create({
  container: {
    paddingLeft: 15,
    paddingTop: 17,
  },
  containerSelected: {
    height: selectedHeight,
    paddingBottom: 19,
    paddingLeft: 15,
    paddingRight: 15,
    paddingTop: 15,
  },
});

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
      containerStyles={selected ? sx.containerSelected : sx.container}
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

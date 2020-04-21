import PropTypes from 'prop-types';
import React from 'react';
import { StyleSheet } from 'react-native';
import { colors } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Text } from '../text';
import CoinName from './CoinName';
import CoinRow from './CoinRow';

const selectedHeight = 78;

const sx = StyleSheet.create({
  container: {
    paddingBottom: 18,
    paddingLeft: 15,
    paddingTop: 6,
  },
  containerSelected: {
    height: selectedHeight,
    paddingBottom: 19,
    paddingLeft: 15,
    paddingRight: 15,
    paddingTop: 15,
  },
});

const BottomRow = ({
  balance: { display: balanceDisplay },
  native: {
    balance: { display: balanceNativeValue },
  },
}) => (
  <Text color={colors.alpha(colors.blueGreyDark, 0.5)} size="smedium">
    {balanceDisplay} ≈ {balanceNativeValue}
  </Text>
);

BottomRow.propTypes = {
  balance: PropTypes.object,
  native: PropTypes.object,
};

const TopRow = ({ name }) => <CoinName weight="regular">{name}</CoinName>;

TopRow.propTypes = {
  name: PropTypes.string,
};

const SendSavingsCoinRow = ({ item, onPress, selected, ...props }) => (
  <ButtonPressAnimation onPress={onPress} scaleTo={0.96}>
    <CoinRow
      {...item}
      {...props}
      bottomRowRender={BottomRow}
      containerStyles={selected ? sx.containerSelected : sx.container}
      onPress={onPress}
      topRowRender={TopRow}
    />
  </ButtonPressAnimation>
);

SendSavingsCoinRow.propTypes = {
  item: PropTypes.object,
  onPress: PropTypes.func,
  selected: PropTypes.bool,
};

export default SendSavingsCoinRow;

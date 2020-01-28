import PropTypes from 'prop-types';
import React from 'react';
import { Text, View, ViewPropTypes } from 'react-native';
import styled from 'styled-components/primitives';
import { colors } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import styles from './VirtualKeyboardStyle';

const Backspace = styled(Icon).attrs({
  align: 'center',
  name: 'backspace',
  opacity: 0.8,
})`
  width: 40;
  transform: scale(0.5);
`;

const NumberColor = colors.alpha(colors.blueGreyDark, 0.8);

const VirtualKeyboard = ({ decimal = true, onPress, rowStyle }) => {
  const BackspaceButton = () => (
    <ButtonPressAnimation
      duration={35}
      onPress={() => {
        onPress('back');
      }}
      scaleTo={1.6}
      style={styles.backspace}
      transformOrigin="keyboard"
    >
      <Backspace />
    </ButtonPressAnimation>
  );

  const Row = numbersArray => {
    let cells = numbersArray.map(val => Cell(val));
    return <View style={[styles.row, rowStyle]}>{cells}</View>;
  };

  const Cell = symbol => (
    <ButtonPressAnimation
      duration={35}
      key={symbol}
      onPress={() => {
        onPress(symbol.toString());
      }}
      scaleTo={1.6}
      transformOrigin="keyboard"
      width={80}
    >
      <Text
        style={[
          styles.number,
          { color: NumberColor },
          { transform: [{ scale: 0.5 }] },
        ]}
      >
        {symbol}
      </Text>
    </ButtonPressAnimation>
  );

  return (
    <View style={[styles.container]}>
      {Row([1, 2, 3])}
      {Row([4, 5, 6])}
      {Row([7, 8, 9])}
      <View style={[styles.row, rowStyle]}>
        {decimal ? Cell('.') : <View style={{ flex: 1 }} />}
        {Cell(0)}
        {BackspaceButton()}
      </View>
    </View>
  );
};

VirtualKeyboard.propTypes = {
  decimal: PropTypes.bool,
  onPress: PropTypes.func.isRequired,
  rowStyle: ViewPropTypes.style,
};

export default VirtualKeyboard;

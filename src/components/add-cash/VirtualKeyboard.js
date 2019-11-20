'use strict';

import PropTypes from 'prop-types';
import React, { Component } from 'react';
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

class VirtualKeyboard extends Component {
  static propTypes = {
    decimal: PropTypes.bool,
    onPress: PropTypes.func.isRequired,
    pressMode: PropTypes.oneOf(['string', 'char']),
    rowStyle: ViewPropTypes.style,
  };

  static defaultProps = {
    decimal: true,
    pressMode: 'string',
  };

  constructor(props) {
    super(props);
    this.state = {
      text: '',
    };
  }

  Backspace() {
    return (
      <ButtonPressAnimation
        duration={35}
        onPress={() => {
          this.onPress('back');
        }}
        scaleTo={1.6}
        style={styles.backspace}
        transformOrigin="keyboard"
      >
        <Backspace />
      </ButtonPressAnimation>
    );
  }

  Row(numbersArray) {
    let cells = numbersArray.map(val => this.Cell(val));
    return <View style={[styles.row, this.props.rowStyle]}>{cells}</View>;
  }

  Cell(symbol) {
    return (
      <ButtonPressAnimation
        duration={35}
        key={symbol}
        onPress={() => {
          this.onPress(symbol.toString());
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
  }

  onPress(val) {
    if (this.props.pressMode === 'string') {
      let curText = this.state.text;
      if (isNaN(val)) {
        if (val === 'back') {
          curText = curText.slice(0, -1);
        } else if (curText < 1500) {
          curText += val;
        }
      } else if (curText + val <= 1500) {
        curText += val;
      }
      this.setState({ text: curText });
      this.props.onPress(curText);
    } /* if (props.pressMode == 'char')*/ else {
      this.props.onPress(val);
    }
  }

  render() {
    return (
      <View style={[styles.container, this.props.style]}>
        {this.Row([1, 2, 3])}
        {this.Row([4, 5, 6])}
        {this.Row([7, 8, 9])}
        <View style={[styles.row, this.props.rowStyle]}>
          {this.props.decimal ? this.Cell('.') : <View style={{ flex: 1 }} />}
          {this.Cell(0)}
          {this.Backspace()}
        </View>
      </View>
    );
  }
}

module.exports = VirtualKeyboard;

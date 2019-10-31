import { pick } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { TouchableWithoutFeedback } from 'react-native';
import { withProps } from 'recompact';
import supportedNativeCurrencies from '../../references/native-currencies.json';
import { colors, fonts } from '../../styles';
import { isNewValueForPath } from '../../utils';
import { Row } from '../layout';
import { Text } from '../text';
import ExchangeInput from './ExchangeInput';

class ExchangeNativeField extends Component {
  static propTypes = {
    height: PropTypes.number,
    mask: PropTypes.string,
    nativeAmount: PropTypes.string,
    nativeFieldRef: PropTypes.func,
    onBlur: PropTypes.func,
    onFocus: PropTypes.func,
    placeholder: PropTypes.string,
    setNativeAmount: PropTypes.func,
    symbol: PropTypes.string,
  };

  state = { isFocused: false };

  shouldComponentUpdate = (nextProps, nextState) => {
    const isNewAmount = isNewValueForPath(
      this.props,
      nextProps,
      'nativeAmount'
    );
    const isNewFocus = isNewValueForPath(this.state, nextState, 'isFocused');
    const isNewSymbol = isNewValueForPath(this.props, nextProps, 'symbol');

    return isNewAmount || isNewFocus || isNewSymbol;
  };

  nativeFieldRef = undefined;

  focusNativeField = () => {
    if (this.nativeFieldRef) {
      this.nativeFieldRef.focus();
    }
  };

  handleBlur = event => {
    this.setState({ isFocused: false });

    if (this.props.onBlur) {
      this.props.onBlur(event);
    }
  };

  handleFocus = event => {
    this.setState({ isFocused: true });

    if (this.props.onFocus) {
      this.props.onFocus(event);
    }
  };

  handleNativeFieldRef = ref => {
    this.nativeFieldRef = ref;
    this.props.nativeFieldRef(ref);
  };

  render = () => {
    const {
      height,
      mask,
      nativeAmount,
      placeholder,
      setNativeAmount,
      symbol,
    } = this.props;

    const { isFocused } = this.state;

    let opacity = nativeAmount ? 0.5 : 0.3;
    if (isFocused) {
      opacity = 1;
    }

    const color = colors.alpha(
      isFocused ? colors.dark : colors.blueGreyDark,
      opacity
    );

    return (
      <TouchableWithoutFeedback flex={0} onPress={this.focusNativeField}>
        <Row align="center" flex={1} height={height}>
          <Text flex={0} size="large" style={{ color }} weight="regular">
            {symbol}
          </Text>
          <ExchangeInput
            color={color}
            disableTabularNums
            fontFamily={fonts.family.SFProText}
            fontSize={fonts.size.large}
            fontWeight={fonts.weight.regular}
            mask={mask}
            onBlur={this.handleBlur}
            onChangeText={setNativeAmount}
            onFocus={this.handleFocus}
            placeholder={placeholder}
            refInput={this.handleNativeFieldRef}
            value={nativeAmount}
          />
        </Row>
      </TouchableWithoutFeedback>
    );
  };
}

export default withProps(({ nativeCurrency }) =>
  pick(supportedNativeCurrencies[nativeCurrency], [
    'mask',
    'placeholder',
    'symbol',
  ])
)(ExchangeNativeField);

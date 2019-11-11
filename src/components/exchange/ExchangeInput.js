import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { InteractionManager } from 'react-native';
import TextInputMask from 'react-native-text-input-mask';
import stylePropType from 'react-style-proptype';
import { colors, fonts } from '../../styles';
import { isNewValueForObjectPaths } from '../../utils';

export default class ExchangeInput extends Component {
  static propTypes = {
    color: PropTypes.string,
    disableTabularNums: PropTypes.bool,
    fontFamily: PropTypes.string,
    fontSize: PropTypes.string,
    fontWeight: PropTypes.string,
    mask: PropTypes.string,
    onBlur: PropTypes.func,
    onChange: PropTypes.func,
    onChangeText: PropTypes.func,
    onFocus: PropTypes.func,
    placeholder: PropTypes.string,
    placeholderTextColor: PropTypes.string,
    refInput: PropTypes.func,
    style: stylePropType,
    value: PropTypes.string,
  };

  static defaultProps = {
    color: colors.dark,
    fontFamily: fonts.family.SFProDisplay,
    fontSize: fonts.size.h2,
    fontWeight: fonts.weight.medium,
    mask: '[099999999999999999].[999999999999999999]',
    placeholder: '0',
    placeholderTextColor: colors.alpha(colors.blueGreyDark, 0.3),
    value: '',
  };

  state = {
    isFocused: false,
    isTouched: false,
  };

  shouldComponentUpdate = (nextProps, nextState) =>
    nextState.isTouched !== this.state.isTouched ||
    isNewValueForObjectPaths(this.props, nextProps, [
      'color',
      'editable',
      'placeholder',
      'placeholderTextColor',
      'value',
    ]);

  handleBlur = event => {
    const { onBlur, onChangeText, value } = this.props;

    if (typeof value === 'string') {
      const parts = value.split('.');
      if (parts[0].length > 1 && !Number(parts[0])) {
        onChangeText(`0.${parts[1]}`);
      }
    }

    this.setState({
      isFocused: false,
      isTouched: false,
    });

    if (onBlur) {
      onBlur(event);
    }
  };

  handleFocus = event => {
    this.setState({ isFocused: true });
    if (this.props.onFocus) {
      this.props.onFocus(event);
    }
  };

  handleChangeText = formatted => {
    const { onChangeText, value } = this.props;
    let text = formatted;

    if (this.state.isTouched && !text.length && !value) {
      text = '0.';
    }

    if (onChangeText) {
      onChangeText(text);
    }
  };

  handleChange = event => {
    const { isFocused, isTouched } = this.state;

    if (isFocused && !isTouched) {
      InteractionManager.runAfterInteractions(() => {
        this.setState({ isTouched: true });
      });
    }

    if (this.props.onChange) {
      this.props.onChange(event);
    }
  };

  render = () => {
    const {
      color,
      disableTabularNums,
      editable,
      fontFamily,
      fontSize,
      fontWeight,
      mask,
      placeholder,
      placeholderTextColor,
      refInput,
      style,
      value,
    } = this.props;

    return (
      <TextInputMask
        {...this.props}
        allowFontScaling={false}
        editable={editable}
        flex={1}
        keyboardAppearance="dark"
        keyboardType="decimal-pad"
        mask={mask}
        onBlur={this.handleBlur}
        onChange={this.handleChange}
        onChangeText={this.handleChangeText}
        onFocus={this.handleFocus}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        refInput={refInput}
        selectionColor={colors.appleBlue}
        style={[
          {
            color,
            fontFamily,
            fontSize: parseFloat(fontSize),
            fontVariant: disableTabularNums ? undefined : ['tabular-nums'],
            fontWeight,
          },
          style,
        ]}
        value={value}
      />
    );
  };
}

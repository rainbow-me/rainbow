import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import TextInputMask from 'react-native-text-input-mask';
import stylePropType from 'react-style-proptype';
import { colors, fonts } from '../../styles';

export default class ExchangeInput extends PureComponent {
  static propTypes = {
    disableTabularNums: PropTypes.bool,
    fontFamily: PropTypes.string,
    fontSize: PropTypes.string,
    fontWeight: PropTypes.number,
    mask: PropTypes.string,
    onChangeText: PropTypes.func,
    placeholder: PropTypes.string,
    placeholderTextColor: PropTypes.string,
    style: stylePropType,
    value: PropTypes.string,
  }

  static defaultProps = {
    fontFamily: fonts.family.SFProDisplay,
    fontSize: fonts.size.h2,
    fontWeight: fonts.weight.medium,
    mask: '[099999999999].[9999999999999]',
    placeholder: '0',
    placeholderTextColor: colors.alpha(colors.blueGreyDark, 0.5),
  }

  onChangeText = (formatted, extracted) => {
    // XXX TODO: some funky stuff is going on here related to the '$' symbol in the input mask
    this.props.onChangeText(!!extracted ? formatted : '');
  }

  render = () => {
    const {
      disableTabularNums,
      fontFamily,
      fontSize,
      fontWeight,
      mask,
      onChangeText,
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
        flex={1}
        keyboardAppearance="dark"
        keyboardType="decimal-pad"
        mask={mask}
        onChangeText={this.onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        refInput={refInput}
        selectionColor={colors.appleBlue}
        style={[{
          color: colors.dark,
          fontFamily,
          fontSize: parseFloat(fontSize),
          fontVariant: disableTabularNums ? undefined : ['tabular-nums'],
          fontWeight,
        }, style]}
        value={value}
      />
    );
  }
}

import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import TextInputMask from 'react-native-text-input-mask';
import stylePropType from 'react-style-proptype';
import { colors, fonts } from '../../styles';

export default class ExchangeInput extends PureComponent {
  static propTypes = {
    color: PropTypes.string,
    disableTabularNums: PropTypes.bool,
    fontFamily: PropTypes.string,
    fontSize: PropTypes.string,
    fontWeight: PropTypes.string,
    mask: PropTypes.string,
    onChangeText: PropTypes.func,
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
  };

  handleChangeText = (formatted, extracted) => {
    this.props.onChangeText(extracted ? formatted : '');
  };

  render = () => {
    const {
      color,
      disableTabularNums,
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
        flex={1}
        keyboardAppearance="dark"
        keyboardType="decimal-pad"
        mask={mask}
        onChangeText={this.handleChangeText}
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

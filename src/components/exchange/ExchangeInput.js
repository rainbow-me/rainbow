import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import TextInputMask from 'react-native-text-input-mask';
import stylePropType from 'react-style-proptype';
import { colors, fonts } from '../../styles';

export default class ExchangeInput extends PureComponent {
  static propTypes = {
    fontSize: PropTypes.string,
    mask: PropTypes.string,
    onChangeText: PropTypes.func,
    placeholder: PropTypes.string,
    placeholderTextColor: PropTypes.string,
    style: stylePropType,
    value: PropTypes.string,
  }

  static defaultProps = {
    fontSize: fonts.size.h2,
    mask: '[099999999999].[9999999999999]',
    placeholder: '0',
    placeholderTextColor: colors.alpha(colors.blueGreyDark, 0.5),
  }

  onChangeText = (formatted, extracted) => {
    // console.log('formatted', typeof extracted, !!formatted, formatted);
    // console.log('extracted', typeof extracted, !!extracted, extracted);

    const condition = !!extracted;

    // console.log('CONDITION', condition);

    const thing = condition ? formatted : '';
    // console.log('thing', thing);




    // XXX TODO: some funky stuff is going on here related to the '$' symbol in the input mask

    this.props.onChangeText(thing);
  }

  render = () => {
    const {
      fontSize,
      mask,
      onChangeText,
      placeholder,
      refInput,
      placeholderTextColor,
      style,
      value,
    } = this.props;

    return (
      <TextInputMask
        {...this.props}
        allowFontScaling={false}
        flex={1}
        refInput={refInput}
        keyboardAppearance="dark"
        keyboardType="decimal-pad"
        mask={mask}
        onChangeText={this.onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        selectionColor={colors.appleBlue}
        style={[{
          fontFamily: fonts.family.SFMono,
          fontSize: parseFloat(fontSize),
        }, style]}
        value={value}
      />
    );
  }
}

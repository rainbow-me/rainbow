import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { TextInput } from 'react-native';
import { buildTextStyles, colors } from '../../styles';

export default class Input extends PureComponent {
  static propTypes = {
    allowFontScaling: PropTypes.bool,
    autoCapitalize: PropTypes.string,
    autoCorrect: PropTypes.bool,
    keyboardType: PropTypes.string,
    placeholderTextColor: PropTypes.string,
    spellCheck: PropTypes.bool,
  }

  static defaultProps = {
    allowFontScaling: false,
    autoCapitalize: 'none',
    autoCorrect: false,
    placeholderTextColor: colors.placeholder,
    spellCheck: true,
  }

  ref = React.createRef()

  focus = event => this.ref.current.focus(event)

  render = () => {
    const {
      allowFontScaling,
      autoCapitalize,
      autoCorrect,
      keyboardType,
      placeholderTextColor,
      spellCheck,
      ...props
    } = this.props;

    return (
      <TextInput
        {...props}
        allowFontScaling={allowFontScaling}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        css={buildTextStyles}
        keyboardType={keyboardType}
        placeholderTextColor={placeholderTextColor}
        ref={this.ref}
        spellCheck={spellCheck}
      />
    );
  }
}

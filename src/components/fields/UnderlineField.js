import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { View } from 'react-native';
import Animated, { Easing } from 'react-native-reanimated';
import styled from 'styled-components/primitives';
import { setSelectedInputId } from '../../redux/selectedInput';
import store from '../../redux/store';
import { colors, fonts, position } from '../../styles';
import { Button } from '../buttons';
import { ExchangeInput } from '../exchange';
import { Input } from '../inputs';
import { Column, Row } from '../layout';

const Underline = styled(View)`
  ${position.cover};
  background-color: ${colors.blueGreyDark};
  opacity: 0.2;
`;

const UnderlineAnimated = styled(Animated.View)`
  ${position.cover};
  background-color: ${colors.sendScreen.brightBlue};
  left: -100%;
`;

const UnderlineContainer = styled(Row)`
  border-radius: 1px;
  height: 2px;
  overflow: hidden;
  width: 100%;
`;

export default class UnderlineField extends PureComponent {
  static propTypes = {
    autoFocus: PropTypes.bool,
    buttonText: PropTypes.string,
    format: PropTypes.func,
    keyboardType: Input.propTypes.keyboardType,
    maxLength: PropTypes.number,
    onBlur: PropTypes.func,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onPressButton: PropTypes.func,
    placeholder: PropTypes.string,
    value: PropTypes.any,
  };

  static defaultProps = {
    autoFocus: false,
  };

  constructor(props) {
    super(props);

    this.state = {
      isFocused: props.autoFocus,
      value: props.value,
      wasButtonPressed: false,
    };
  }

  componentDidUpdate(prevProps) {
    const { value } = this.props;

    if (
      value !== prevProps.value &&
      (!this.input.isFocused() || this.state.wasButtonPressed)
    ) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ value, wasButtonPressed: false });
    }
  }

  animation = new Animated.Value(0);

  format = string => (this.props.format ? this.props.format(string) : string);

  onBlur = (...props) => {
    Animated.timing(this.animation, {
      duration: 1,
      easing: Easing.linear,
      toValue: 0,
    }).start();

    this.setState({ isFocused: false });

    if (this.props.onBlur) {
      this.props.onBlur(...props);
    }
  };

  onChange = event => {
    const { nativeEvent } = event;

    const value = this.format(nativeEvent.text);

    if (value !== this.props.value) {
      this.setState({ value });

      if (this.props.onChange) this.props.onChange(String(value));
    }
  };

  onFocus = (...props) => {
    Animated.timing(this.animation, {
      duration: 150,
      easing: Easing.ease,
      toValue: 1,
    }).start();

    this.setState({ isFocused: true });

    if (this.props.onFocus) this.props.onFocus(...props);
    if (this.input && this.input.isFocused()) {
      store.dispatch(setSelectedInputId(this.input));
    }
  };

  handleButtonPress = () => {
    this.setState({ wasButtonPressed: true });
    this.props.onPressButton();
  };

  handleRef = ref => {
    this.input = ref;
  };

  render() {
    const {
      autoFocus,
      buttonText,
      keyboardType,
      maxLength,
      placeholder,
      ...props
    } = this.props;

    const showFieldButton = buttonText && this.state.isFocused;

    return (
      <Column flex={1} {...props}>
        <Row align="center" justify="space-between" style={{ marginBottom: 8 }}>
          <ExchangeInput
            autoFocus={autoFocus}
            color={colors.dark}
            disableTabularNums
            keyboardAppearance="light"
            keyboardType={keyboardType}
            letterSpacing={fonts.letterSpacing.roundedTightest}
            mask="[099999999999999999].[999999999999999999]"
            maxLength={maxLength}
            onBlur={this.onBlur}
            onChange={this.onChange}
            onFocus={this.onFocus}
            paddingRight={8}
            placeholder={placeholder}
            refInput={this.handleRef}
            size={fonts.size.h3}
            value={this.format(String(this.state.value || ''))}
            weight={fonts.weight.medium}
          />
          {showFieldButton && (
            <Button
              backgroundColor={colors.sendScreen.brightBlue}
              flex={0}
              onPress={this.handleButtonPress}
              size="small"
              type="pill"
            >
              {buttonText}
            </Button>
          )}
        </Row>
        <UnderlineContainer>
          <Underline />
          <UnderlineAnimated
            style={{ transform: [{ scaleX: this.animation }] }}
          />
        </UnderlineContainer>
      </Column>
    );
  }
}

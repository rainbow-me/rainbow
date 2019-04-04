import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import styled from 'styled-components/primitives';
import { View } from 'react-native';
import Animated, { Easing } from 'react-native-reanimated';
import { colors, position } from '../../styles';
import { Button } from '../buttons';
import { Input } from '../inputs';
import { Column, FlexItem, Row } from '../layout';

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
  }

  static defaultProps = {
    autoFocus: false,
  }

  constructor(props) {
    super(props);

    this.state = {
      isFocused: props.autoFocus,
      value: props.value,
    };
  }

  animation = new Animated.Value(0)

  componentDidUpdate(prevProps) {
    const { value } = this.props;

    if (value !== prevProps.value) {
      this.setState({ value });
    }
  }

  format = (string) => (
    this.props.format
      ? this.props.format(string)
      : string
  )

  onBlur = (...props) => {
    Animated.timing(this.animation, {
      duration: 1,
      easing: Easing.linear,
      toValue: 0,
    }).start();

    this.setState({ isFocused: false });

    if (this.props.onBlur) this.props.onBlur(...props);
  }

  onChange = (event) => {
    const { nativeEvent } = event;

    const value = this.format(nativeEvent.text);

    if (value !== this.props.value) {
      this.setState({ value });

      if (this.props.onChange) this.props.onChange(String(value));
    }
  }

  onFocus = (...props) => {
    Animated.timing(this.animation, {
      duration: 150,
      easing: Easing.ease,
      toValue: 1,
    }).start();

    this.setState({ isFocused: true });

    if (this.props.onFocus) this.props.onFocus(...props);
  }

  render() {
    const {
      autoFocus,
      buttonText,
      keyboardType,
      maxLength,
      onPressButton,
      placeholder,
      ...props
    } = this.props;

    const showFieldButton = buttonText && this.state.isFocused;

    return (
      <Column flex={1} {...props}>
        <Row
          align="center"
          justify="space-between"
          style={{ marginBottom: 10 }}
        >
          <FlexItem style={{ paddingRight: 10 }}>
            <Input
              autoFocus={autoFocus}
              color={colors.blueGreyDark}
              family="SFMono"
              keyboardType={keyboardType}
              maxLength={maxLength}
              onBlur={this.onBlur}
              onChange={this.onChange}
              onFocus={this.onFocus}
              placeholder={placeholder}
              size="h2"
              value={this.format(String(this.props.value || ''))}
            />
          </FlexItem>
          {showFieldButton && (
            <Button
              backgroundColor={colors.sendScreen.brightBlue}
              flex={0}
              onPress={onPressButton}
              size="small"
              type="pill"
            >
              {buttonText}
            </Button>
          )}
        </Row>
        <UnderlineContainer>
          <Underline />
          <UnderlineAnimated style={{ transform: [{ scaleX: this.animation }] }} />
        </UnderlineContainer>
      </Column>
    );
  }
}

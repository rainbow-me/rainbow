import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import styled from 'styled-components/primitives';
import { colors, margin, padding } from '../../styles';
import { Icon } from '../icons';
import { ClearInputDecorator, Input } from '../inputs';
import InnerBorder from '../InnerBorder';
import { RowWithMargins } from '../layout';

const ExchangeSearchHeight = 40;

const Container = styled(RowWithMargins).attrs({
  margin: 7,
})`
  ${margin(0, 15, 4)};
  ${padding(0, 13, 0)};
  background-color: ${colors.skeleton};
  border-radius: ${ExchangeSearchHeight / 2};
  height: ${ExchangeSearchHeight};
`;

export default class ExchangeSearch extends PureComponent {
  static propTypes = {
    autoFocus: PropTypes.bool,
    onChangeText: PropTypes.func,
    searchQuery: PropTypes.string,
  };

  static height = ExchangeSearchHeight;

  clearInput = () => {
    if (this.inputRef && this.inputRef.current) {
      this.inputRef.current.clear();
    }
    this.props.onChangeText('');
  };

  focus = event => {
    if (this.inputRef && this.inputRef.current) {
      this.inputRef.current.focus(event);
    }
  };

  inputRef = React.createRef();

  render = () => (
    <TouchableWithoutFeedback onPress={this.focus} paddingHorizontal={15}>
      <Container>
        <Icon
          color={colors.alpha(colors.blueGreyDark, 0.4)}
          flex={0}
          marginTop={10.5}
          name="search"
        />
        <Input
          allowFontScaling={false}
          autoCapitalize="words"
          autoFocus={this.props.autoFocus}
          blurOnSubmit={false}
          clearTextOnFocus
          color={colors.dark}
          enablesReturnKeyAutomatically
          flex={1}
          keyboardAppearance="dark"
          keyboardType="ascii-capable"
          lineHeight="loose"
          onChangeText={this.props.onChangeText}
          onFocus={this.props.onFocus}
          placeholder="Search"
          placeholderTextColor={colors.grey}
          ref={this.inputRef}
          returnKeyType="search"
          selectionColor={colors.appleBlue}
          size="large"
          value={this.props.searchQuery}
        />
        <ClearInputDecorator
          inputHeight={ExchangeSearchHeight}
          isVisible={this.props.searchQuery !== ''}
          onPress={this.clearInput}
        />
        <InnerBorder
          color={colors.dark}
          opacity={0.01}
          radius={ExchangeSearchHeight / 2}
        />
      </Container>
    </TouchableWithoutFeedback>
  );
}

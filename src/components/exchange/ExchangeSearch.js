import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { compose, withHandlers } from 'recompact';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import styled from 'styled-components/primitives';
import { colors, margin, padding, position } from '../../styles';
import { Icon } from '../icons';
import { Input } from '../inputs';
import InnerBorder from '../InnerBorder';
import { RowWithMargins } from '../layout';

const Container = styled(RowWithMargins).attrs({
  margin: 6.5,
})`
  ${margin(0, 15, 10)};
  ${padding(9, 13, 10)};
  background-color: ${colors.skeleton};
  border-radius: 20;
  height: 40;
`;

class ExchangeSearch extends PureComponent {
  static propTypes = {
    autoFocus: PropTypes.bool,
    onChangeText: PropTypes.func,
  }

  state = {
    searchQuery: null,
  }

  inputRef = React.createRef()

  focus = (event) => {
    if (this.inputRef && this.inputRef.current) {
      this.inputRef.current.focus(event);
    }
  }

            //
          //  autoCapitalize="words"
  render = () => {
    return (
      <TouchableWithoutFeedback
        onPress={this.focus}
        paddingHorizontal={15}
      >
        <Container margin={6.5}>
          <Icon
            color={colors.grey}
            flex={0}
            name="search"
          />
          <Input
            allowFontScaling={false}
            autoFocus={this.props.autoFocus}
            color={colors.dark}
            flex={1}
            keyboardAppearance="dark"
            keyboardType="default"
            lineHeight="loose"
            onChangeText={this.props.onChangeText}
            onFocus={this.props.onFocus}
            placeholder="Search"
            placeholderTextColor={colors.grey}
            blurOnSubmit={false}
            clearButtonMode="always"
            ref={this.inputRef}
            returnKeyType="search"
            selectionColor={colors.appleBlue}
            size="large"
            value={this.state.searchQuery}
          />
          <InnerBorder
            color={colors.dark}
            opacity={0.01}
            radius={20}
          />
        </Container>
      </TouchableWithoutFeedback>
    );
  }
}

export default ExchangeSearch;

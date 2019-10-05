import React from 'react';
import { colors } from '../../styles';
import { Text } from '.';

class PlaceholderText extends React.Component {
  state = {
    text: ' ',
  };

  updateValue = text => {
    this.setState({ text });
  };

  render() {
    return (
      <Text
        color={colors.alpha(colors.blueGreyDark, 0.3)}
        size="big"
        style={{ marginBottom: -27 }}
        weight="semibold"
      >
        {this.state.text}
      </Text>
    );
  }
}

export default PlaceholderText;

import React from 'react';
import { Text } from 'react-native';
import { colors } from '../../styles';

class DateText extends React.Component {
  state = {
    text: '0',
  };

  updateValue = text => {
    this.setState({ text });
  };

  render() {
    return (
      <Text
        style={{
          color: colors.blueGreyDark,
          opacity: 0.5,
        }}
      >
        {this.state.text}
      </Text>
    );
  }
}

export default DateText;

import PropTypes from 'prop-types';
import React from 'react';
import { Text } from 'react-native';
import { colors, fonts } from '../../styles';


class DateText extends React.Component {

  state = {
    text: '0',
  }

  updateValue = (text) => {
    this.setState({ text });
  }

  render() {
    return (
      <Text style={{
        color: colors.blueGreyDark,
        fontFamily: fonts.family.SFProDisplay,
        opacity: 0.5,
      }}>
        {this.state.text}
      </Text>
    );
  }
}

DateText.propTypes = {
  text: PropTypes.string,
};

export default DateText;

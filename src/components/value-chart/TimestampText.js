import PropTypes from 'prop-types';
import React from 'react';
import { Text } from 'react-primitives';
import { colors, fonts } from '../../styles';

const TimestampText = ({ children, style }) => (
  <Text
    style={{
      color: colors.blueGreyDark,
      fontFamily: fonts.family.SFProRounded,
      lineHeight: 17,
      marginLeft: -15,
      opacity: 0.5,
      textAlign: 'center',
      ...style,
    }}
  >
    {children}
  </Text>
);

TimestampText.propTypes = {
  children: PropTypes.string,
};

export default TimestampText;

import PropTypes from 'prop-types';
import React from 'react';
import { Text } from 'react-primitives';
import { colors, fonts } from '../../styles';

const TimestampText = ({
  children,
}) => (
  <Text style={{
    color: colors.blueGreyDark,
    fontFamily: fonts.family.SFProDisplay,
    lineHeight: 17,
    opacity: 0.5,
  }}>
    {children}
  </Text>
);

TimestampText.propTypes = {
  children: PropTypes.string,
};

export default TimestampText;

import React from 'react';
import stylePropType from 'react-style-proptype';
import { colors } from '../../styles';
import { Text } from '../text';

const TimestampText = ({ style, ...props }) => (
  <Text
    {...props}
    align="center"
    color={colors.blueGreyDark50}
    letterSpacing="roundedTight"
    size="smedium"
    weight="semibold"
    style={[{ marginLeft: -15 }, style]}
  />
);

TimestampText.propTypes = {
  style: stylePropType,
};

export default TimestampText;

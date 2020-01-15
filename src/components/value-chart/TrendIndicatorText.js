import PropTypes from 'prop-types';
import React from 'react';
import { Text, View } from 'react-primitives';
import { colors, fonts } from '../../styles';
import { Icon } from '../icons';

const TrendIndicatorText = ({ children, direction }) => (
  <View
    style={{
      flexDirection: 'row',
    }}
  >
    <View
      style={{
        justifyContent: 'center',
      }}
    >
      <Icon
        color={direction ? colors.chartGreen : colors.red}
        name="arrow"
        direction={direction ? 'left' : 'right'}
      />
    </View>
    <Text
      style={{
        color: direction ? colors.chartGreen : colors.red,
        // FIXME @osdnk add font
        // fontFamily: fonts.family.SFProRounded,
        fontWeight: fonts.weight.semibold,
        lineHeight: 17,
        paddingLeft: 2,
      }}
    >
      {children}
    </Text>
  </View>
);

TrendIndicatorText.propTypes = {
  children: PropTypes.string,
  direction: PropTypes.string,
};

export default TrendIndicatorText;

import PropTypes from 'prop-types';
import React from 'react';
import { Text, View } from 'react-primitives';
import { colors, fonts } from '../../styles';

const TrendIndicatorText = ({
  children,
  direction,
}) => (
  <View style={{
    flexDirection: 'row',
  }}>
    {direction
      && <View style={{
        backgroundColor: colors.chartGreen,
        borderRadius: 5,
        justifyContent: 'center',
        marginRight: 8,
      }}>
        <Text style={{
          color: colors.white,
          fontFamily: fonts.family.SFProDisplay,
          fontSize: 12,
          fontWeight: fonts.weight.semibold,
          paddingLeft: 5,
          paddingRight: 5,
        }}>
          UP
        </Text>
      </View>
    }
    <Text style={{
      color: direction ? colors.chartGreen : colors.blueGreyLight,
      fontFamily: fonts.family.SFProDisplay,
      fontWeight: fonts.weight.semibold,
      lineHeight: 17,
    }}>
      {children}
    </Text>
  </View>
);

TrendIndicatorText.propTypes = {
  children: PropTypes.string,
  direction: PropTypes.string,
};

export default TrendIndicatorText;

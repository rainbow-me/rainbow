import PropTypes from 'prop-types';
import React from 'react';
import RadialGradient from 'react-native-radial-gradient';
import { colors } from '../../styles';
import { GradientText } from '../text';

const CoinRowAPYPill = ({ children }) => (
  <RadialGradient
    borderRadius={21}
    center={[0, 1]}
    colors={[colors.alpha('#2CCC00', 0.1), colors.alpha('#FEBE44', 0.08)]}
    height={21}
    marginLeft={-6}
    overflow="hidden"
    paddingHorizontal={6}
    paddingTop={1.5}
    radius={81}
  >
    <GradientText
      align="center"
      angle={false}
      end={{ x: 1, y: 1 }}
      letterSpacing="roundedTight"
      lineHeight="zero"
      size="smedium"
      start={{ x: 0, y: 0 }}
      steps={[0, 1]}
      weight="semibold"
    >
      {children}
    </GradientText>
  </RadialGradient>
);

CoinRowAPYPill.propTypes = {
  children: PropTypes.node,
};

export default CoinRowAPYPill;

import PropTypes from 'prop-types';
import React from 'react';
import RadialGradient from 'react-native-radial-gradient';
import { colors } from '../styles';
import { TruncatedText } from './text';

const pillCenter = [0, 10.5];
const pillColors = [colors.alpha('#ECF1F5', 0.4), colors.alpha('#DFE4EB', 0.5)];

const Pill = ({ children, ...props }) => (
  <RadialGradient
    borderRadius={10.5}
    center={pillCenter}
    colors={pillColors}
    overflow="hidden"
    paddingHorizontal={6}
    paddingVertical={2}
    {...props}
  >
    <TruncatedText
      align="center"
      color={colors.alpha(colors.blueGreyDark, 0.5)}
      letterSpacing="uppercase"
      size="smedium"
      weight="semibold"
    >
      {children}
    </TruncatedText>
  </RadialGradient>
);

Pill.propTypes = {
  children: PropTypes.node,
};

export default Pill;

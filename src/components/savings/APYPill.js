import PropTypes from 'prop-types';
import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { Centered } from '../layout';
import { position, fonts } from '../../styles';
import { GradientText } from '../text';

const APYPill = ({ apy }) => (
  <Centered
    style={{
      height: 30,
    }}
  >
    <LinearGradient
      borderRadius={17}
      overflow="hidden"
      colors={['#2CCC00', '#FEBE44']}
      end={{ x: 1, y: 1 }}
      pointerEvents="none"
      start={{ x: 0, y: 0 }}
      opacity={0.1}
      style={position.coverAsObject}
    />
    <GradientText
      align="center"
      angle={false}
      end={{ x: 1, y: 1 }}
      letterSpacing="roundedTight"
      start={{ x: 0, y: 0 }}
      steps={[0, 1]}
      style={{
        fontSize: parseFloat(fonts.size.lmedium),
        fontWeight: fonts.weight.semibold,
        paddingBottom: 1,
        paddingHorizontal: 10,
      }}
    >
      {apy}% APY
    </GradientText>
  </Centered>
);

APYPill.propTypes = {
  apy: PropTypes.string,
};

export default APYPill;

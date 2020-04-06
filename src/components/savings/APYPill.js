import PropTypes from 'prop-types';
import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { position } from '../../styles';
import { Centered } from '../layout';
import { GradientText } from '../text';

const APYPill = ({ value }) => (
  <Centered height={30}>
    <LinearGradient
      borderRadius={17}
      colors={['#2CCC00', '#FEBE44']}
      end={{ x: 1, y: 1 }}
      opacity={0.1}
      overflow="hidden"
      pointerEvents="none"
      start={{ x: 0, y: 0 }}
      style={position.coverAsObject}
    />
    <GradientText
      align="center"
      angle={false}
      end={{ x: 1, y: 1 }}
      letterSpacing="roundedTight"
      size="lmedium"
      start={{ x: 0, y: 0 }}
      steps={[0, 1]}
      style={{
        paddingBottom: 1,
        paddingHorizontal: 10,
      }}
      weight="semibold"
    >
      {value}% APY
    </GradientText>
  </Centered>
);

APYPill.propTypes = {
  value: PropTypes.node,
};

export default React.memo(APYPill);

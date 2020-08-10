import MaskedView from '@react-native-community/masked-view';
import React from 'react';
import Animated from 'react-native-reanimated';
import styled from 'styled-components/primitives';
import { Icon } from '../../../icons';

const AnimatedMaskedView = Animated.createAnimatedComponent(MaskedView);

const ArrowIcon = styled(Icon).attrs({
  direction: 'right',
  name: 'fatArrow',
})``;

export default function ChartChangeDirectionArrow({ style, arrowStyle }) {
  return (
    <Animated.View style={style}>
      <AnimatedMaskedView
        maskElement={<ArrowIcon />}
        style={{ height: 18, width: 15 }}
      >
        <Animated.View
          style={[
            { backgroundColor: '#324376', flex: 1, height: '100%' },
            arrowStyle,
          ]}
        />
      </AnimatedMaskedView>
    </Animated.View>
  );
}

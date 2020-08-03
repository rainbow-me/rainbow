import React from 'react';
import Animated from 'react-native-reanimated';
import { toRad } from 'react-native-redash';
import styled from 'styled-components/primitives';
import { useMemoOne } from 'use-memo-one';
import { interpolate } from '../../../animations';
import { Icon } from '../../../icons';

const ArrowIcon = styled(Icon).attrs({
  direction: 'left',
  name: 'fatArrow',
})`
  width: 15;
`;

export default function ChartChangeDirectionArrow({
  changeDirection,
  color,
  style,
}) {
  const iconRotationStyle = useMemoOne(() => {
    const rotate = toRad(
      interpolate(changeDirection, {
        inputRange: [-1, 0, 1],
        outputRange: [180, 0, 0],
      })
    );

    return { transform: [{ rotate }] };
  }, [changeDirection]);

  return (
    <Animated.View style={[style, iconRotationStyle]}>
      <ArrowIcon color={color} />
    </Animated.View>
  );
}

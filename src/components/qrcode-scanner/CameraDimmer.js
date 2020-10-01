import React from 'react';
import Animated, { min, sub } from 'react-native-reanimated';
import styled from 'styled-components/primitives';
import { useMemoOne } from 'use-memo-one';
import { scrollPosition } from '../../navigation/ScrollPagerWrapper';

const Dim = styled(Animated.View)`
  flex: 1;
  width: 100%;
`;

export default function CameraDimmer({ children }) {
  const style = useMemoOne(
    () => ({ opacity: min(sub(scrollPosition, 1), 0.9) }),
    []
  );
  return <Dim style={style}>{children}</Dim>;
}

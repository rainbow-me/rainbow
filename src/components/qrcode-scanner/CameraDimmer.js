import React from 'react';
import Animated, {
  and,
  block,
  cond,
  eq,
  min,
  set,
  sub,
} from 'react-native-reanimated';

import styled from 'styled-components';
import { useMemoOne } from 'use-memo-one';
import { scrollPosition } from '../../navigation/ScrollPagerWrapper';
import { useReanimatedValue } from '../list/MarqueeList';
import { useDelayedValueWithLayoutAnimation } from '@rainbow-me/hooks';

const Dim = styled(Animated.View)`
  flex: 1;
  width: 100%;
`;

export default function CameraDimmer({ children, cameraVisible }) {
  const prev = useReanimatedValue(0);
  const prevMem = useReanimatedValue(0);

  const delayedCameraVisible = useDelayedValueWithLayoutAnimation(
    cameraVisible
  );

  const style = useMemoOne(
    () => ({
      opacity: block([
        set(prevMem, prev),
        set(prev, scrollPosition),

        cond(
          and(eq(prevMem, 2), eq(scrollPosition, 1)),
          1,
          cond(
            and(eq(prevMem, 1), eq(scrollPosition, 2)),
            1,
            min(sub(scrollPosition, 1), 0.9)
          )
        ),
      ]),
    }),
    []
  );
  return (
    <Dim style={style}>
      <Dim style={{ opacity: delayedCameraVisible ? 1 : 0 }}>{children}</Dim>
    </Dim>
  );
}

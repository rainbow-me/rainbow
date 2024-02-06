import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import styled from '@/styled-thing';

const LeftFade = styled(LinearGradient).attrs(({ theme: { colors } }) => ({
  colors: [
    colors.white,
    colors.alpha(colors.white, 0.738),
    colors.alpha(colors.white, 0.541),
    colors.alpha(colors.white, 0.382),
    colors.alpha(colors.white, 0.278),
    colors.alpha(colors.white, 0.194),
    colors.alpha(colors.white, 0.126),
    colors.alpha(colors.white, 0.075),
    colors.alpha(colors.white, 0.042),
    colors.alpha(colors.white, 0.021),
    colors.alpha(colors.white, 0.008),
    colors.alpha(colors.white, 0.002),
    colors.alpha(colors.white, 0),
  ],
  end: { x: 1, y: 0.5 },
  locations: [0, 0.19, 0.34, 0.47, 0.565, 0.65, 0.73, 0.802, 0.861, 0.91, 0.952, 0.982, 1],
  pointerEvents: 'none',
  start: { x: 0, y: 0.5 },
}))({
  height: '100%',
  left: 0,
  position: 'absolute',
  width: 19,
});

const RightFade = styled(LinearGradient).attrs(({ theme: { colors } }) => ({
  colors: [
    colors.white,
    colors.alpha(colors.white, 0.738),
    colors.alpha(colors.white, 0.541),
    colors.alpha(colors.white, 0.382),
    colors.alpha(colors.white, 0.278),
    colors.alpha(colors.white, 0.194),
    colors.alpha(colors.white, 0.126),
    colors.alpha(colors.white, 0.075),
    colors.alpha(colors.white, 0.042),
    colors.alpha(colors.white, 0.021),
    colors.alpha(colors.white, 0.008),
    colors.alpha(colors.white, 0.002),
    colors.alpha(colors.white, 0),
  ],
  end: { x: 0, y: 0.5 },
  locations: [0, 0.19, 0.34, 0.47, 0.565, 0.65, 0.73, 0.802, 0.861, 0.91, 0.952, 0.982, 1],
  pointerEvents: 'none',
  start: { x: 1, y: 0.5 },
}))({
  height: '100%',
  position: 'absolute',
  right: 0,
  width: 19,
});

export default function EdgeFade() {
  return (
    <>
      <LeftFade />
      <RightFade />
    </>
  );
}

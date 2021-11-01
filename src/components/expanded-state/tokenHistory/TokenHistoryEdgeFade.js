import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import styled from 'styled-components';

const LeftFade = styled(LinearGradient).attrs(({ theme: { colors } }) => ({
  colors: [
    colors.black,
    colors.alpha(0.738, colors.black),
    colors.alpha(0.541, colors.black),
    colors.alpha(0.382, colors.black),
    colors.alpha(0.278, colors.black),
    colors.alpha(0.194, colors.black),
    colors.alpha(0.126, colors.black),
    colors.alpha(0.075, colors.black),
    colors.alpha(0.042, colors.black),
    colors.alpha(0.021, colors.black),
    colors.alpha(0.008, colors.black),
    colors.alpha(0.002, colors.black),
    colors.alpha(0, colors.black),
  ],
  end: { x: 0, y: 0.5 },
  locations: [
    0,
    0.19,
    0.34,
    0.47,
    0.565,
    0.65,
    0.73,
    0.802,
    0.861,
    0.91,
    0.952,
    0.982,
    1,
  ],
  pointerEvents: 'none',
  start: { x: 1, y: 0.5 },
}))`
  height: 100%;
  left: 0;
  position: absolute;
  width: 24px;
`;

const RightFade = styled(LinearGradient).attrs(({ theme: { colors } }) => ({
  colors: [
    colors.black,
    colors.alpha(0.738, colors.black),
    colors.alpha(0.541, colors.black),
    colors.alpha(0.382, colors.black),
    colors.alpha(0.278, colors.black),
    colors.alpha(0.194, colors.black),
    colors.alpha(0.126, colors.black),
    colors.alpha(0.075, colors.black),
    colors.alpha(0.042, colors.black),
    colors.alpha(0.021, colors.black),
    colors.alpha(0.008, colors.black),
    colors.alpha(0.002, colors.black),
    colors.alpha(0, colors.black),
  ],
  end: { x: 1, y: 0.5 },
  locations: [
    0,
    0.19,
    0.34,
    0.47,
    0.565,
    0.65,
    0.73,
    0.802,
    0.861,
    0.91,
    0.952,
    0.982,
    1,
  ],
  pointerEvents: 'none',
  start: { x: 0, y: 0.5 },
}))`
  height: 100%;
  position: absolute;
  right: 0;
  width: 24px;
`;

export default function TokenHistoryEdgeFade() {
  return (
    <>
      <LeftFade />
      <RightFade />
    </>
  );
}

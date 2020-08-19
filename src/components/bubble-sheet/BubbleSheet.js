import React from 'react';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components/primitives';
import { Column } from '../layout';
import { colors, shadow } from '@rainbow-me/styles';

export const BubbleSheetBorderRadius = 30;

const Container = styled(Column)`
  ${shadow.build(0, 10, 50, colors.black, 0.6)}
  background-color: ${colors.white};
  border-radius: ${BubbleSheetBorderRadius};
  bottom: ${({ bottom }) => (bottom ? 21 : 0)};
  flex-grow: 0;
  flex-shrink: 1;
  left: 0;
  position: absolute;
  right: 0;
  width: 100%;
`;

export default function BubbleSheet(props) {
  const { bottom } = useSafeArea();
  return <Container {...props} bottom={bottom} />;
}

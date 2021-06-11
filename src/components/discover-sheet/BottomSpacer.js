import React from 'react';
import styled from 'styled-components';
import {
  FabWrapperBottomPosition,
  FloatingActionButtonSize,
} from '../../components/fab';

const SpacerHeight = FabWrapperBottomPosition + FloatingActionButtonSize;

const Spacer = styled.View`
  height: ${SpacerHeight};
  width: 100%;
`;

export default function BottomSpacer() {
  return <Spacer />;
}

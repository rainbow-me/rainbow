import React from 'react';
import styled from '@rainbow-me/styled';
import {
  FabWrapperBottomPosition,
  FloatingActionButtonSize,
} from '../../components/fab';

const SpacerHeight = FabWrapperBottomPosition + FloatingActionButtonSize;

const Spacer = styled.View({
  heigh: SpacerHeight,
  width: '100%',
});

export default function BottomSpacer() {
  return <Spacer />;
}

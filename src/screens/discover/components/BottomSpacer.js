import React from 'react';
import {
  FabWrapperBottomPosition,
  FloatingActionButtonSize,
} from '../../../components/fab';
import styled from '@/styled-thing';

const SpacerHeight = FabWrapperBottomPosition + FloatingActionButtonSize;

const Spacer = styled.View({
  height: SpacerHeight,
  width: '100%',
});

export default function BottomSpacer() {
  return <Spacer />;
}

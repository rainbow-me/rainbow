import styled from '@terrysahaidak/style-thing';
import React from 'react';
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

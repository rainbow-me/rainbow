import React from 'react';
import {
  FabWrapperBottomPosition,
  FloatingActionButtonSize,
} from '../../components/fab';
import styled from 'rainbowed-components';

const SpacerHeight = FabWrapperBottomPosition + FloatingActionButtonSize;

const Spacer = styled.View({
  heigh: SpacerHeight,
  width: '100%',
});

export default function BottomSpacer() {
  return <Spacer />;
}

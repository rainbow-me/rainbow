import React from 'react';

import RadialGradient from 'react-native-radial-gradient';

import styled from '@/framework/ui/styled-thing';
import { opacity } from '@/framework/ui/utils/opacity';
import { borders, position } from '@/styles';

import { Text } from '../text';
import ContextMenu from './ContextMenu';

const CircleButton = styled(RadialGradient).attrs(({ theme: { colors } }) => ({
  center: [0, 20],
  colors: colors.gradients.lightestGrey,
}))({
  ...borders.buildCircleAsObject(40),
  ...position.centeredAsObject,
  overflow: 'hidden',
});

const ContextIcon = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: opacity(colors.blueGreyDark, 0.4),
  letterSpacing: 'zero',
  size: 'larger',
  weight: 'bold',
}))({
  height: '100%',
  lineHeight: 39,
  width: '100%',
});

const CircleBtn = props => (
  <CircleButton {...props}>
    <ContextIcon>􀍠</ContextIcon>
  </CircleButton>
);

export default function ContextCircleButton(props) {
  return (
    <ContextMenu {...props} activeOpacity={1}>
      {props.children || <CircleBtn />}
    </ContextMenu>
  );
}

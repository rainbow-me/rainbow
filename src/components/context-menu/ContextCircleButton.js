import React from 'react';
import RadialGradient from 'react-native-radial-gradient';
import { Text } from '../text';
import ContextMenu from './ContextMenu';
import styled from '@rainbow-me/styled';
import { borders, position } from '@rainbow-me/styles';

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
  color: colors.alpha(colors.blueGreyDark, 0.4),
  letterSpacing: 'zero',
  size: 'larger',
  weight: 'bold',
}))({
  height: '100%',
  lineHeight: 39,
  width: '100%',
});

export default function ContextCircleButton(props) {
  return (
    <ContextMenu {...props} activeOpacity={1}>
      <CircleButton {...props}>
        <ContextIcon>􀍠</ContextIcon>
      </CircleButton>
    </ContextMenu>
  );
}

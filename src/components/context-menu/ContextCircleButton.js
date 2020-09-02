import React from 'react';
import RadialGradient from 'react-native-radial-gradient';
import styled from 'styled-components/primitives';
import { Icon } from '../icons';
import ContextMenu from './ContextMenu';
import { borders, colors, position } from '@rainbow-me/styles';

const CircleButton = styled(RadialGradient).attrs({
  center: [0, 20],
  colors: colors.gradients.lightGrey,
})`
  ${borders.buildCircle(40)};
  ${position.centered};
  overflow: hidden;
`;

const ContextIcon = styled(Icon).attrs({
  color: colors.alpha(colors.blueGreyDark, 0.4),
  name: 'threeDots',
  tightDots: true,
})`
  height: 5;
`;

export default function ContextCircleButton(props) {
  return (
    <ContextMenu {...props} activeOpacity={1}>
      <CircleButton {...props}>
        <ContextIcon />
      </CircleButton>
    </ContextMenu>
  );
}

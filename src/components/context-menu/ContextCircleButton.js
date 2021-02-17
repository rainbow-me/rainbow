import React from 'react';
import RadialGradient from 'react-native-radial-gradient';
import styled from 'styled-components';
import { Icon } from '../icons';
import ContextMenu from './ContextMenu';
import { borders, position } from '@rainbow-me/styles';

const CircleButton = styled(RadialGradient).attrs(({ theme: { colors } }) => ({
  center: [0, 20],
  colors: colors.gradients.lightGrey,
}))`
  ${borders.buildCircle(40)};
  ${position.centered};
  overflow: hidden;
`;

const ContextIcon = styled(Icon).attrs(({ theme: { colors } }) => ({
  color: colors.alpha(colors.blueGreyDark, 0.4),
  name: 'threeDots',
  tightDots: true,
}))`
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

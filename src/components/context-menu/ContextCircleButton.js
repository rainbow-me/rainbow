import React from 'react';
import styled from 'styled-components/primitives';
import { borders, colors } from '../../styles';
import { Icon } from '../icons';
import { Centered } from '../layout';
import ContextMenu from './ContextMenu';

const Button = styled(Centered)`
  ${borders.buildCircle(42)};
  background-color: ${colors.alpha(colors.blueGreyDark, 0.06)};
`;

export default function ContextCircleButton(props) {
  return (
    <ContextMenu {...props} activeOpacity={1}>
      <Button>
        <Icon color={colors.alpha(colors.blueGreyDark, 0.4)} name="threeDots" />
      </Button>
    </ContextMenu>
  );
}

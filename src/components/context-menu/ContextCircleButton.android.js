import React, { useMemo } from 'react';
import RadialGradient from 'react-native-radial-gradient';
import { Text } from '../text';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import useLatestCallback from '@/hooks/useLatestCallback';
import styled from '@/framework/ui/styled-thing';
import { borders, position } from '@/styles';
import { opacity } from '@/framework/ui/utils/opacity';

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
  const androidItems = useMemo(
    () => ({
      menuItems: props.options?.map(label => ({
        actionKey: label,
        actionTitle: label,
      })),
    }),
    [props.options]
  );

  const handlePressMenuItem = useLatestCallback(e => {
    const index = androidItems.menuItems?.findIndex(item => item.actionKey === e.nativeEvent.actionKey);
    props.onPressActionSheet(index);
  });

  return (
    <ContextMenuButton isAnchoredToRight menuConfig={androidItems} onPressMenuItem={handlePressMenuItem}>
      {props.children || <CircleBtn />}
    </ContextMenuButton>
  );
}

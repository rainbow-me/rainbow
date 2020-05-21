import React from 'react';
import RadialGradient from 'react-native-radial-gradient';
import { colors } from '../../styles';
import { Icon } from '../icons';
import ContextMenu from './ContextMenu';

const gradientCenter = [0, 20];
const gradientColors = [
  colors.alpha('#ECF1F5', 0.4),
  colors.alpha('#DFE4EB', 0.5),
];

export default function ContextCircleButton(props) {
  return (
    <ContextMenu {...props} activeOpacity={1}>
      <RadialGradient
        borderRadius={20}
        center={gradientCenter}
        colors={gradientColors}
        height={40}
        overflow="hidden"
        width={40}
        {...props}
      >
        <Icon
          alignSelf="center"
          color={colors.alpha(colors.blueGreyDark, 0.4)}
          name="threeDots"
          top={17}
          height={5}
          tightDots
        />
      </RadialGradient>
    </ContextMenu>
  );
}

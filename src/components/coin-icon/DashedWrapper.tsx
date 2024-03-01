import React from 'react';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';
import { Circle } from 'react-native-svg';
import Svg from '../icons/Svg';
import { Box } from '@/design-system';

const maskElement = (
  <Svg viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
    <Circle
      cx="27"
      cy="27"
      r="25"
      stroke="black"
      strokeOpacity="0.25"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray="4 10"
    />
  </Svg>
);

interface DashedWrapperProps {
  children: React.ReactElement;
  size: number;
  childXPosition: number;
  colors: string[];
}

export default function DashedWrapper(props: DashedWrapperProps) {
  const { children, size, childXPosition, colors } = props;

  return (
    <Box width={{ custom: size }} height={{ custom: size }}>
      <MaskedView maskElement={maskElement} style={{ width: size, height: size, position: 'absolute' }}>
        <LinearGradient
          colors={colors}
          end={{ x: 0, y: 0 }}
          pointerEvents="none"
          start={{ x: 1, y: 1 }}
          style={{ width: '100%', height: '100%' }}
        />
      </MaskedView>
      <Box alignItems="center" paddingTop={{ custom: childXPosition }}>
        {children}
      </Box>
    </Box>
  );
}

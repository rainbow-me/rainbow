import React from 'react';
import { View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Box } from '@rainbow-me/design-system';
import { useDimensions } from '@rainbow-me/hooks';

const Fade = ({ alignment }) => {
  const { colors } = useTheme();
  return (
    <Box
      as={LinearGradient}
      colors={
        alignment === 'right'
          ? colors.gradients.fadeOut
          : colors.gradients.fadeIn
      }
      end={{ x: 1, y: 0.5 }}
      height="full"
      left={alignment === 'left' ? '0px' : undefined}
      position="absolute"
      right={alignment === 'right' ? '0px' : undefined}
      start={{ x: 0, y: 0.5 }}
      width={{ custom: 24 }}
    />
  );
};

export default function EdgeFade() {
  const { width } = useDimensions();
  return (
    <View>
      <Fade alignment="left" />
      <Box
        background="accent"
        height="full"
        left={{ custom: 24 }}
        width={{ custom: width - 48 }}
      />
      <Fade alignment="right" />
    </View>
  );
}

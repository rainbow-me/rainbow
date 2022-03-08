import React from 'react';
import { View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useDimensions } from '@rainbow-me/hooks';
import { Box } from '@rainbow-me/design-system';

const Fade = ({ alignment }) => {
  const { colors } = useTheme();
  return (
    <Box
      as={LinearGradient}
      colors={
        alignment === 'right'
          ? colors.gradients.fadeOut.splice().reverse()
          : colors.gradients.fadeOut
      }
      end={{ x: 1, y: 0.5 }}
      start={{ x: 0, y: 0.5 }}
      height="full"
      position="absolute"
      left={alignment === 'left' ? '0px' : undefined}
      right={alignment === 'right' ? '0px' : undefined}
      width={{ custom: 24 }}
    />
  );
};

export default function TokenHistoryEdgeFade() {
  const { width } = useDimensions();
  return (
    <View>
      <Fade alignment="left" />
      <Box
        width={{ custom: width - 48 }}
        height="full"
        background="accent"
        left={{ custom: 24 }}
      />
      <Fade alignment="right" />
    </View>
  );
}

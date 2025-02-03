import React from 'react';
import { Box } from '@/design-system';
import { useTokenLauncherStore } from '../state/tokenLauncherStore';
import { BlurView } from '@react-native-community/blur';
import FastImage from 'react-native-fast-image';

export function BlurredImageBackground() {
  const imageUri = useTokenLauncherStore(state => state.imageUri);

  return (
    <Box position="absolute" width="full" height="full">
      {imageUri && (
        <FastImage source={{ uri: imageUri }} style={{ position: 'absolute', width: '100%', height: '100%' }} resizeMode="cover" />
      )}
      <BlurView
        style={{ position: 'absolute', width: '100%', height: '100%' }}
        blurType="thickMaterialDark"
        blurAmount={100}
        reducedTransparencyFallbackColor="white"
      />
    </Box>
  );
}

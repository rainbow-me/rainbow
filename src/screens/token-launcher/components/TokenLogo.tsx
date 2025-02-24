import React from 'react';
import { Box, Text } from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';
import { View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useUploadToCloudinary } from '../hooks/useUploadToCloudinary';
import { useTokenLauncherStore } from '../state/tokenLauncherStore';
import { Canvas, Image, Shadow, RoundedRect } from '@shopify/react-native-skia';
import { useTokenLauncherContext } from '../context/TokenLauncherContext';

const SIZE = 112;

export function TokenLogo() {
  const { accentColors, tokenSkiaImage } = useTokenLauncherContext();

  const setImageUri = useTokenLauncherStore(state => state.setImageUri);
  const setImageUrl = useTokenLauncherStore(state => state.setImageUrl);

  // TODO: show loading UI if takes longer than 2 seconds
  const { upload, isUploading, error } = useUploadToCloudinary();

  return (
    <ButtonPressAnimation
      onPress={async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 1,
        });

        if (result.assets && result.assets.length > 0) {
          const uri = result.assets[0].uri;
          setImageUri(uri);
          const url = await upload(uri);
          console.log('url', url);
          if (url) {
            setImageUrl(url);
          } else {
            // TODO: log & show error
          }
        }
      }}
    >
      <Box width={SIZE} height={SIZE} borderRadius={SIZE / 2} justifyContent="center" alignItems="center">
        {tokenSkiaImage && (
          <Canvas style={{ width: SIZE, height: SIZE }}>
            <Image x={0} y={0} width={SIZE} height={SIZE} image={tokenSkiaImage} fit="cover"></Image>
            <RoundedRect x={0} y={0} width={SIZE} height={SIZE} r={SIZE / 2}>
              <Shadow dx={0} dy={-1.41} blur={2.81} color={'rgba(0, 0, 0, 0.4)'} inner shadowOnly />
            </RoundedRect>
          </Canvas>
        )}

        {!tokenSkiaImage && (
          <View
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: accentColors.opacity10,
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: SIZE / 2,
              borderWidth: 3,
              borderColor: accentColors.opacity30,
              borderStyle: 'dashed',
            }}
          >
            <Text size="34pt" color={{ custom: accentColors.opacity100 }} weight="bold">
              {'􀅼'}
            </Text>
          </View>
        )}
      </Box>
    </ButtonPressAnimation>
  );
}

import React from 'react';
import { Box, Text } from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';
import { useTheme } from '@/theme';
import { View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useUploadToCloudinary } from '../hooks/useUploadToCloudinary';
import { useTokenLauncherStore } from '../state/tokenLauncherStore';
import { Canvas, useImage, Image, Shadow, RoundedRect } from '@shopify/react-native-skia';
import { useTokenLauncherContext } from '../context/TokenLauncherContext';

const SIZE = 112;

export function TokenLogo() {
  const { colors } = useTheme();
  const { accentColors } = useTokenLauncherContext();

  const imageUri = useTokenLauncherStore(state => state.imageUri);
  const setImageUri = useTokenLauncherStore(state => state.setImageUri);
  const setImageUrl = useTokenLauncherStore(state => state.setImageUrl);

  const imageShadowColor = accentColors.opacity30;

  const image = useImage(imageUri);

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
          if (url) {
            setImageUrl(url);
          } else {
            // TODO: log & show error
          }
        }
      }}
    >
      <Box width={SIZE} height={SIZE} borderRadius={SIZE / 2} justifyContent="center" alignItems="center">
        {imageUri && (
          <Canvas style={{ width: SIZE, height: SIZE }}>
            {/* <RoundedRect x={0} y={0} width={SIZE} height={SIZE} r={SIZE / 2}>
              <Shadow dx={0} dy={4} blur={12} color={imageShadowColor} shadowOnly />
            </RoundedRect>
            <RoundedRect x={0} y={0} width={SIZE} height={SIZE} r={SIZE / 2}>
              <Shadow dx={0} dy={30} blur={34} color={'rgba(37, 41, 46, 0.2)'} shadowOnly />
            </RoundedRect> */}
            <Image x={0} y={0} width={SIZE} height={SIZE} image={image} fit="cover"></Image>
            <RoundedRect x={0} y={0} width={SIZE} height={SIZE} r={SIZE / 2}>
              <Shadow dx={0} dy={-1.41} blur={2.81} color={'rgba(0, 0, 0, 0.4)'} inner shadowOnly />
            </RoundedRect>
            {/* <RoundedRect x={0} y={0} width={SIZE} height={SIZE} r={SIZE / 2}>
              <Shadow dx={0} dy={0.7} blur={3.52} color={'rgba(255, 255, 255, 1)'} inner shadowOnly />
            </RoundedRect> */}
          </Canvas>
        )}

        {!imageUri && (
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

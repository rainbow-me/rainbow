import React from 'react';
import { Box, Text, TextIcon } from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';
import { View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useUploadToCloudinary } from '../hooks/useUploadToCloudinary';
import { useTokenLauncherStore } from '../state/tokenLauncherStore';
import { Canvas, Image, Shadow, RoundedRect } from '@shopify/react-native-skia';
import { useTokenLauncherContext } from '../context/TokenLauncherContext';

const SIZE = 112;

export function TokenLogo() {
  const { accentColors, tokenAnimatedSkiaImage } = useTokenLauncherContext();

  const imageUri = useTokenLauncherStore(state => state.imageUri);
  const setImageUri = useTokenLauncherStore(state => state.setImageUri);
  const setImageUrl = useTokenLauncherStore(state => state.setImageUrl);

  // TODO: show loading UI if takes longer than 2 seconds
  const { upload, isUploading, error } = useUploadToCloudinary();

  return (
    <Box justifyContent="center" alignItems="center">
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
          {tokenAnimatedSkiaImage && imageUri && (
            <Canvas style={{ width: SIZE, height: SIZE }}>
              <Image x={0} y={0} width={SIZE} height={SIZE} image={tokenAnimatedSkiaImage} fit="cover"></Image>
              <RoundedRect x={0} y={0} width={SIZE} height={SIZE} r={SIZE / 2}>
                <Shadow dx={0} dy={-1.41} blur={2.81} color={'rgba(0, 0, 0, 0.4)'} inner shadowOnly />
              </RoundedRect>
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
        {error && (
          <Box
            width={28}
            height={28}
            borderRadius={28 / 2}
            background={'red'}
            style={{
              position: 'absolute',
              right: 0,
              bottom: 5,
            }}
          >
            <TextIcon containerSize={28} color={'label'} size="icon 17px" weight="heavy">
              {'􀅎'}
            </TextIcon>
          </Box>
        )}
      </ButtonPressAnimation>

      {error && (
        <Box paddingTop={'12px'}>
          <Text align="center" size="13pt" color={'red'} weight="medium">
            {'Sorry, there was an error uploading your image.\nPlease try again.'}
          </Text>
        </Box>
      )}
    </Box>
  );
}

import React from 'react';
import { Box, Text } from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';
import { useTheme } from '@/theme';
import FastImage from 'react-native-fast-image';
import { View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useUploadToCloudinary } from '../hooks/useUploadToCloudinary';
import { useTokenLauncherStore } from '../state/tokenLauncherStore';

const SIZE = 112;
const newBlue = '#268FFF';

export function TokenLogo() {
  const { colors } = useTheme();

  const imageUri = useTokenLauncherStore(state => state.imageUri);
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
          if (url) {
            setImageUrl(url);
          } else {
            // TODO: log & show error
          }
        }
      }}
    >
      <Box width={SIZE} height={SIZE} borderRadius={SIZE / 2} justifyContent="center" alignItems="center">
        {imageUri && <FastImage source={{ uri: imageUri }} style={{ width: SIZE, height: SIZE }} />}
        {!imageUri && (
          <View
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: colors.alpha(newBlue, 0.1),
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: SIZE / 2,
              borderWidth: 3,
              borderColor: colors.alpha(newBlue, 0.3),
              borderStyle: 'dashed',
            }}
          >
            <Text size="34pt" color={{ custom: newBlue }} weight="bold">
              {'􀅼'}
            </Text>
          </View>
        )}
      </Box>
    </ButtonPressAnimation>
  );
}

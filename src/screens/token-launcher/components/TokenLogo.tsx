import React, { useCallback, useMemo } from 'react';
import * as i18n from '@/languages';
import { Box, Text, TextIcon, TextShadow } from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';
import { StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useUploadToCloudinary } from '../hooks/useUploadToCloudinary';
import { NavigationSteps, useTokenLauncherStore } from '../state/tokenLauncherStore';
import { Canvas, Image, Shadow, rrect, rect, Box as SkBox, Group } from '@shopify/react-native-skia';
import { useTokenLauncherContext } from '../context/TokenLauncherContext';
import { Extrapolation, interpolate, useDerivedValue } from 'react-native-reanimated';

const SIZE = 112;

export function TokenLogo() {
  const { accentColors, tokenImage } = useTokenLauncherContext();

  const imageUri = useTokenLauncherStore(state => state.imageUri);
  const setImageUri = useTokenLauncherStore(state => state.setImageUri);
  const setImageUrl = useTokenLauncherStore(state => state.setImageUrl);
  const stepAnimatedSharedValue = useTokenLauncherStore(state => state.stepAnimatedSharedValue);

  // TODO: show loading UI if takes longer than 2 seconds
  const { upload, isUploading, error } = useUploadToCloudinary();

  const dropShadowsOpacity = useDerivedValue(() => {
    return interpolate(stepAnimatedSharedValue.value, [NavigationSteps.INFO, NavigationSteps.REVIEW], [0, 1], Extrapolation.CLAMP);
  });

  const onPress = useCallback(async () => {
    // NOTE: There is a bug on iOS simulator devices running iOS 18.0 - https://developer.apple.com/forums/thread/763636
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setImageUri(uri);

      const startTime = Date.now();
      const url = await upload(uri);
      const uploadTime = Date.now() - startTime;

      console.log(`Image upload took ${uploadTime}ms`);

      // if no url is returned the upload function throws an error, this is just a sanity check
      if (url) {
        setImageUrl(url);
      }
    }
  }, [setImageUri, setImageUrl, upload]);

  const roundedRect = useMemo(() => {
    return rrect(rect(0, 0, SIZE, SIZE), SIZE / 2, SIZE / 2);
  }, []);

  // Skia canvas does not support shadow overflow, so we need to add a buffer of the largest shadow offset
  const shadowOverflowBuffer = 30;

  return (
    <Box justifyContent="center" alignItems="center">
      <ButtonPressAnimation onPress={onPress}>
        <Box width={SIZE} height={SIZE} justifyContent="center" alignItems="center">
          {tokenImage && imageUri && (
            <Canvas style={{ width: SIZE + shadowOverflowBuffer, height: SIZE + shadowOverflowBuffer }}>
              <Group transform={[{ translateX: shadowOverflowBuffer / 2 }, { translateY: shadowOverflowBuffer / 2 }]}>
                <SkBox opacity={dropShadowsOpacity} box={roundedRect}>
                  <Shadow dx={0} dy={4} blur={6} color={accentColors.opacity30} />
                  <Shadow dx={0} dy={30} blur={17} color={'rgba(37, 41, 46, 0.2)'} />
                  <Shadow dx={0} dy={0} blur={10} color={accentColors.opacity12} />
                </SkBox>
                <Image clip={roundedRect} x={0} y={0} width={SIZE} height={SIZE} image={tokenImage} fit="cover" />
                <SkBox box={roundedRect}>
                  <Shadow dx={0} dy={0.7} blur={3.52 / 2} color={'rgba(255, 255, 255, 1)'} inner shadowOnly />
                </SkBox>
                <SkBox box={roundedRect} blendMode={'darken'}>
                  <Shadow dx={0} dy={-1.41} blur={2.81 / 2} color={'rgba(0, 0, 0, 0.4)'} inner shadowOnly />
                </SkBox>
              </Group>
            </Canvas>
          )}
          {!imageUri && (
            <Box
              shadow={'30px'}
              borderRadius={SIZE / 2}
              shadowOpacity={0.24}
              shadowColor={accentColors.opacity100}
              background={'surfacePrimary'}
              style={StyleSheet.absoluteFill}
            >
              <Box
                width={'full'}
                height={'full'}
                backgroundColor={accentColors.opacity10}
                justifyContent={'center'}
                alignItems={'center'}
                borderRadius={SIZE / 2}
                style={{
                  borderStyle: 'dashed',
                  borderWidth: 3,
                  borderColor: accentColors.opacity30,
                }}
              >
                <TextShadow blur={12} shadowOpacity={0.24} color={accentColors.opacity100}>
                  <Text size="34pt" color={{ custom: accentColors.opacity100 }} weight="bold">
                    {'􀅼'}
                  </Text>
                </TextShadow>
              </Box>
            </Box>
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
        <Box gap={8} paddingTop={'12px'}>
          <Text align="center" size="13pt" color={'red'} weight="medium">
            {i18n.t(i18n.l.token_launcher.image_upload_error.title)}
          </Text>
          <Text align="center" size="13pt" color={'red'} weight="medium">
            {i18n.t(i18n.l.token_launcher.image_upload_error.subtitle)}
          </Text>
        </Box>
      )}
    </Box>
  );
}

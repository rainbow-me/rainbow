import React, { useCallback, useMemo } from 'react';
import Svg, { Circle } from 'react-native-svg';
import * as i18n from '@/languages';
import { Box, Text, TextIcon, TextShadow } from '@/design-system';
import { IS_IOS } from '@/env';
import { ButtonPressAnimation } from '@/components/animations';
import { StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useUploadToCloudinary } from '../hooks/useUploadToCloudinary';
import { NavigationSteps, useTokenLauncherStore } from '../state/tokenLauncherStore';
import { Canvas, Image, Shadow, rrect, rect, Box as SkBox, Group } from '@shopify/react-native-skia';
import { useTokenLauncherContext } from '../context/TokenLauncherContext';
import { Extrapolation, interpolate, useDerivedValue } from 'react-native-reanimated';
import { ERROR_RED } from '../constants';

const SIZE = 112;

export function TokenLogo({ size = SIZE, disabled = false }: { size?: number; disabled?: boolean }) {
  const { accentColors, tokenImage } = useTokenLauncherContext();

  const imageUri = useTokenLauncherStore(state => state.imageUri);
  const setImageUri = useTokenLauncherStore(state => state.setImageUri);
  const setImageUrl = useTokenLauncherStore(state => state.setImageUrl);
  const stepAnimatedSharedValue = useTokenLauncherStore(state => state.stepAnimatedSharedValue);

  // TODO: show loading UI if takes longer than 2 seconds
  const { upload, error } = useUploadToCloudinary();

  const dropShadowsOpacity = useDerivedValue(() => {
    return interpolate(stepAnimatedSharedValue.value, [NavigationSteps.INFO, NavigationSteps.REVIEW], [0, 1], Extrapolation.CLAMP);
  });

  const onPress = useCallback(async () => {
    // NOTE: There is a bug on iOS simulator devices running iOS 18.0 - https://developer.apple.com/forums/thread/763636
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      const response = await upload(uri);
      // if no url is returned the upload function throws an error, this is just for the types
      if (response?.url) {
        setImageUrl(response.url);
      }
    }
  }, [setImageUri, setImageUrl, upload]);

  const roundedRect = useMemo(() => {
    return rrect(rect(0, 0, size, size), size / 2, size / 2);
  }, [size]);

  // Skia canvas does not support shadow overflow, so we need to add a buffer of the largest shadow offset
  const shadowOverflowBuffer = 30 + 17;

  return (
    <Box justifyContent="center" alignItems="center">
      <ButtonPressAnimation onPress={onPress} disabled={disabled}>
        <Box width={size} height={size} justifyContent="center" alignItems="center">
          {tokenImage && imageUri && (
            <Canvas style={{ width: size + shadowOverflowBuffer, height: size + shadowOverflowBuffer }}>
              <Group transform={[{ translateX: shadowOverflowBuffer / 2 }, { translateY: shadowOverflowBuffer / 2 }]}>
                <SkBox opacity={dropShadowsOpacity} box={roundedRect}>
                  <Shadow dx={0} dy={4} blur={12 / 2} color={accentColors.opacity30} />
                  {/* TODO: In design spec but doesn't look good, ask if can remove */}
                  {/* <Shadow dx={0} dy={30} blur={34 / 2} color={'rgba(37, 41, 46, 0.2)'} /> */}
                  <Shadow dx={0} dy={0} blur={20 / 2} color={accentColors.opacity12} />
                </SkBox>
                <Image clip={roundedRect} x={0} y={0} width={size} height={size} image={tokenImage} fit="cover" />
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
            <Box borderRadius={size / 2} style={StyleSheet.absoluteFill}>
              <Box width={'full'} height={'full'} justifyContent={'center'} alignItems={'center'}>
                <Box
                  backgroundColor={IS_IOS ? accentColors.opacity6 : accentColors.opacity10}
                  borderRadius={size / 2}
                  height={size - 14}
                  position="absolute"
                  width={size - 14}
                />
                <Svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} style={StyleSheet.absoluteFill}>
                  <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={(size - 3.5) / 2}
                    stroke={accentColors.opacity20}
                    strokeWidth={3.5}
                    strokeDasharray={[7, 11]}
                    strokeLinecap="round"
                    fill="none"
                  />
                </Svg>
                <TextShadow blur={40} shadowOpacity={1} color={accentColors.opacity100}>
                  <Text align="center" size="icon 34px" color={{ custom: accentColors.opacity100 }} weight="heavy">
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
            backgroundColor={ERROR_RED}
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
          <Text align="center" size="13pt" color={{ custom: ERROR_RED }} weight="medium">
            {i18n.t(i18n.l.token_launcher.image_upload_error.title)}
          </Text>
          <Text align="center" size="13pt" color={{ custom: ERROR_RED }} weight="medium">
            {i18n.t(i18n.l.token_launcher.image_upload_error.subtitle)}
          </Text>
        </Box>
      )}
    </Box>
  );
}

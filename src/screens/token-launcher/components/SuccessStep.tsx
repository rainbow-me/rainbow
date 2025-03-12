import React, { useCallback, useEffect, useMemo } from 'react';
import * as i18n from '@/languages';
import { Box, Text, TextShadow } from '@/design-system';
import { useTokenLauncherStore } from '../state/tokenLauncherStore';
import { Canvas, LinearGradient, Path, vec, Skia, Group, BlurMask } from '@shopify/react-native-skia';
import { TokenImageBadge } from './TokenImageBadge';
import { useTokenLauncherContext } from '../context/TokenLauncherContext';
import { Easing, useDerivedValue, withRepeat, withTiming, useSharedValue } from 'react-native-reanimated';
import FastImage from 'react-native-fast-image';
import { useDimensions } from '@/hooks';
import { TextSize } from '@/design-system/components/Text/Text';

function Cone({ height, baseWidth, headWidth }: { height: number; baseWidth: number; headWidth: number }) {
  const path = Skia.Path.Make();
  path.moveTo((headWidth - baseWidth) / 2, height);
  path.lineTo((headWidth + baseWidth) / 2, height);
  path.lineTo(headWidth, 0);
  path.lineTo(0, 0);
  path.close();

  return (
    <Group>
      <LinearGradient start={vec(0, 0)} end={vec(0, height)} colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.4)']} />
      <Path path={path}>
        <BlurMask blur={0.6} />
      </Path>
    </Group>
  );
}

function RotatingSunrays({ width, height, focalRadius }: { width: number; height: number; focalRadius: number }) {
  const centerX = width / 2;
  const centerY = height / 2;
  // Width of the base of the ray touching the focal circle
  const coneBaseWidth = 46;
  // Width of the head of the ray
  const coneHeadWidth = 120;
  const coneHeight = 140;

  const backgroundRotation = useSharedValue(0);

  const startRotationAnimation = useCallback(() => {
    backgroundRotation.value = withRepeat(
      withTiming(360, {
        duration: 15000,
        easing: Easing.linear,
      }),
      -1
    );
  }, [backgroundRotation]);

  useEffect(() => {
    startRotationAnimation();
  }, [startRotationAnimation]);

  const backgroundTransform = useDerivedValue(() => {
    const radians = (backgroundRotation.value * Math.PI) / 180;
    return [{ rotate: radians }];
  });

  // Create an array of 8 cones with 45° increments
  const coneAngles = Array.from({ length: 8 }, (_, index) => ({
    angle: (index * Math.PI * 2) / 8,
  }));

  return (
    <Group origin={{ x: centerX, y: centerY }} transform={backgroundTransform}>
      {coneAngles.map((cone, index) => {
        // Calculate position on the circle
        const x = centerX + focalRadius * Math.cos(cone.angle);
        const y = centerY + focalRadius * Math.sin(cone.angle);

        // Calculate the angle to point towards center (add 90° to align properly)
        const pointToCenter = cone.angle + Math.PI / 2;

        return (
          <Group
            key={index}
            transform={[
              { translateX: x },
              { translateY: y },
              // Rotate to point towards center
              { rotate: pointToCenter },
              // Move the cone so its base is at the circle point
              { translateX: -coneHeadWidth / 2 },
              { translateY: -height / 2 },
            ]}
          >
            <Cone height={coneHeight} baseWidth={coneBaseWidth} headWidth={coneHeadWidth} />
          </Group>
        );
      })}
    </Group>
  );
}

function SuccessHero({ width, height }: { width: number; height: number }) {
  const { tokenImage, accentColors } = useTokenLauncherContext();

  const tokenImageBadgeSize = 208;
  const centerX = width / 2;
  const centerY = height / 2;
  const sunraysSize = 445;
  const radius = tokenImageBadgeSize / 16 - 10;

  return (
    <Box height={height} width={width}>
      <FastImage
        source={require('@/assets/blurredHalfRainbow.png')}
        style={{ right: 0, top: height / 3, position: 'absolute', height: 350, width: 234 }}
      />
      <FastImage
        source={require('@/assets/blurredHalfRainbow.png')}
        style={{ left: 0, top: height / 3, position: 'absolute', height: 350, width: 234, transform: [{ scaleX: -1 }] }}
      />
      <Canvas style={{ height, width }}>
        <Group opacity={0.3} transform={[{ translateX: centerX - sunraysSize / 2 }, { translateY: centerY - sunraysSize / 2 }]}>
          <RotatingSunrays width={sunraysSize} height={sunraysSize} focalRadius={radius} />
        </Group>
        <Group transform={[{ translateX: centerX - tokenImageBadgeSize / 2 }, { translateY: centerY - tokenImageBadgeSize / 2 }]}>
          {tokenImage && <TokenImageBadge size={tokenImageBadgeSize} image={tokenImage} accentColor={accentColors.opacity100} />}
        </Group>
      </Canvas>
    </Box>
  );
}

export function SuccessStep() {
  const symbol = useTokenLauncherStore(state => state.symbol);
  const name = useTokenLauncherStore(state => state.name);
  const { height: deviceHeight, width: deviceWidth } = useDimensions();

  const heroHeight = Math.min(deviceHeight * 0.7, 500);
  const heroWidth = deviceWidth;

  const titleFontSize: TextSize = useMemo(() => {
    if (symbol.length > 22) {
      return '11pt';
    } else if (symbol.length >= 18) {
      return '15pt';
    } else if (symbol.length >= 12) {
      return '22pt';
    } else if (symbol.length >= 6) {
      return '30pt';
    }
    return '44pt';
  }, [symbol]);

  return (
    <Box style={{ flex: 1, alignItems: 'center' }}>
      <Box style={{ position: 'absolute', top: 0 }}>
        <SuccessHero width={heroWidth} height={heroHeight} />
      </Box>
      <Box style={{ position: 'absolute', bottom: 40 }} paddingHorizontal={'44px'} gap={20} alignItems="center">
        <TextShadow blur={10} color="rgba(255, 255, 255, 0.12)">
          <Text numberOfLines={1} ellipsizeMode="tail" align="center" size={titleFontSize} weight="bold" color={'label'}>
            {i18n.t(i18n.l.token_launcher.success.title, { symbol })}
          </Text>
        </TextShadow>
        <Text
          numberOfLines={3}
          ellipsizeMode="tail"
          size="20pt"
          weight="medium"
          align="center"
          color={'labelSecondary'}
          style={{ lineHeight: 27 }}
        >
          {i18n.t(i18n.l.token_launcher.success.congrats, { name })}
        </Text>
      </Box>
    </Box>
  );
}

import React, { useCallback, useEffect } from 'react';
import { Box, Text, TextShadow } from '@/design-system';
import { useTokenLauncherStore } from '../state/tokenLauncherStore';
import { Canvas, Image, LinearGradient, Path, vec, Skia, Group, SkImage, processTransform3d, Shadow } from '@shopify/react-native-skia';
import { useTokenLauncherContext } from '../context/TokenLauncherContext';
import { Easing, useDerivedValue, withRepeat, withTiming, useSharedValue } from 'react-native-reanimated';
import FastImage from 'react-native-fast-image';
import { useDimensions } from '@/hooks';

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
      <Path blendMode={'plus'} path={path} />
    </Group>
  );
}

const starPathSVG =
  'M74.2834 4.07109C79.229 -1.35703 87.771 -1.35703 92.7166 4.07108L96.6574 8.39645C99.9381 11.9973 105.016 13.3578 109.657 11.8797L115.233 10.1043C122.23 7.87614 129.627 12.1472 131.196 19.3208L132.446 25.0371C133.487 29.7959 137.204 33.5128 141.963 34.5536L147.679 35.8038C154.853 37.3727 159.124 44.7703 156.896 51.7673L155.12 57.3429C153.642 61.9845 155.003 67.0619 158.604 70.3426L162.929 74.2834C168.357 79.229 168.357 87.771 162.929 92.7166L158.604 96.6574C155.003 99.9381 153.642 105.016 155.12 109.657L156.896 115.233C159.124 122.23 154.853 129.627 147.679 131.196L141.963 132.446C137.204 133.487 133.487 137.204 132.446 141.963L131.196 147.679C129.627 154.853 122.23 159.124 115.233 156.896L109.657 155.12C105.016 153.642 99.9381 155.003 96.6574 158.604L92.7166 162.929C87.771 168.357 79.229 168.357 74.2834 162.929L70.3426 158.604C67.0619 155.003 61.9845 153.642 57.3429 155.12L51.7673 156.896C44.7703 159.124 37.3727 154.853 35.8038 147.679L34.5536 141.963C33.5128 137.204 29.7959 133.487 25.0371 132.446L19.3208 131.196C12.1472 129.627 7.87614 122.23 10.1043 115.233L11.8797 109.657C13.3578 105.016 11.9973 99.9381 8.39645 96.6574L4.07109 92.7166C-1.35703 87.771 -1.35703 79.229 4.07108 74.2834L8.39645 70.3426C11.9973 67.0619 13.3578 61.9845 11.8797 57.3429L10.1043 51.7673C7.87615 44.7703 12.1472 37.3727 19.3208 35.8038L25.0371 34.5536C29.7959 33.5128 33.5128 29.7959 34.5536 25.0371L35.8038 19.3208C37.3727 12.1472 44.7703 7.87614 51.7673 10.1043L57.3429 11.8797C61.9845 13.3578 67.0619 11.9973 70.3426 8.39645L74.2834 4.07109Z';
const starBackgroundPathSVG =
  'M89.1316 6.56756C97.1099 -2.18919 110.89 -2.18919 118.868 6.56756C124.161 12.3766 132.352 14.5713 139.84 12.1869C151.128 8.59241 163.062 15.4825 165.593 27.0552C167.272 34.7322 173.268 40.7284 180.945 42.4074C192.517 44.9384 199.408 56.8724 195.813 68.1602C193.429 75.6482 195.623 83.8391 201.432 89.1316C210.189 97.1099 210.189 110.89 201.432 118.868C195.623 124.161 193.429 132.352 195.813 139.84C199.408 151.128 192.517 163.062 180.945 165.593C173.268 167.272 167.272 173.268 165.593 180.945C163.062 192.517 151.128 199.408 139.84 195.813C132.352 193.429 124.161 195.623 118.868 201.432C110.89 210.189 97.1099 210.189 89.1316 201.432C83.8391 195.623 75.6482 193.429 68.1602 195.813C56.8724 199.408 44.9384 192.517 42.4074 180.945C40.7284 173.268 34.7322 167.272 27.0552 165.593C15.4825 163.062 8.59241 151.128 12.1869 139.84C14.5713 132.352 12.3766 124.161 6.56756 118.868C-2.18919 110.89 -2.18919 97.1099 6.56756 89.1316C12.3766 83.8391 14.5713 75.6482 12.1869 68.1602C8.59241 56.8724 15.4825 44.9384 27.0552 42.4074C34.7322 40.7284 40.7284 34.7322 42.4074 27.0552C44.9384 15.4825 56.8724 8.59241 68.1602 12.1869C75.6482 14.5713 83.8391 12.3766 89.1316 6.56756Z';

function StarTokenImage({ size, image }: { size: number; image: SkImage }) {
  const starPath = Skia.Path.MakeFromSVGString(starPathSVG);
  const starBackgroundPath = Skia.Path.MakeFromSVGString(starBackgroundPathSVG);
  const innerStrokePath = starBackgroundPath?.copy();

  if (!starPath || !starBackgroundPath || !innerStrokePath) return null;

  // These are the reference sizes of the SVG paths above
  const strokeWidth = 11.472;
  const backgroundOriginalSize = 208;
  const imageOriginalSize = 167;
  const imageToBackgroundRatio = imageOriginalSize / backgroundOriginalSize;
  const strokeToBackgroundRatio = strokeWidth / backgroundOriginalSize;

  const imageScaledSize = size * imageToBackgroundRatio;
  const strokeScaledSize = size * strokeToBackgroundRatio;
  const scale = size / backgroundOriginalSize;

  // Calculate scaling factor for inner stroke
  // For a stroke that appears inside the path
  const innerStrokeScale = (size - strokeScaledSize) / size;

  // Scale the paths based on the reference sizes
  starPath.transform(processTransform3d([{ scale: scale }]));
  starBackgroundPath.transform(processTransform3d([{ scale: scale }]));
  innerStrokePath.transform(processTransform3d([{ scale: scale }]));

  // Scale to create an inner stroke effect
  innerStrokePath.transform(processTransform3d([{ scale: innerStrokeScale }]));

  return (
    <Group>
      <Group>
        {/* Main background fill */}
        <Path path={starBackgroundPath} color="white">
          <Shadow dx={0} dy={80} blur={80} color="rgba(232, 177, 112, 1)" />
        </Path>
        <Path path={starBackgroundPath} color="white" opacity={0.7}>
          {/* TODO: adjust start and end to match scale */}
          <LinearGradient start={vec(71, 148.309)} end={vec(299, 148.309)} colors={['#0E76FD', '#61B5FF']} />
        </Path>
        <Path path={starBackgroundPath} color="#EEB776" style="fill" />

        {/* Inner stroke effect*/}
        <Path
          transform={[{ translateX: strokeScaledSize / 2 }, { translateY: strokeScaledSize / 2 }]}
          path={innerStrokePath}
          strokeWidth={strokeScaledSize}
          blendMode={'plus'}
          color="#F5F8FF"
          opacity={0.2}
          style="stroke"
        />
        {/* Inner shadows - approximating the effect3_innerShadow */}
        <Path path={starBackgroundPath}>
          <Shadow dx={0} dy={1.43396} blur={7.16982 / 2} color="rgba(255, 255, 255, 1)" inner shadowOnly />
        </Path>

        {/* Inner shadows - approximating the effect4_innerShadow */}
        <Path path={starBackgroundPath} blendMode="darken">
          <Shadow dx={0} dy={-2.86792} blur={5.73584 / 2} color="rgba(0, 0, 0, 0.4)" inner shadowOnly />
        </Path>
      </Group>
      <Group transform={[{ translateX: (size - imageScaledSize) / 2 }, { translateY: (size - imageScaledSize) / 2 }]}>
        <Path path={starPath}>
          <Shadow dx={0} dy={48.33} blur={54.78} color={'rgba(37, 41, 46, 0.2)'} shadowOnly />
        </Path>
        <Path path={starPath}>
          <Shadow dx={0} dy={0} blur={6} color={'rgba(255, 255, 255, 0.6)'} shadowOnly />
        </Path>
        <Image clip={starPath} image={image} x={0} y={0} width={imageScaledSize} height={imageScaledSize} />
        <Path path={starPath}>
          <Shadow dx={0} dy={0} blur={4} color={'rgba(255, 255, 255, 1)'} inner shadowOnly />
        </Path>
      </Group>
    </Group>
  );
}

function SuccessHero({ width, height }: { width: number; height: number }) {
  const { tokenSkiaImage } = useTokenLauncherContext();
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

  const imageSize = 200;
  const centerX = width / 2;
  const centerY = height / 2;
  const baseWidth = 46;
  const headWidth = 120;
  const radius = imageSize / 16;

  // Create an array of 8 cones with 45° increments
  const coneAngles = Array.from({ length: 8 }, (_, index) => ({
    angle: (index * Math.PI * 2) / 8,
  }));

  if (!tokenSkiaImage) return null;

  return (
    <Canvas style={{ height, width, overflow: 'visible' }}>
      {/* Rotating cones oriented to create a windmill effect */}
      <Group opacity={0.3} origin={{ x: centerX, y: centerY }} transform={backgroundTransform}>
        {coneAngles.map((cone, index) => {
          // Calculate position on the circle
          const x = centerX + radius * Math.cos(cone.angle);
          const y = centerY + radius * Math.sin(cone.angle);

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
                { translateX: -headWidth / 2 },
                { translateY: -height / 2 },
              ]}
            >
              <Cone height={140} baseWidth={baseWidth} headWidth={headWidth} />
            </Group>
          );
        })}
      </Group>
      {/* Token image */}
      <Group transform={[{ translateX: centerX - imageSize / 2 }, { translateY: centerY - imageSize / 2 }]}>
        <StarTokenImage size={imageSize} image={tokenSkiaImage} />
      </Group>
    </Canvas>
  );
}

export function SuccessStep() {
  const symbol = useTokenLauncherStore(state => state.symbol);
  const { height: deviceHeight, width: deviceWidth } = useDimensions();

  const heroHeight = deviceHeight / 2;
  const heroWidth = deviceWidth;

  return (
    <Box style={{ flex: 1, alignItems: 'center' }}>
      <Box gap={16} alignItems="center">
        <Box>
          <FastImage
            source={require('@/assets/blurredHalfRainbow.png')}
            style={{ right: 0, top: 100, position: 'absolute', height: 350, width: 234 }}
          />
          <FastImage
            source={require('@/assets/blurredHalfRainbow.png')}
            style={{ left: 0, top: 100, position: 'absolute', height: 350, width: 234, transform: [{ scaleX: -1 }] }}
          />
          <SuccessHero width={heroWidth} height={heroHeight} />
        </Box>
        <Box gap={16} alignItems="center">
          <TextShadow blur={10} color="rgba(255, 255, 255, 0.12)">
            <Text size="44pt" weight="bold" color={'label'}>
              {`$${symbol} is live!`}
            </Text>
          </TextShadow>
          <Text size="20pt" weight="medium" align="center" color={{ custom: 'rgba(255, 255, 255, 0.4)' }}>
            {`Congrats, you just launched ${symbol} into the world! Share it to spread the vibes`}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

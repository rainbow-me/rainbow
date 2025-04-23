import React, { memo, useMemo, useState } from 'react';
import * as i18n from '@/languages';
import { View, StyleSheet } from 'react-native';
import { Panel, PANEL_WIDTH, TapToDismiss } from '@/components/SmoothPager/ListPanel';
import { DEVICE_HEIGHT, DEVICE_WIDTH } from '@/utils/deviceUtils';
import { safeAreaInsetValues } from '@/utils';
import { SheetHandle } from '@/components/sheet';
import { Box, Text, Separator, TextShadow, AnimatedText } from '@/design-system';
import { foregroundColors, globalColors } from '@/design-system/color/palettes';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity } from '@/__swaps__/utils/swaps';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';
import { SmoothPager, usePagerNavigation } from '@/components/SmoothPager/SmoothPager';
import { ButtonPressAnimation } from '@/components/animations';
import Animated, { Extrapolation, interpolate, SharedValue, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import { useNavigation } from '@/navigation';
import { stepTwoSvg } from './svgs/stepTwoSvg';
import {
  Canvas,
  ImageSVG,
  LinearGradient as SkiaLinearGradient,
  RadialGradient,
  RoundedRect,
  Skia,
  vec,
  Circle,
  Group,
  Blur,
  Path,
} from '@shopify/react-native-skia';
import { useCleanup } from '@/hooks';
import { AnimatedBlurView } from '@/components/AnimatedComponents/AnimatedBlurView';
import { stepOneSvg } from './svgs/stepOneSvg';

const PANEL_HEIGHT = 593;

const STEPS = [
  {
    id: 'step-1',
    title: 'The race is live',
    graphic: stepOneSvg,
    subtitleComponent: () => (
      <Text align="center" size="17pt" weight="medium" color="labelTertiary" style={{ lineHeight: 22.95 }}>
        {'The token with the most'}
        <Text size="17pt" weight="bold" color="label">
          {' buy volume '}
        </Text>
        {'right now is the current king.'}
      </Text>
    ),
  },
  {
    id: 'step-2',
    title: 'One crown a day',
    graphic: stepTwoSvg,
    subtitleComponent: () => (
      <Text align="center" size="17pt" weight="medium" color="labelTertiary" style={{ lineHeight: 22.95 }}>
        {'At'}
        <Text size="17pt" weight="bold" color="label">
          {' midnight (12:00 AM UTC), '}
        </Text>
        {'the leading token is crowned the daily winner.'}
      </Text>
    ),
  },
  {
    id: 'step-3',
    title: 'Win Rewards',
    graphic: stepOneSvg,
    subtitleComponent: () => (
      <Box gap={16}>
        <Text align="center" size="17pt" weight="medium" color="labelTertiary">
          {'⚡️ Buyers of the current King get'}
          <Text size="17pt" weight="bold" color="label">
            {' 2x points'}
          </Text>
        </Text>
        <Text align="center" size="17pt" weight="medium" color="labelTertiary">
          {'👑 Creators'}
          <Text size="17pt" weight="bold" color="label">
            {' earn points '}
          </Text>
          {'when crowned.'}
        </Text>
      </Box>
    ),
  },
];

function PanelSheet({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.panelContainer}>
      <TapToDismiss />
      {children}
    </View>
  );
}

function GradientText({ text }: { text: string }) {
  return (
    <MaskedView
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
        height: '100%',
        width: '100%',
      }}
      maskElement={
        <View style={{ flex: 1, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' }}>
          {/* <TextShadow blur={10}> */}
          <Text align="center" weight="heavy" color="label" size="20pt">
            {text}
          </Text>
          {/* </TextShadow> */}
        </View>
      }
    >
      {/* <LinearGradient
        style={{
          flex: 1,
          width: 'auto',
          height: 'auto',
        }}
        colors={['red', 'yellow']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
      /> */}
      <View style={{ flex: 1, height: '100%', backgroundColor: '#324376' }} />
    </MaskedView>
  );
}

function createConePath({ headWidth, baseWidth, height }: { headWidth: number; baseWidth: number; height: number }) {
  const path = Skia.Path.Make();
  path.moveTo((headWidth - baseWidth) / 2, height);
  path.lineTo((headWidth + baseWidth) / 2, height);
  path.lineTo(headWidth, 0);
  path.lineTo(0, 0);
  path.close();

  return path;
}

function Sunrays({
  rayCount,
  rayFocalWidth,
  rayHeadWidth,
  rayHeight,
  focalRadius,
}: {
  rayCount: number;
  rayFocalWidth: number;
  rayHeadWidth: number;
  rayHeight: number;
  focalRadius: number;
}) {
  const size = rayHeight * 2 + focalRadius;
  const centerX = size / 2;
  const centerY = size / 2;

  const rayPath = useMemo(() => {
    return createConePath({ headWidth: rayHeadWidth, baseWidth: rayFocalWidth, height: rayHeight });
  }, [rayHeadWidth, rayFocalWidth, rayHeight]);

  const rayTransforms = useMemo(() => {
    // Create an array of x cones with equal angle increments
    const rayAngles = Array.from({ length: rayCount }, (_, index) => ({
      angle: (index * Math.PI * 2) / rayCount,
    }));
    return rayAngles.map(cone => {
      // Calculate position on the circle
      const x = centerX + focalRadius * Math.cos(cone.angle);
      const y = centerY + focalRadius * Math.sin(cone.angle);

      // Calculate the angle to point towards center (add 90° to align properly)
      const pointToCenter = cone.angle + Math.PI / 2;

      return [
        { translateX: x },
        { translateY: y },
        // Rotate to point towards center
        { rotate: pointToCenter },
        // Move the cone so its base is at the circle point
        { translateX: -rayHeadWidth / 2 },
        { translateY: -size / 2 },
      ];
    });
  }, [rayCount, centerX, focalRadius, centerY, rayHeadWidth, size]);

  return (
    <Group origin={{ x: centerX, y: centerY }}>
      {rayTransforms.map((transform, index) => (
        <Group key={index} transform={transform}>
          <Path path={rayPath}></Path>
          <SkiaLinearGradient
            start={vec(rayHeadWidth / 2, 0)}
            end={vec(rayHeadWidth / 2, rayHeight)}
            colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.06)']}
          />
        </Group>
      ))}
    </Group>
  );
}

const PanelBackground = memo(function PanelBackground() {
  const glowCircleRadius = 100;

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* <Canvas style={{ flex: 1 }}>
        <Group>
          <Group>
            <Sunrays rayCount={8} rayFocalWidth={35} rayHeadWidth={85} rayHeight={136} focalRadius={85 / 3} />
            <Blur blur={6.88 / 2} />
          </Group>
          <Group transform={[{ translateX: PANEL_WIDTH / 2 - glowCircleRadius }]}>
            <Circle blendMode={'plus'} cx={glowCircleRadius} cy={glowCircleRadius} r={glowCircleRadius}>
              <SkiaLinearGradient
                positions={[0, 0.25, 0.5, 1]}
                start={vec(glowCircleRadius, 0)}
                end={vec(glowCircleRadius, glowCircleRadius * 2)}
                colors={['#02ADDE', '#FFF000', '#EE431D', '#8754C8']}
              />
            </Circle>
            <Circle blendMode={'overlay'} cx={glowCircleRadius} cy={glowCircleRadius} r={glowCircleRadius}>
              <RadialGradient
                c={vec(glowCircleRadius, glowCircleRadius)}
                r={glowCircleRadius}
                colors={['rgba(255, 255, 255, 0.24)', 'rgba(255, 255, 255, 0)']}
              />
            </Circle>
            <Blur blur={41} />
          </Group>
        </Group>
      </Canvas> */}
      <LinearGradient
        locations={[0, 0.25, 0.5, 1]}
        colors={['#02ADDE', '#FFF000', '#EE431D', '#8754C8']}
        style={{ ...StyleSheet.absoluteFillObject, opacity: 0.1 }}
      />
    </View>
  );
});

const PanelHeader = memo(function PanelHeader() {
  const sheetHandleColor = foregroundColors.labelQuaternary.dark;
  return (
    <Box alignItems="center" justifyContent="center" paddingHorizontal="44px" paddingTop={{ custom: 9 }} width="full">
      <SheetHandle color={sheetHandleColor} showBlur={true} />
      {/* <GradientText text="Hello" /> */}
      <Box paddingVertical={'20px'}>
        <Text size="20pt" weight="heavy" color="label">
          {'KING OF THE HILL'}
        </Text>
      </Box>
      <Box width={DEVICE_WIDTH - 30 * 2}>
        <Separator color="separatorTertiary" thickness={THICK_BORDER_WIDTH} />
      </Box>
    </Box>
  );
});

const Step = memo(function Step({
  step,
  stepIndex,
  currentPageIndex,
}: {
  step: (typeof STEPS)[number];
  stepIndex: number;
  currentPageIndex: SharedValue<number>;
}) {
  const blurIntensity = useDerivedValue(() => {
    return interpolate(currentPageIndex.value, [stepIndex - 1, stepIndex, stepIndex + 1], [3, 0, 3], Extrapolation.CLAMP);
  });

  const [graphicSvg] = useState(() => Skia.SVG.MakeFromString(step.graphic));

  useCleanup(() => {
    graphicSvg?.dispose();
  });

  return (
    <Box width={PANEL_WIDTH} justifyContent={'flex-end'} alignItems={'center'} style={{ flex: 1 }}>
      <Canvas style={[StyleSheet.absoluteFill]}>
        <ImageSVG svg={graphicSvg} />
      </Canvas>

      <Box width={PANEL_WIDTH - 2 * 14} justifyContent={'center'} alignItems={'center'}>
        <Box alignItems={'center'} gap={16}>
          <Text size="34pt" weight="heavy" color="label">
            {step.title}
          </Text>
          {step.subtitleComponent()}
        </Box>
      </Box>
      <AnimatedBlurView
        saturationIntensity={1}
        blurStyle={'plain'}
        // @ts-expect-error fix this type
        blurIntensity={blurIntensity}
        style={[StyleSheet.absoluteFill, { top: -8, bottom: -8 }]}
      />
    </Box>
  );
});

const StepIndicatorDot = memo(function StepIndicatorDot({
  index,
  currentIndex,
  size = 6,
}: {
  index: number;
  currentIndex: SharedValue<number>;
  size: number;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const width = interpolate(
      currentIndex.value,
      [index - 2, index - 1, index, index + 1, index + 2],
      [0.8 * size, size, (7 / 3) * size, size, 0.8 * size],
      Extrapolation.CLAMP
    );
    const height = interpolate(
      currentIndex.value,
      [index - 2, index - 1, index, index + 1, index + 2],
      [0.8 * size, size, size, size, 0.8 * size],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(currentIndex.value, [index - 1, index, index + 1], [0.2, 1, 0.2], Extrapolation.CLAMP);

    return {
      width,
      height,
      opacity,
    };
  });

  return <Animated.View style={[{ borderRadius: size / 2, backgroundColor: 'white' }, animatedStyle]} />;
});

const StepIndicators = memo(function StepIndicators({ stepCount, currentIndex }: { stepCount: number; currentIndex: SharedValue<number> }) {
  return (
    <Box flexDirection="row" gap={4} justifyContent="center" alignItems="center">
      {Array.from({ length: stepCount }).map((_, index) => (
        <StepIndicatorDot key={index} index={index} currentIndex={currentIndex} size={6} />
      ))}
    </Box>
  );
});

const PanelContent = memo(function PanelContent() {
  const { goForward, ref } = usePagerNavigation();
  const { goBack: dismissSheet } = useNavigation();

  const currentPageIndex = useDerivedValue(() => {
    return ref.current?.currentPageIndex.value ?? 0;
  });

  const roundedCurrentPageIndex = useDerivedValue(() => {
    return Math.round(currentPageIndex.value);
  });

  const buttonLabel = useDerivedValue(() => {
    return (roundedCurrentPageIndex.value < STEPS.length - 1 ? 'Next' : 'Got it') as string;
  });

  const goToNextStepOrDismiss = () => {
    if (roundedCurrentPageIndex.value < STEPS.length - 1) {
      goForward();
    } else {
      dismissSheet();
    }
  };

  return (
    <Box
      paddingBottom={'24px'}
      paddingHorizontal={{ custom: 14 }}
      width={PANEL_WIDTH}
      alignItems="center"
      justifyContent={'center'}
      style={{ flex: 1 }}
      gap={32}
    >
      <Box gap={20} style={{ flex: 1 }}>
        <SmoothPager
          enableSwipeToGoBack={true}
          enableSwipeToGoForward={true}
          enableSwipeToGoForwardAlways={true}
          initialPage={STEPS[0].id}
          ref={ref}
        >
          <SmoothPager.Page component={<Step step={STEPS[0]} stepIndex={0} currentPageIndex={currentPageIndex} />} id={STEPS[0].id} />
          <SmoothPager.Page component={<Step step={STEPS[1]} stepIndex={1} currentPageIndex={currentPageIndex} />} id={STEPS[1].id} />
          <SmoothPager.Page component={<Step step={STEPS[2]} stepIndex={2} currentPageIndex={currentPageIndex} />} id={STEPS[2].id} />
        </SmoothPager>
        <StepIndicators stepCount={STEPS.length} currentIndex={currentPageIndex} />
      </Box>
      <Box width={'full'} paddingHorizontal="20px">
        <ButtonPressAnimation onPress={goToNextStepOrDismiss}>
          <Box backgroundColor={globalColors.white100} height={48} borderRadius={24} justifyContent="center" alignItems="center">
            <AnimatedText size="20pt" weight="heavy" color={{ custom: globalColors.grey100 }}>
              {buttonLabel}
            </AnimatedText>
          </Box>
        </ButtonPressAnimation>
      </Box>
    </Box>
  );
});

export function KingOfTheHillExplainSheet() {
  return (
    <PanelSheet>
      <Panel height={PANEL_HEIGHT} innerBorderWidth={1} innerBorderColor={'rgba(255, 255, 255, 0.1)'}>
        <PanelBackground />
        <PanelHeader />
        <PanelContent />
      </Panel>
    </PanelSheet>
  );
}

const styles = StyleSheet.create({
  panelContainer: {
    alignItems: 'center',
    flex: 1,
    height: DEVICE_HEIGHT,
    justifyContent: 'flex-end',
    paddingBottom: safeAreaInsetValues.bottom,
    pointerEvents: 'box-none',
  },
});

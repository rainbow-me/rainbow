import React, { memo, useCallback, useMemo } from 'react';
import * as i18n from '@/languages';
import { View, StyleSheet, Text as NativeText } from 'react-native';
import { Panel, PANEL_WIDTH, TapToDismiss } from '@/components/SmoothPager/ListPanel';
import { DEVICE_HEIGHT } from '@/utils/deviceUtils';
import { safeAreaInsetValues } from '@/utils';
import { SheetHandle } from '@/components/sheet';
import { Box, Text, Separator, TextShadow, AnimatedText } from '@/design-system';
import { foregroundColors, globalColors } from '@/design-system/color/palettes';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity } from '@/__swaps__/utils/swaps';
import LinearGradient from 'react-native-linear-gradient';
import { SmoothPager, usePagerNavigation } from '@/components/SmoothPager/SmoothPager';
import { ButtonPressAnimation } from '@/components/animations';
import { Extrapolation, interpolate, SharedValue, useDerivedValue } from 'react-native-reanimated';
import { useNavigation } from '@/navigation';
import chroma from 'chroma-js';
import {
  Canvas,
  LinearGradient as SkiaLinearGradient,
  RadialGradient,
  Skia,
  vec,
  Circle,
  Group,
  Blur,
  Path,
} from '@shopify/react-native-skia';
import { GradientText } from '@/components/text';
import { AnimatedBlurView } from '@/components/AnimatedComponents/AnimatedBlurView';
import { StepIndicators } from './components/StepInidicators';
import currentKingImage from '@/assets/kingOfTheHillExplainer/currentKing.png';
import pointsMultiplierImage from '@/assets/kingOfTheHillExplainer/pointsMultiplier.png';
import FastImage from 'react-native-fast-image';
import { fonts } from '@/styles';

const GRADIENT_COLORS = ['#8754C8', '#EE431D', '#FFF000', '#02ADDE'];
const REVERSE_GRADIENT_COLORS = GRADIENT_COLORS.reverse();
const TEXT_GRADIENT_COLORS = GRADIENT_COLORS.map(color => chroma(color).mix('#F5F8FF', 0.56).hex());
const PANEL_HEIGHT = 563;
const PANEL_HEADER_HEIGHT = 70;
const PANEL_PADDING_HORIZONTAL = 14;
const PANEL_INNER_WIDTH = PANEL_WIDTH - 2 * PANEL_PADDING_HORIZONTAL;

const STEPS = [
  {
    id: 'step-1',
    title: 'The race is live',
    graphicComponent: () => (
      <FastImage source={currentKingImage} style={{ width: PANEL_INNER_WIDTH, height: '100%' }} resizeMode={FastImage.resizeMode.contain} />
    ),
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
    graphicComponent: () => <NativeText style={{ fontSize: 90, fontFamily: fonts.family.SFProRounded, marginTop: -10 }}>{'👑'}</NativeText>,
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
    graphicComponent: () => (
      <FastImage
        source={pointsMultiplierImage}
        style={{ width: PANEL_INNER_WIDTH, height: '80%' }}
        resizeMode={FastImage.resizeMode.contain}
      />
    ),
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
  focalSize,
  blur,
}: {
  rayCount: number;
  rayFocalWidth: number;
  rayHeadWidth: number;
  rayHeight: number;
  focalSize: number;
  blur?: number;
}) {
  const focalRadius = focalSize / 2;
  const size = 2 * (focalRadius + rayHeight);
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
        { translateY: -rayHeight },
      ];
    });
  }, [rayCount, centerX, focalRadius, centerY, rayHeadWidth, rayHeight]);

  return (
    <Group>
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
      {blur && <Blur blur={blur} />}
    </Group>
  );
}

function SunraysBackground() {
  const glowCircleRadius = 100;
  const sunrayFocalSize = 85;
  const sunrayRayHeight = 136;
  const sunraysSize = sunrayRayHeight * 2 + sunrayFocalSize;
  const overflowBuffer = 100;

  return (
    <Canvas style={[StyleSheet.absoluteFill, { marginHorizontal: -overflowBuffer }]}>
      <Group antiAlias dither transform={[{ translateX: overflowBuffer }]}>
        <Group transform={[{ translateX: (PANEL_WIDTH - sunraysSize) / 2 }, { translateY: PANEL_HEADER_HEIGHT / 2 }]}>
          <Sunrays
            rayCount={8}
            rayFocalWidth={30}
            rayHeadWidth={70}
            rayHeight={sunrayRayHeight}
            focalSize={sunrayFocalSize}
            blur={6.88 / 2}
          />
        </Group>
        <Group transform={[{ translateX: PANEL_WIDTH / 2 - glowCircleRadius }, { translateY: PANEL_HEADER_HEIGHT + 36 }]}>
          <Circle blendMode={'plus'} cx={glowCircleRadius} cy={glowCircleRadius} r={glowCircleRadius}>
            <SkiaLinearGradient
              positions={[0, 0.25, 0.5, 1]}
              start={vec(glowCircleRadius, 0)}
              end={vec(glowCircleRadius, glowCircleRadius * 2)}
              colors={REVERSE_GRADIENT_COLORS}
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
    </Canvas>
  );
}

const PanelBackground = memo(function PanelBackground() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient
        locations={[0, 0.25, 0.5, 1]}
        colors={REVERSE_GRADIENT_COLORS}
        style={{ ...StyleSheet.absoluteFillObject, opacity: 0.1 }}
      />
    </View>
  );
});

function PanelSheet({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.panelContainer}>
      <TapToDismiss />
      {children}
    </View>
  );
}

const PanelHeader = memo(function PanelHeader() {
  return (
    <Box
      height={PANEL_HEADER_HEIGHT}
      alignItems="center"
      justifyContent="flex-start"
      paddingHorizontal={{ custom: PANEL_PADDING_HORIZONTAL }}
      paddingTop={{ custom: 9 }}
      width="full"
      zIndex={1}
    >
      <SheetHandle color={foregroundColors.labelQuaternary.dark} showBlur={true} />
      <Box paddingVertical={'20px'}>
        <Box>
          <Box style={StyleSheet.absoluteFill}>
            <GradientText colors={GRADIENT_COLORS} locations={[0, 0.5, 0.75, 1]} bleed={12}>
              <TextShadow shadowOpacity={1} blur={12}>
                <Text size="20pt" weight="black" color="label" style={{ letterSpacing: 0.6 }}>
                  {'KING OF THE HILL'}
                </Text>
              </TextShadow>
            </GradientText>
          </Box>
          <GradientText colors={TEXT_GRADIENT_COLORS} locations={[0, 0.5, 0.75, 1]} bleed={12}>
            <Text size="20pt" weight="black" color="label" style={{ letterSpacing: 0.6 }}>
              {'KING OF THE HILL'}
            </Text>
          </GradientText>
        </Box>
      </Box>
      <Box width={'full'}>
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

  return (
    <Box width={PANEL_WIDTH} justifyContent={'flex-end'} alignItems={'center'} style={{ flex: 1 }}>
      <SunraysBackground />
      <Box alignItems={'center'} marginTop={{ custom: PANEL_HEADER_HEIGHT }} style={{ flex: 1 }}>
        <Box justifyContent={'center'} alignItems={'center'} width={PANEL_INNER_WIDTH} height={280}>
          {step.graphicComponent()}
        </Box>
        <Box gap={18} paddingHorizontal={{ custom: PANEL_PADDING_HORIZONTAL }} width={PANEL_WIDTH}>
          <Text align="center" size="34pt" weight="heavy" color="label">
            {step.title}
          </Text>
          {step.subtitleComponent()}
        </Box>
        <AnimatedBlurView
          saturationIntensity={1}
          blurStyle={'plain'}
          // @ts-expect-error TODO: fix this type
          blurIntensity={blurIntensity}
          style={[StyleSheet.absoluteFill, { top: -8, bottom: -8 }]}
        />
      </Box>
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

  const goToNextStepOrDismiss = useCallback(() => {
    if (roundedCurrentPageIndex.value < STEPS.length - 1) {
      goForward();
    } else {
      dismissSheet();
    }
  }, [dismissSheet, goForward, roundedCurrentPageIndex]);

  return (
    <Box
      paddingBottom={'24px'}
      paddingHorizontal={{ custom: PANEL_PADDING_HORIZONTAL }}
      width={PANEL_WIDTH}
      alignItems="center"
      justifyContent={'center'}
      style={StyleSheet.absoluteFill}
      gap={32}
    >
      <Box gap={20} style={{ flex: 1 }}>
        <SmoothPager enableSwipeToGoBack={true} enableSwipeToGoForward={'always'} initialPage={STEPS[0].id} ref={ref}>
          {STEPS.map((step, index) => (
            <SmoothPager.Page
              key={step.id}
              component={<Step step={step} stepIndex={index} currentPageIndex={currentPageIndex} />}
              id={step.id}
            />
          ))}
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

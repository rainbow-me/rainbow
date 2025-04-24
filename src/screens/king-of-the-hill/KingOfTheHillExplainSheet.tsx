import React, { memo, useCallback } from 'react';
import * as i18n from '@/languages';
import { View, StyleSheet, Text as NativeText } from 'react-native';
import { Panel, PANEL_WIDTH, TapToDismiss } from '@/components/SmoothPager/ListPanel';
import { DEVICE_HEIGHT } from '@/utils/deviceUtils';
import { safeAreaInsetValues } from '@/utils';
import { SheetHandle } from '@/components/sheet';
import { Box, Text, Separator, TextShadow, AnimatedText, ColorModeProvider } from '@/design-system';
import { foregroundColors, globalColors } from '@/design-system/color/palettes';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import LinearGradient from 'react-native-linear-gradient';
import { SmoothPager, usePagerNavigation } from '@/components/SmoothPager/SmoothPager';
import { ButtonPressAnimation } from '@/components/animations';
import { Extrapolation, interpolate, SharedValue, useDerivedValue } from 'react-native-reanimated';
import { useNavigation } from '@/navigation';
import chroma from 'chroma-js';
import { Canvas, LinearGradient as SkiaLinearGradient, RadialGradient, vec, Circle, Group, Blur } from '@shopify/react-native-skia';
import { GradientText } from '@/components/text';
import { AnimatedBlurView } from '@/components/AnimatedComponents/AnimatedBlurView';
import { StepIndicators } from './components/StepInidicators';
import currentKingImage from '@/assets/kingOfTheHillExplainer/currentKing.png';
import pointsMultiplierImage from '@/assets/kingOfTheHillExplainer/pointsMultiplier.png';
import FastImage from 'react-native-fast-image';
import { fonts } from '@/styles';
import { Sunrays } from './components/Sunrays';
import { getColorForTheme } from '@/design-system/color/useForegroundColor';

const GRADIENT_COLORS = ['#8754C8', '#EE431D', '#FFF000', '#02ADDE'];
const REVERSE_GRADIENT_COLORS = GRADIENT_COLORS.reverse();
const TEXT_GRADIENT_COLORS = GRADIENT_COLORS.map(color => chroma(color).mix('#F5F8FF', 0.56).hex());
const PANEL_HEIGHT = 563;
const PANEL_HEADER_HEIGHT = 70;
const PANEL_PADDING_HORIZONTAL = 14;
const PANEL_INNER_WIDTH = PANEL_WIDTH - 2 * PANEL_PADDING_HORIZONTAL;

const translations = i18n.l.king_of_hill.explain_sheet;
const nextButtonLabel = i18n.t(translations.next);
const gotItButtonLabel = i18n.t(translations.got_it);

const STEPS = [
  {
    id: 'step-1',
    title: i18n.t(translations.steps.step_1.title),
    graphicComponent: () => (
      <FastImage source={currentKingImage} style={{ width: PANEL_INNER_WIDTH, height: '100%' }} resizeMode={FastImage.resizeMode.contain} />
    ),
    subtitleComponent: () => (
      <Text align="center" size="17pt" weight="medium" color="labelTertiary" style={{ lineHeight: 22.95 }}>
        {i18n.t(translations.steps.step_1.subtitle_parts[0])}
        <Text size="17pt" weight="bold" color="label">
          {i18n.t(translations.steps.step_1.subtitle_parts[1])}
        </Text>
        {i18n.t(translations.steps.step_1.subtitle_parts[2])}
      </Text>
    ),
  },
  {
    id: 'step-2',
    title: i18n.t(translations.steps.step_2.title),
    graphicComponent: () => <NativeText style={{ fontSize: 90, fontFamily: fonts.family.SFProRounded, marginTop: -10 }}>{'👑'}</NativeText>,
    subtitleComponent: () => (
      <Text align="center" size="17pt" weight="medium" color="labelTertiary" style={{ lineHeight: 22.95 }}>
        {i18n.t(translations.steps.step_2.subtitle_parts[0])}
        <Text size="17pt" weight="bold" color="label">
          {i18n.t(translations.steps.step_2.subtitle_parts[1])}
        </Text>
        {i18n.t(translations.steps.step_2.subtitle_parts[2])}
      </Text>
    ),
  },
  {
    id: 'step-3',
    title: i18n.t(translations.steps.step_3.title),
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
          {`⚡️ ${i18n.t(translations.steps.step_3.subtitle_parts[0])}`}
          <Text size="17pt" weight="bold" color="label">
            {i18n.t(translations.steps.step_3.subtitle_parts[1])}
          </Text>
        </Text>
        <Text align="center" size="17pt" weight="medium" color="labelTertiary">
          {`👑 ${i18n.t(translations.steps.step_3.subtitle_two_parts[0])}`}
          <Text size="17pt" weight="bold" color="label">
            {i18n.t(translations.steps.step_3.subtitle_two_parts[1])}
          </Text>
          {i18n.t(translations.steps.step_3.subtitle_two_parts[2])}
        </Text>
      </Box>
    ),
  },
];

const BACKGROUND_CONFIG = {
  glowCircleRadius: 100,
  sunrayFocalSize: 85,
  sunrayRayHeight: 136,
  overflowBuffer: 100,
};

const SunraysBackground = memo(function SunraysBackground() {
  const { glowCircleRadius, sunrayFocalSize, sunrayRayHeight, overflowBuffer } = BACKGROUND_CONFIG;
  const sunraysSize = sunrayRayHeight * 2 + sunrayFocalSize;

  return (
    <Canvas style={[StyleSheet.absoluteFill, { marginHorizontal: -overflowBuffer }]}>
      <Group antiAlias dither transform={[{ translateX: overflowBuffer }]}>
        <Group transform={[{ translateX: (PANEL_WIDTH - sunraysSize) / 2 }, { translateY: PANEL_HEADER_HEIGHT / 2 }]}>
          <Sunrays rayCount={8} rayFocalWidth={30} rayHeadWidth={70} rayHeight={sunrayRayHeight} focalSize={sunrayFocalSize} blur={4.44} />
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
});

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
                <Text size="20pt" weight="black" color="label" uppercase style={{ letterSpacing: 0.6 }}>
                  {i18n.t(i18n.l.king_of_hill.king_of_the_hill)}
                </Text>
              </TextShadow>
            </GradientText>
          </Box>
          <GradientText colors={TEXT_GRADIENT_COLORS} locations={[0, 0.5, 0.75, 1]} bleed={12}>
            <Text size="20pt" weight="black" color="label" uppercase style={{ letterSpacing: 0.6 }}>
              {i18n.t(i18n.l.king_of_hill.king_of_the_hill)}
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
    <Box width={PANEL_WIDTH} justifyContent={'flex-end'} alignItems={'center'} style={styles.flex}>
      <SunraysBackground />
      <Box alignItems={'center'} marginTop={{ custom: PANEL_HEADER_HEIGHT }} style={styles.flex}>
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
          blurStyle={'plain'}
          // @ts-expect-error the type created when using createAnimatedComponent is not correct
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
    return roundedCurrentPageIndex.value < STEPS.length - 1 ? nextButtonLabel : gotItButtonLabel;
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
      <Box gap={20} style={styles.flex}>
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
          <Box background="surfaceSecondary" shadow="30px" height={48} borderRadius={24}>
            <Box backgroundColor={globalColors.white100} height={'full'} width={'full'} justifyContent="center" alignItems="center">
              <AnimatedText size="20pt" weight="heavy" color={{ custom: globalColors.grey100 }}>
                {buttonLabel}
              </AnimatedText>
            </Box>
          </Box>
        </ButtonPressAnimation>
      </Box>
    </Box>
  );
});

export function KingOfTheHillExplainSheet() {
  const separatorSecondaryColor = getColorForTheme('separatorSecondary', 'dark');

  return (
    <ColorModeProvider value={'dark'}>
      <PanelSheet>
        <Panel height={PANEL_HEIGHT} innerBorderWidth={1} innerBorderColor={separatorSecondaryColor}>
          <PanelBackground />
          <PanelHeader />
          <PanelContent />
        </Panel>
      </PanelSheet>
    </ColorModeProvider>
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
  flex: {
    flex: 1,
  },
});

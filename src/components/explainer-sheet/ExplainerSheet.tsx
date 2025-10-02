import React, { memo, useCallback, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Panel, PANEL_WIDTH, TapToDismiss } from '@/components/SmoothPager/ListPanel';
import { DEVICE_HEIGHT, DEVICE_WIDTH } from '@/utils/deviceUtils';
import { safeAreaInsetValues } from '@/utils';
import { SheetHandle } from '@/components/sheet';
import { Box, Separator, AnimatedText } from '@/design-system';
import { foregroundColors, globalColors } from '@/design-system/color/palettes';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import LinearGradient from 'react-native-linear-gradient';
import { downscalePagerIndex, SmoothPager, usePagerNavigation } from '@/components/SmoothPager/SmoothPager';
import { ButtonPressAnimation } from '@/components/animations';
import { Extrapolation, interpolate, SharedValue, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import { useNavigation } from '@/navigation';
import { Canvas, LinearGradient as SkiaLinearGradient, RadialGradient, vec, Circle, Group, Blur } from '@shopify/react-native-skia';
import { AnimatedBlurView } from '@/components/AnimatedComponents/AnimatedBlurView';
import { StepIndicators } from './components/StepIndicators';
import { Sunrays } from './components/Sunrays';
import { getColorForTheme } from '@/design-system/color/useForegroundColor';

const DEFAULT_GRADIENT_COLORS = ['#8754C8', '#EE431D', '#FFF000', '#02ADDE'];
const DEFAULT_PANEL_HEIGHT = 563;
const PANEL_HEADER_HEIGHT = 70;
const PANEL_PADDING_HORIZONTAL = 14;
export const PANEL_INNER_WIDTH = PANEL_WIDTH - 2 * PANEL_PADDING_HORIZONTAL;

const BACKGROUND_CONFIG = {
  glowCircleRadius: 100,
  sunrayFocalSize: 85,
  sunrayRayHeight: 136,
  overflowBuffer: 100,
};

export interface ExplainerSheetStep {
  id: string;
  titleComponent: () => ReactNode;
  graphicComponent: () => ReactNode;
  subtitleComponent: () => ReactNode;
}

export interface ExplainerSheetButtonProps {
  label: SharedValue<string>;
  onPress: () => void;
  isLastStep: SharedValue<boolean>;
}

export interface ExplainerSheetConfig {
  steps: ExplainerSheetStep[];
  headerTitleComponent: () => ReactNode;
  gradientColors?: string[];
  panelHeight?: number;
  nextButtonLabel: string;
  completeButtonLabel: string;
  showSunrays?: boolean;
  BackgroundComponent?: React.ComponentType;
  ButtonComponent?: React.ComponentType<ExplainerSheetButtonProps>;
}

const SunraysBackground = memo(function SunraysBackground({ gradientColors }: { gradientColors: string[] }) {
  const { glowCircleRadius, sunrayFocalSize, sunrayRayHeight, overflowBuffer } = BACKGROUND_CONFIG;
  const sunraysSize = sunrayRayHeight * 2 + sunrayFocalSize;
  const reverseGradientColors = [...gradientColors].reverse();

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
              colors={reverseGradientColors}
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

const DefaultPanelBackground = memo(function DefaultPanelBackground({ gradientColors }: { gradientColors: string[] }) {
  const reverseGradientColors = [...gradientColors].reverse();

  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient
        locations={[0, 0.25, 0.5, 1]}
        colors={reverseGradientColors}
        style={{ ...StyleSheet.absoluteFillObject, opacity: 0.1 }}
      />
    </View>
  );
});

function PanelSheet({ children }: { children: ReactNode }) {
  return (
    <View style={styles.panelContainer}>
      <TapToDismiss />
      {children}
    </View>
  );
}

const PanelHeader = memo(function PanelHeader({ titleComponent }: { titleComponent: () => ReactNode }) {
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
        <Box>{titleComponent()}</Box>
      </Box>
      <Box width={'full'}>
        <Separator color="separatorTertiary" thickness={THICK_BORDER_WIDTH} />
      </Box>
    </Box>
  );
});

const DefaultExplainerButton = memo(function DefaultExplainerButton({ label, onPress }: ExplainerSheetButtonProps) {
  return (
    <ButtonPressAnimation onPress={onPress}>
      <Box background="surfaceSecondary" shadow="30px" height={48} borderRadius={24}>
        <Box backgroundColor={globalColors.white100} height={'full'} width={'full'} justifyContent="center" alignItems="center">
          <AnimatedText size="20pt" weight="heavy" color={{ custom: globalColors.grey100 }}>
            {label}
          </AnimatedText>
        </Box>
      </Box>
    </ButtonPressAnimation>
  );
});

const Step = memo(function Step({
  step,
  stepIndex,
  currentPageIndex,
  showSunrays,
  gradientColors,
}: {
  step: ExplainerSheetStep;
  stepIndex: number;
  currentPageIndex: SharedValue<number>;
  showSunrays: boolean;
  gradientColors: string[];
}) {
  const blurIntensity = useDerivedValue(() => {
    return interpolate(currentPageIndex.value, [stepIndex - 1, stepIndex, stepIndex + 1], [3, 0, 3], Extrapolation.CLAMP);
  });

  const blurViewHackFix = useAnimatedStyle(() => ({
    transform: [{ translateX: currentPageIndex.value ? 0 : DEVICE_WIDTH }],
  }));

  return (
    <Box width={PANEL_WIDTH} justifyContent={'flex-end'} alignItems={'center'} style={styles.flex}>
      {showSunrays && <SunraysBackground gradientColors={gradientColors} />}
      <Box alignItems={'center'} marginTop={{ custom: PANEL_HEADER_HEIGHT }} style={styles.flex}>
        <Box justifyContent={'center'} alignItems={'center'} width={PANEL_INNER_WIDTH} height={280}>
          {step.graphicComponent()}
        </Box>
        <Box gap={24} paddingHorizontal={{ custom: PANEL_PADDING_HORIZONTAL }} width={PANEL_WIDTH}>
          {step.titleComponent()}
          {step.subtitleComponent()}
        </Box>
        <AnimatedBlurView
          blurStyle={'plain'}
          // @ts-expect-error the type created when using createAnimatedComponent is not correct
          blurIntensity={blurIntensity}
          style={[StyleSheet.absoluteFill, { top: -8, bottom: -8 }, blurViewHackFix]}
        />
      </Box>
    </Box>
  );
});

const PanelContent = memo(function PanelContent({
  steps,
  nextButtonLabel,
  completeButtonLabel,
  showSunrays,
  gradientColors,
  ButtonComponent = DefaultExplainerButton,
}: {
  steps: ExplainerSheetStep[];
  nextButtonLabel: string;
  completeButtonLabel: string;
  showSunrays: boolean;
  gradientColors: string[];
  ButtonComponent?: React.ComponentType<ExplainerSheetButtonProps>;
}) {
  const { goForward, ref } = usePagerNavigation();
  const { goBack: dismissSheet } = useNavigation();

  const currentPageIndex = useDerivedValue(() => {
    return downscalePagerIndex(ref.current?.currentPageIndex.value ?? 0);
  });

  const roundedCurrentPageIndex = useDerivedValue(() => {
    return Math.round(currentPageIndex.value);
  });

  const buttonLabel = useDerivedValue(() => {
    return roundedCurrentPageIndex.value < steps.length - 1 ? nextButtonLabel : completeButtonLabel;
  });

  const isLastStep = useDerivedValue(() => {
    return roundedCurrentPageIndex.value >= steps.length - 1;
  });

  const goToNextStepOrDismiss = useCallback(() => {
    if (roundedCurrentPageIndex.value < steps.length - 1) {
      goForward();
    } else {
      dismissSheet();
    }
  }, [dismissSheet, goForward, roundedCurrentPageIndex, steps.length]);

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
        <SmoothPager enableSwipeToGoBack={true} enableSwipeToGoForward={'always'} initialPage={steps[0].id} ref={ref}>
          {steps.map((step, index) => (
            <SmoothPager.Page
              key={step.id}
              component={
                <Step
                  step={step}
                  stepIndex={index}
                  currentPageIndex={currentPageIndex}
                  showSunrays={showSunrays}
                  gradientColors={gradientColors}
                />
              }
              id={step.id}
            />
          ))}
        </SmoothPager>
        <StepIndicators stepCount={steps.length} currentIndex={currentPageIndex} />
      </Box>
      <Box width={'full'} paddingHorizontal="20px">
        <ButtonComponent label={buttonLabel} onPress={goToNextStepOrDismiss} isLastStep={isLastStep} />
      </Box>
    </Box>
  );
});

export function ExplainerSheet({
  steps,
  headerTitleComponent,
  gradientColors = DEFAULT_GRADIENT_COLORS,
  panelHeight = DEFAULT_PANEL_HEIGHT,
  nextButtonLabel,
  completeButtonLabel,
  showSunrays = true,
  BackgroundComponent,
  ButtonComponent,
}: ExplainerSheetConfig) {
  const separatorSecondaryColor = getColorForTheme('separatorSecondary', 'dark');
  const Background = BackgroundComponent ?? DefaultPanelBackground;

  return (
    <PanelSheet>
      <Panel height={panelHeight} innerBorderWidth={1} innerBorderColor={separatorSecondaryColor}>
        <Background gradientColors={gradientColors} />
        <PanelHeader titleComponent={headerTitleComponent} />
        <PanelContent
          steps={steps}
          nextButtonLabel={nextButtonLabel}
          completeButtonLabel={completeButtonLabel}
          showSunrays={showSunrays}
          gradientColors={gradientColors}
          ButtonComponent={ButtonComponent}
        />
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
  flex: {
    flex: 1,
  },
});

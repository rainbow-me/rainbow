import {
  SharedValue,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SPRING_CONFIGS, TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { globalColors, useColorMode } from '@/design-system';
import {
  BASE_INPUT_HEIGHT,
  ETH_COLOR_DARK,
  ETH_COLOR_DARK_ACCENT,
  EXPANDED_INPUT_HEIGHT,
  FOCUSED_INPUT_HEIGHT,
} from '@/__swaps__/screens/Swap/constants';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { getColorValueForThemeWorklet, opacityWorklet } from '@/__swaps__/utils/swaps';
import { NavigationSteps } from './useSwapNavigation';

export const useSwapInputStyles = ({
  asset,
  bottomInput,
  otherInputProgress,
  progress,
}: {
  asset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  bottomInput: boolean | undefined;
  otherInputProgress: SharedValue<number>;
  progress: SharedValue<number>;
}) => {
  const { isDarkMode } = useColorMode();

  const bgColor = useDerivedValue(() => {
    return isDarkMode
      ? opacityWorklet(getColorValueForThemeWorklet(asset.value?.highContrastColor, isDarkMode, true), 0.08)
      : opacityWorklet(globalColors.white100, 0.8);
  });

  const expandedBgColor = useDerivedValue(() => {
    return isDarkMode ? bgColor.value : opacityWorklet(globalColors.white100, 0.8);
  });

  const strokeColor = useDerivedValue(() => {
    return isDarkMode
      ? opacityWorklet(
          getColorValueForThemeWorklet(asset.value?.highContrastColor, isDarkMode, true) === ETH_COLOR_DARK
            ? ETH_COLOR_DARK_ACCENT
            : getColorValueForThemeWorklet(asset.value?.highContrastColor, isDarkMode, true),
          0.06
        )
      : globalColors.white100;
  });

  const expandedStrokeColor = useDerivedValue(() => {
    return isDarkMode
      ? opacityWorklet(getColorValueForThemeWorklet(asset.value?.highContrastColor, isDarkMode, true), 0.1)
      : globalColors.white100;
  });

  const containerStyle = useAnimatedStyle(() => {
    const getContainerStyleTranslateY = (progress: SharedValue<number>, bottomInput: boolean | undefined) => {
      let yTranslation = 0;
      if (progress.value === NavigationSteps.SEARCH_FOCUSED) {
        if (bottomInput) {
          yTranslation = -191;
        } else {
          yTranslation = -77;
        }
      }
      return yTranslation;
    };

    return {
      opacity:
        otherInputProgress.value === NavigationSteps.SEARCH_FOCUSED
          ? withTiming(0, TIMING_CONFIGS.fadeConfig)
          : withTiming(1, TIMING_CONFIGS.fadeConfig),
      shadowColor: isDarkMode ? 'transparent' : getColorValueForThemeWorklet(asset.value?.mixedShadowColor, isDarkMode, true),
      transform: [
        {
          translateY: withSpring(getContainerStyleTranslateY(progress, bottomInput), SPRING_CONFIGS.keyboardConfig),
        },
      ],
    };
  });

  const inputHeight = useDerivedValue(() =>
    withSpring(
      interpolate(progress.value, [0, 1, 2], [BASE_INPUT_HEIGHT, EXPANDED_INPUT_HEIGHT, FOCUSED_INPUT_HEIGHT], 'clamp'),
      SPRING_CONFIGS.springConfig
    )
  );

  const inputStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: withTiming(
        interpolateColor(progress.value, [0, 1], [bgColor.value, expandedBgColor.value]),
        TIMING_CONFIGS.fadeConfig
      ),
      borderColor: withTiming(
        interpolateColor(progress.value, [0, 1], [strokeColor.value, expandedStrokeColor.value]),
        TIMING_CONFIGS.fadeConfig
      ),
      transform: [
        {
          translateY: bottomInput
            ? withSpring(
                interpolate(otherInputProgress.value, [0, 1, 2], [0, 0, EXPANDED_INPUT_HEIGHT - FOCUSED_INPUT_HEIGHT], 'clamp'),
                SPRING_CONFIGS.springConfig
              )
            : 0,
        },
      ],
    };
  });

  return { containerStyle, inputHeight, inputStyle };
};

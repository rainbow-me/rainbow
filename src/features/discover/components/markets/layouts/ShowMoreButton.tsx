import { memo, type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition, useAnimatedStyle, withDelay, withTiming } from 'react-native-reanimated';

import { easing, SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { Box, globalColors, Text, TextIcon, useBackgroundColor, useColorMode } from '@/design-system';
import { opacity } from '@/framework/ui/utils/opacity';
import * as i18n from '@/languages';

const ENTER_DURATION = 220;
const ENTER_DELAY_STEP = 35;
const MAX_STAGGER_INDEX = 6;

type ShowMoreCellAnimationProps = PropsWithChildren<{
  index: number;
  isCollapsing: boolean;
  overflowItemCount: number;
}>;

type ShowMoreButtonProps = {
  isExpanded: boolean;
  onPress: () => void;
};

const LAYOUT_ANIMATION_CONFIG = SPRING_CONFIGS.snappierSpringConfig;
const SHOW_MORE_LAYOUT_ANIMATION = LinearTransition.springify()
  .mass(LAYOUT_ANIMATION_CONFIG.mass as number)
  .damping(LAYOUT_ANIMATION_CONFIG.damping as number)
  .stiffness(LAYOUT_ANIMATION_CONFIG.stiffness as number);
const ICON_ROTATION_ANIMATION_CONFIG = { duration: 180, easing: easing.bezier.fade };
const LABEL_ENTER_ANIMATION = FadeIn.duration(120).easing(easing.bezier.fade);
const LABEL_EXIT_ANIMATION = FadeOut.duration(90).easing(easing.bezier.fade);

function getStaggerDelay(index: number): number {
  return Math.min(Math.max(index, 0), MAX_STAGGER_INDEX) * ENTER_DELAY_STEP;
}

function getCellEnterAnimation(index: number) {
  return FadeInDown.duration(ENTER_DURATION)
    .easing(easing.bezier.fade)
    .withInitialValues({ opacity: 0, transform: [{ translateY: 12 }] })
    .delay(getStaggerDelay(index));
}

export function getShowMoreCollapseAnimationDuration(itemCount: number): number {
  return ENTER_DURATION + getStaggerDelay(itemCount - 1);
}

export const ShowMoreCellAnimation = memo(function ShowMoreCellAnimation({
  children,
  index,
  isCollapsing,
  overflowItemCount,
}: ShowMoreCellAnimationProps) {
  const collapseDelay = getStaggerDelay(overflowItemCount - 1 - index);

  const animatedStyle = useAnimatedStyle(() => {
    const delay = isCollapsing ? collapseDelay : 0;
    const timingConfig = { duration: ENTER_DURATION, easing: easing.bezier.fade };

    return {
      opacity: withDelay(delay, withTiming(isCollapsing ? 0 : 1, timingConfig)),
      transform: [{ translateY: withDelay(delay, withTiming(isCollapsing ? -12 : 0, timingConfig)) }],
    };
  }, [collapseDelay, isCollapsing]);

  return (
    <Animated.View entering={getCellEnterAnimation(index)} style={animatedStyle}>
      {children}
    </Animated.View>
  );
});

export const ShowMoreButton = memo(function ShowMoreButton({ isExpanded, onPress }: ShowMoreButtonProps) {
  const { isDarkMode } = useColorMode();
  const fillSecondaryColor = useBackgroundColor('fillSecondary');
  const iconBadgeBackgroundColor = isDarkMode ? opacity(globalColors.white100, 0.16) : fillSecondaryColor;

  const showLessLabel = i18n.t(i18n.l.discover.show_less);
  const showMoreLabel = i18n.t(i18n.l.discover.show_more);
  const label = isExpanded ? showLessLabel : showMoreLabel;
  const labelSizer = showLessLabel.length >= showMoreLabel.length ? showLessLabel : showMoreLabel;
  const labelKey = isExpanded ? 'expanded' : 'collapsed';
  const iconStyle = useAnimatedStyle(
    () => ({
      transform: [{ rotate: withTiming(isExpanded ? '180deg' : '0deg', ICON_ROTATION_ANIMATION_CONFIG) }],
    }),
    [isExpanded]
  );

  return (
    <Animated.View layout={SHOW_MORE_LAYOUT_ANIMATION} style={styles.button}>
      <ButtonPressAnimation onPress={onPress} scaleTo={0.96}>
        <Box flexDirection="row" alignItems="center" justifyContent="center" gap={8} height={{ custom: 44 }}>
          <View style={[styles.iconBadge, { backgroundColor: iconBadgeBackgroundColor }]}>
            <Animated.View style={iconStyle}>
              <TextIcon align="center" color="labelQuaternary" size="icon 10px" textStyle={styles.iconGlyph} weight="black">
                {'\u{100188}'}
              </TextIcon>
            </Animated.View>
          </View>
          <View style={styles.labelContainer}>
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none">
              <Text size="17pt" weight="bold" color="labelTertiary" style={styles.labelSizer}>
                {labelSizer}
              </Text>
            </View>
            <Animated.View key={labelKey} entering={LABEL_ENTER_ANIMATION} exiting={LABEL_EXIT_ANIMATION} style={styles.label}>
              <Text size="17pt" weight="bold" color="labelTertiary" align="center">
                {label}
              </Text>
            </Animated.View>
          </View>
        </Box>
      </ButtonPressAnimation>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  button: {
    alignSelf: 'center',
  },
  iconBadge: {
    alignItems: 'center',
    borderRadius: 38,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  iconGlyph: {
    transform: [{ translateY: 1 }],
  },
  label: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    justifyContent: 'center',
  },
  labelSizer: {
    opacity: 0,
  },
});

/** @refresh reset */
import React from 'react';
import Animated, { DerivedValue, LinearTransition, SharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Bleed, Box, IconContainer, Text, TextShadow } from '@/design-system';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';

const ANIMATION_CONFIG = SPRING_CONFIGS.snappierSpringConfig;

export const LAYOUT_ANIMATION = LinearTransition.springify()
  .mass(ANIMATION_CONFIG.mass as number)
  .damping(ANIMATION_CONFIG.damping as number)
  .stiffness(ANIMATION_CONFIG.stiffness as number);

const AnimatedBox = Animated.createAnimatedComponent(Box);

export interface CollapsibleSectionBaseProps {
  content: React.ReactNode;
  icon: string;
  primaryText: string;
  secondaryText?: string;
  expanded: SharedValue<boolean> | DerivedValue<boolean>;
  onToggle?: () => void;
  iconColor?: string; // if provided, used as custom color; otherwise uses 'accent'
}

const SectionHeaderView = React.memo(function SectionHeaderView({
  icon,
  primaryText,
  secondaryText,
  expanded,
  onToggle,
  iconColor,
}: Omit<CollapsibleSectionBaseProps, 'content'>) {
  const rotationStyle = useAnimatedStyle(
    () => ({
      transform: [
        {
          rotate: withSpring(expanded.value ? '0deg' : '-90deg', ANIMATION_CONFIG),
        },
      ],
    }),
    [expanded]
  );

  const iconColorProp = iconColor ? { custom: iconColor } : 'accent';

  return (
    <GestureHandlerButton
      onPressWorklet={onToggle}
      hapticTrigger="tap-end"
      hapticType="soft"
      hitSlop={{ bottom: 28, left: 24, right: 24, top: 28 }}
      scaleTo={0.95}
      style={{ height: 14, justifyContent: 'center', zIndex: 10 }}
    >
      <Bleed vertical="4px">
        <Box height={'full'} flexDirection="row" justifyContent="space-between" alignItems="center">
          <Box flexDirection="row" gap={10} alignItems="center">
            <IconContainer height={14} width={24}>
              <TextShadow blur={12} shadowOpacity={0.24}>
                <Text align="center" color={iconColorProp} size="icon 17px" weight="bold">
                  {icon}
                </Text>
              </TextShadow>
            </IconContainer>
            <Box flexDirection="row" gap={5}>
              <Text weight="heavy" size="20pt" color="label">
                {primaryText}
              </Text>
              {secondaryText && (
                <TextShadow blur={12} shadowOpacity={0.24}>
                  <Text weight="heavy" size="20pt" color="accent">
                    {secondaryText}
                  </Text>
                </TextShadow>
              )}
            </Box>
          </Box>
          <AnimatedBox style={rotationStyle}>
            <IconContainer height={14} width={24}>
              <TextShadow blur={12} shadowOpacity={0.24}>
                <Text weight="heavy" align="center" size="17pt" color={iconColorProp}>
                  􀆈
                </Text>
              </TextShadow>
            </IconContainer>
          </AnimatedBox>
        </Box>
      </Bleed>
    </GestureHandlerButton>
  );
});

export function CollapsibleSectionBase({
  content,
  icon,
  primaryText,
  secondaryText,
  expanded,
  onToggle,
  iconColor,
}: CollapsibleSectionBaseProps) {
  const contentStyle = useAnimatedStyle(
    () => ({
      display: expanded.value ? 'flex' : 'none',
      opacity: withSpring(expanded.value ? 1 : 0, ANIMATION_CONFIG),
    }),
    [expanded]
  );

  return (
    <AnimatedBox layout={LAYOUT_ANIMATION}>
      <SectionHeaderView
        icon={icon}
        primaryText={primaryText}
        secondaryText={secondaryText}
        expanded={expanded}
        onToggle={onToggle}
        iconColor={iconColor}
      />
      <AnimatedBox style={contentStyle}>
        <Box paddingTop="12px">{content}</Box>
      </AnimatedBox>
    </AnimatedBox>
  );
}

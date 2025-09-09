// same as /src/screens/expandedAssetSheet/components/shared/CollapsibleSection.tsx

/** @refresh reset */
import React from 'react';
import Animated, { LinearTransition, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Box, IconContainer, Text, TextShadow } from '@/design-system';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';

const ANIMATION_CONFIG = SPRING_CONFIGS.snappierSpringConfig;

export const LAYOUT_ANIMATION = LinearTransition.springify()
  .mass(ANIMATION_CONFIG.mass as number)
  .damping(ANIMATION_CONFIG.damping as number)
  .stiffness(ANIMATION_CONFIG.stiffness as number);

const AnimatedBox = Animated.createAnimatedComponent(Box);

interface CollapsibleSectionProps {
  content: React.ReactNode;
  icon: string;
  primaryText: string;
  secondaryText?: string;
  iconColor: string;
}

interface SectionHeaderProps {
  icon: string;
  primaryText: string;
  secondaryText?: string;
  expanded: boolean;
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  iconColor: string;
}

const SectionHeader = React.memo(function SectionHeader({
  icon,
  primaryText,
  secondaryText,
  iconColor,
  expanded,
  setExpanded,
}: SectionHeaderProps) {
  const rotationStyle = useAnimatedStyle(
    () => ({
      transform: [
        {
          rotate: withSpring(expanded ? '0deg' : '-90deg', ANIMATION_CONFIG),
        },
      ],
    }),
    [expanded]
  );

  return (
    <GestureHandlerButton
      onPressJS={() => {
        setExpanded(current => !current);
      }}
      hapticTrigger="tap-end"
      hapticType="soft"
      hitSlop={{ bottom: 28, left: 24, right: 24, top: 28 }}
      scaleTo={0.95}
      style={{ height: 14, justifyContent: 'center', zIndex: 10 }}
    >
      <Box height={{ custom: 14 }} flexDirection="row" justifyContent="space-between" alignItems="center">
        <Box flexDirection="row" gap={10} alignItems="center">
          <IconContainer height={14} width={24}>
            <TextShadow blur={12} shadowOpacity={0.24}>
              <Text align="center" color={{ custom: iconColor }} size="icon 17px" weight="bold">
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
              <Text weight="heavy" align="center" size="17pt" color={{ custom: iconColor }}>
                􀆈
              </Text>
            </TextShadow>
          </IconContainer>
        </AnimatedBox>
      </Box>
    </GestureHandlerButton>
  );
});

export function CollapsibleSection({ content, icon, primaryText, secondaryText, iconColor }: CollapsibleSectionProps) {
  const [expanded, setExpanded] = React.useState(false);

  const contentStyle = useAnimatedStyle(
    () => ({
      display: expanded ? 'flex' : 'none',
      opacity: withSpring(expanded ? 1 : 0, ANIMATION_CONFIG),
    }),
    [expanded]
  );

  return (
    <AnimatedBox layout={LAYOUT_ANIMATION}>
      <SectionHeader
        expanded={expanded}
        setExpanded={setExpanded}
        iconColor={iconColor}
        icon={icon}
        primaryText={primaryText}
        secondaryText={secondaryText}
      />
      <AnimatedBox style={contentStyle}>
        <Box paddingTop="24px">{content}</Box>
      </AnimatedBox>
    </AnimatedBox>
  );
}

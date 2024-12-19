/** @refresh reset */
import React from 'react';
import Animated, { LinearTransition, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Box, IconContainer, Text, TextShadow } from '@/design-system';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { SectionId, useExpandedAssetSheetContext } from '../context/ExpandedAssetSheetContext';

const ARBITRARILY_LARGE_MAX_HEIGHT = 10000;

const ANIMATION_CONFIG = {
  duration: 300,
};

const AnimatedBox = Animated.createAnimatedComponent(Box);

interface CollapsibleSectionProps {
  content: React.ReactNode;
  icon: string;
  id: SectionId;
  primaryText: string;
  secondaryText?: string;
}

interface SectionHeaderProps {
  icon: string;
  primaryText: string;
  secondaryText?: string;
  id: SectionId;
}

const SectionHeader = React.memo(function SectionHeader({ icon, primaryText, secondaryText, id }: SectionHeaderProps) {
  const { expandedSections } = useExpandedAssetSheetContext();

  const rotationStyle = useAnimatedStyle(
    () => ({
      transform: [
        {
          rotate: withTiming(expandedSections.value[id] ? '0deg' : '-90deg', ANIMATION_CONFIG),
        },
      ],
    }),
    [expandedSections]
  );

  return (
    <GestureHandlerButton
      onPressWorklet={() => {
        'worklet';
        expandedSections.modify(current => ({
          ...current,
          [id]: !current[id],
        }));
      }}
      scaleTo={0.96}
    >
      <Box height={{ custom: 14 }} flexDirection="row" justifyContent="space-between" alignItems="center">
        <Box flexDirection="row" gap={10} alignItems="center">
          <IconContainer height={14} width={24}>
            <TextShadow blur={12} shadowOpacity={0.24}>
              <Text weight="bold" align="center" size="17pt" color="accent">
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
              <Text weight="heavy" align="center" size="17pt" color="accent">
                􀆈
              </Text>
            </TextShadow>
          </IconContainer>
        </AnimatedBox>
      </Box>
    </GestureHandlerButton>
  );
});

export function CollapsibleSection({ content, icon, id, primaryText, secondaryText }: CollapsibleSectionProps) {
  const { expandedSections } = useExpandedAssetSheetContext();

  const contentStyle = useAnimatedStyle(
    () => ({
      maxHeight: withTiming(expandedSections.value[id] ? ARBITRARILY_LARGE_MAX_HEIGHT : 0, ANIMATION_CONFIG),
      opacity: withTiming(expandedSections.value[id] ? 1 : 0, ANIMATION_CONFIG),
      display: expandedSections.value[id] ? 'flex' : 'none',
    }),
    [expandedSections]
  );

  return (
    <AnimatedBox layout={LinearTransition.duration(ANIMATION_CONFIG.duration)} gap={24}>
      <SectionHeader icon={icon} primaryText={primaryText} secondaryText={secondaryText} id={id} />
      <AnimatedBox style={contentStyle}>{content}</AnimatedBox>
    </AnimatedBox>
  );
}

import React, { useEffect } from 'react';
import useOpenPositionCards from '@/hooks/useOpenPositionCards';
import { StyleSheet } from 'react-native';
import CaretImageSource from '../../../assets/family-dropdown-arrow.png';
import { useTheme } from '../../../theme/ThemeContext';
import { ButtonPressAnimation } from '../../animations';
import { Inline, Text } from '@/design-system';
import * as i18n from '@/languages';
import Animated, { useAnimatedReaction, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import useOpenClaimables from '@/hooks/useOpenClaimables';

export default function WrappedClaimablesListHeader({ total, ...props }: { total: string }) {
  const { colors } = useTheme();
  const { isClaimablesOpen, toggleOpenClaimables } = useOpenClaimables();

  const animationValue = useSharedValue(Number(isClaimablesOpen));

  useEffect(() => {
    animationValue.value = withTiming(isClaimablesOpen ? 1 : 0, {
      duration: 200,
    });
  }, [animationValue, isClaimablesOpen]);

  const caretAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${animationValue.value * 90}deg`,
      },
    ],
  }));

  const totalOpacityAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - animationValue.value,
  }));

  return (
    <ButtonPressAnimation
      key={`claimables_${isClaimablesOpen}`}
      onPress={toggleOpenClaimables}
      scaleTo={1.05}
      style={sx.container}
      testID="claimables-list-header"
    >
      <Inline alignHorizontal="justify" alignVertical="center">
        <Text size="22pt" color="label" weight="heavy">
          {i18n.t(i18n.l.account.tab_claimables)}
        </Text>
        <Inline horizontalSpace="8px" alignVertical="center">
          {!isClaimablesOpen && (
            <Animated.View style={[sx.total, totalOpacityAnimatedStyle]}>
              <Text size="20pt" color="label" weight="regular">
                {total}
              </Text>
            </Animated.View>
          )}
          <Animated.Image source={CaretImageSource} style={[sx.caret, caretAnimatedStyle]} tintColor={colors.dark} />
        </Inline>
      </Inline>
    </ButtonPressAnimation>
  );
}

const sx = StyleSheet.create({
  container: {
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 19,
  },
  caret: {
    height: 18,
    width: 8,
    marginBottom: 1,
    right: 5,
  },
  total: {
    paddingRight: 4,
  },
});

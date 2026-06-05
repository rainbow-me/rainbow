import { memo, type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import Animated, { FadeInDown } from 'react-native-reanimated';

import { easing } from '@/components/animations/animationConfigs';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { Box, globalColors, Text, TextIcon, useBackgroundColor, useColorMode } from '@/design-system';
import { opacity } from '@/framework/ui/utils/opacity';
import * as i18n from '@/languages';

const ENTER_DURATION = 220;
const ENTER_DELAY_STEP = 35;
const MAX_STAGGER_INDEX = 6;

type ShowMoreCellEnterAnimationProps = PropsWithChildren<{
  index: number;
}>;

type ShowMoreButtonProps = {
  onPress: () => void;
};

export const ShowMoreCellEnterAnimation = memo(function ShowMoreCellEnterAnimation({ children, index }: ShowMoreCellEnterAnimationProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(ENTER_DURATION)
        .easing(easing.bezier.fade)
        .withInitialValues({ opacity: 0, transform: [{ translateY: 12 }] })
        .delay(Math.min(index, MAX_STAGGER_INDEX) * ENTER_DELAY_STEP)}
    >
      {children}
    </Animated.View>
  );
});

export const ShowMoreButton = memo(function ShowMoreButton({ onPress }: ShowMoreButtonProps) {
  const { isDarkMode } = useColorMode();
  const fillSecondaryColor = useBackgroundColor('fillSecondary');
  const iconBadgeBackgroundColor = isDarkMode ? opacity(globalColors.white100, 0.16) : fillSecondaryColor;

  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.96} style={styles.button}>
      <Box flexDirection="row" alignItems="center" justifyContent="center" gap={8} height={{ custom: 44 }}>
        <View style={[styles.iconBadge, { backgroundColor: iconBadgeBackgroundColor }]}>
          <TextIcon align="center" color="labelQuaternary" size="icon 10px" textStyle={styles.iconGlyph} weight="black">
            {'\u{100188}'}
          </TextIcon>
        </View>
        <Text size="17pt" weight="bold" color="labelTertiary">
          {i18n.t(i18n.l.discover.show_more)}
        </Text>
      </Box>
    </ButtonPressAnimation>
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
});

import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { Box, globalColors, Text, TextIcon, useBackgroundColor, useColorMode } from '@/design-system';
import { opacity } from '@/framework/ui/utils/opacity';
import * as i18n from '@/languages';

type ShowMoreButtonProps = {
  onPress: () => void;
};

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

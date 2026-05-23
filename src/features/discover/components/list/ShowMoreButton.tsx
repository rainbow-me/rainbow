import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { Box, Text, TextIcon, useColorMode } from '@/design-system';
import { opacity } from '@/framework/ui/utils/opacity';

type ShowMoreButtonProps = {
  onPress: () => void;
};

export const ShowMoreButton = memo(function ShowMoreButton({ onPress }: ShowMoreButtonProps) {
  const { isDarkMode } = useColorMode();
  const iconBadgeBackgroundColor = isDarkMode ? opacity('#FFFFFF', 0.16) : 'rgba(9, 17, 31, 0.05)';

  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.96} style={styles.button}>
      <Box flexDirection="row" alignItems="center" justifyContent="center" gap={8} height={{ custom: 44 }}>
        <View style={[styles.iconBadge, { backgroundColor: iconBadgeBackgroundColor }]}>
          <TextIcon align="center" color="labelQuaternary" size="icon 10px" textStyle={styles.iconGlyph} weight="black">
            {'\u{100188}'}
          </TextIcon>
        </View>
        <Text size="17pt" weight="bold" color="labelTertiary">
          Show more
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

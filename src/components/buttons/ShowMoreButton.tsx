import { memo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { Box, Text, TextIcon } from '@/design-system';
import { opacity } from '@/framework/ui/utils/opacity';

type ShowMoreButtonProps = {
  count: number;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export const ShowMoreButton = memo(function ShowMoreButton({ count, onPress, style }: ShowMoreButtonProps) {
  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.96} style={[styles.button, style]}>
      <Box flexDirection="row" alignItems="center" justifyContent="center" gap={8} height={{ custom: 44 }}>
        <View style={styles.iconBadge}>
          <TextIcon align="center" color="labelQuaternary" opacity={0.4} size="icon 10px" weight="black">
            {'\u{100188}'}
          </TextIcon>
        </View>
        <Text size="17pt" weight="bold" color="labelTertiary">
          {getShowMoreLabel(count)}
        </Text>
      </Box>
    </ButtonPressAnimation>
  );
});

function getShowMoreLabel(count: number): string {
  return count === 2 ? 'Show 2 more' : 'Show more';
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'center',
  },
  iconBadge: {
    alignItems: 'center',
    backgroundColor: opacity('#FFFFFF', 0.16),
    borderRadius: 38,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
});

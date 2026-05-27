import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { Box, globalColors, Text, TextIcon } from '@/design-system';

export function SectionHeader({
  count,
  leadingAccessory,
  onPress,
  showCaret = !!onPress,
  title,
}: {
  count?: number;
  leadingAccessory?: ReactNode;
  showCaret?: boolean;
  title: string;
  onPress?: () => void;
}) {
  return (
    <Box paddingLeft={{ custom: 24 }}>
      <ButtonPressAnimation onPress={onPress} scaleTo={0.9} style={styles.button} disabled={!onPress}>
        <Box flexDirection="row" alignItems="center" gap={4}>
          {leadingAccessory}
          <Text size="22pt" weight="heavy" color="label">
            {title}
          </Text>
          {typeof count === 'number' ? (
            <View style={styles.countBadge}>
              <Text color={{ custom: globalColors.white100 }} size="13pt" style={styles.countBadgeText} weight="heavy">
                {count}
              </Text>
            </View>
          ) : null}
          {showCaret && onPress && (
            <TextIcon size="icon 15px" weight="heavy" color="labelQuaternary">
              {'􀯻'}
            </TextIcon>
          )}
        </Box>
      </ButtonPressAnimation>
    </Box>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
  },
  countBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.19)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 8,
    borderWidth: 1.333,
    height: 23,
    justifyContent: 'center',
    minWidth: 24,
    paddingHorizontal: 7,
  },
  countBadgeText: {
    fontSize: 14,
    letterSpacing: 0,
    lineHeight: 14,
    transform: [{ translateY: 1 }],
  },
});

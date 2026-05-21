import { memo } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { Box, Text, TextIcon } from '@/design-system';

type ShowMoreButtonProps = {
  count: number;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export const ShowMoreButton = memo(function ShowMoreButton({ count, onPress, style }: ShowMoreButtonProps) {
  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.96} style={[styles.button, style]}>
      <Box flexDirection="row" alignItems="center" justifyContent="center" gap={6} height={{ custom: 44 }}>
        <Text size="17pt" weight="heavy" color="label">
          {getShowMoreLabel(count)}
        </Text>
        <TextIcon size="icon 14px" weight="heavy" color="labelQuaternary">
          {'􀆈'}
        </TextIcon>
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
});

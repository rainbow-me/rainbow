import { memo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { Text, TextIcon, useColorMode } from '@/design-system';

type ShowMoreButtonProps = {
  count: number;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export const ShowMoreButton = memo(function ShowMoreButton({ count, onPress, style }: ShowMoreButtonProps) {
  const { isDarkMode } = useColorMode();
  const iconBackgroundColor = isDarkMode ? '#2A2A2D' : '#E7E7EA';
  const foregroundColor = isDarkMode ? '#8E8E93' : '#6E6E73';

  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.96} style={[styles.button, style]}>
      <View style={[styles.iconCircle, { backgroundColor: iconBackgroundColor }]}>
        <TextIcon color={{ custom: foregroundColor }} size="icon 20px" weight="heavy">
          {'􀆈'}
        </TextIcon>
      </View>
      <Text color={{ custom: foregroundColor }} size="26pt" weight="heavy">
        {getShowMoreLabel(count)}
      </Text>
    </ButtonPressAnimation>
  );
});

function getShowMoreLabel(count: number): string {
  return count === 2 ? 'Show 2 more' : 'Show more';
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  iconCircle: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
});

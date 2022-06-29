import React from 'react';
import { Text } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { avatarBuilderStyles } from './avatarBuilderStyles';
import { useTheme } from '@rainbow-me/theme';
import { magicMemo } from '@rainbow-me/utils';

interface Props {
  title: string;
  showSectionTitles?: boolean;
  nextCategoryOffset: Animated.SharedValue<number>;
}

const EmojisListHeader = ({
  title,
  showSectionTitles,
  nextCategoryOffset,
}: Props) => {
  const { colors } = useTheme();

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: nextCategoryOffset.value,
  }));

  if (showSectionTitles) {
    return (
      <Animated.View
        style={[
          avatarBuilderStyles.sectionHeaderWrap,
          { backgroundColor: colors.white },
          animatedStyle,
        ]}
      >
        <Text
          style={[
            // @ts-expect-error Font weight type (string) is too broad to be used in styles when using TypeScript. Type Script complains that it should be a union of ... "900" | "800" ...
            avatarBuilderStyles.sectionHeader,
            { color: colors.alpha(colors.blueGreyDark, 0.5) },
          ]}
        >
          {title}
        </Text>
      </Animated.View>
    );
  }
  return null;
};

export default magicMemo(EmojisListHeader, [
  'title',
  'showSectionTitles',
  'nextCategoryOffset',
]);

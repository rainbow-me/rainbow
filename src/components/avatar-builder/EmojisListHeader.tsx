import React from 'react';
import { Text } from 'react-native';
import Animated, { useAnimatedStyle, SharedValue } from 'react-native-reanimated';
import { avatarBuilderStyles } from './avatarBuilderStyles';
import { useTheme } from '@/theme';
import { magicMemo } from '@/utils';

interface Props {
  title: string;
  showSectionTitles?: boolean;
  nextCategoryOffset: SharedValue<number>;
}

const EmojisListHeader = ({ title, showSectionTitles, nextCategoryOffset }: Props) => {
  const { colors } = useTheme();

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: nextCategoryOffset.value,
  }));

  if (showSectionTitles) {
    return (
      <Animated.View style={[avatarBuilderStyles.sectionHeaderWrap, { backgroundColor: colors.white }, animatedStyle]}>
        <Text style={[avatarBuilderStyles.sectionHeader, { color: colors.alpha(colors.blueGreyDark, 0.5) }]}>{title}</Text>
      </Animated.View>
    );
  }
  return null;
};

export default magicMemo(EmojisListHeader, ['title', 'showSectionTitles', 'nextCategoryOffset']);

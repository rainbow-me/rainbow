import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { fonts } from '@rainbow-me/styles';
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
          sx.sectionHeaderWrap,
          { backgroundColor: colors.white },
          animatedStyle,
        ]}
      >
        <Text
          style={[
            sx.sectionHeader,
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

const sx = StyleSheet.create({
  sectionHeader: {
    fontFamily: fonts.family.SFProRounded,
    fontSize: fonts.size.small,
    fontWeight: fonts.weight.semibold,
    letterSpacing: fonts.letterSpacing.rounded,
    paddingBottom: 3.75,
    paddingLeft: 9,
    paddingRight: 9,
    paddingTop: 15.25,
    textTransform: 'uppercase',
    width: '100%',
  },
  sectionHeaderWrap: {
    marginRight: 10,
    paddingLeft: 10,
  },
});

export default magicMemo(EmojisListHeader, [
  'title',
  'showSectionTitles',
  'nextCategoryOffset',
]);

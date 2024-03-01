import { BlurView } from '@react-native-community/blur';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, SharedValue } from 'react-native-reanimated';
import { Categories } from './Categories';
import { AllEmojiHeaderEntry } from './helpers/getFormattedAllEmojiList';
import { fonts } from '@/styles';
import { useTheme } from '@/theme';

const categoryKeys = Object.keys(Categories);

interface Props {
  index: number;
  scrollPosition: SharedValue<number>;
  headerData: AllEmojiHeaderEntry;
}

const EmojisStickyListItem = ({ index, scrollPosition, headerData }: Props) => {
  const { colors } = useTheme();

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: scrollPosition.value,
  }));

  return (
    <View style={sx.sectionStickyHeaderWrap}>
      <Animated.View style={animatedStyle}>
        {ios ? (
          <BlurView
            blurAmount={10}
            blurType="light"
            style={[
              sx.sectionStickyBlur,
              {
                width:
                  (index - 1) / 2 <= categoryKeys.length - 1
                    ? Categories[categoryKeys[(index - 1) / 2]].width
                    : Categories[categoryKeys[categoryKeys.length - 1]].width,
              },
            ]}
          >
            <Text
              style={[
                // @ts-expect-error Font weight type (string) is too broad to be used in styles when using TypeScript. Type Script complains that it should be a union of ... "900" | "800" ...
                sx.sectionStickyHeader,
                { backgroundColor: colors.alpha(colors.white, 0.7) },
              ]}
            >
              {headerData.title}
            </Text>
          </BlurView>
        ) : (
          <View style={sx.sectionStickyBlur}>
            <Text
              style={[
                // @ts-expect-error Font weight type (string) is too broad to be used in styles when using TypeScript. Type Script complains that it should be a union of ... "900" | "800" ...
                sx.sectionStickyHeader,
                { color: colors.alpha(colors.blueGreyDark, 0.5) },
              ]}
            >
              {headerData.title}
            </Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const sx = StyleSheet.create({
  sectionStickyBlur: {
    borderRadius: 11,
    marginTop: 12,
  },
  sectionStickyHeader: {
    fontFamily: fonts.family.SFProRounded,
    fontSize: fonts.size.small,
    fontWeight: fonts.weight.semibold,
    letterSpacing: fonts.letterSpacing.rounded,
    paddingBottom: 3.75,
    paddingLeft: 7,
    paddingRight: 7,
    paddingTop: 3.25,
    textTransform: 'uppercase',
  },
  sectionStickyHeaderWrap: {
    flex: 1,
    marginLeft: 12,
  },
});

export default EmojisStickyListItem;

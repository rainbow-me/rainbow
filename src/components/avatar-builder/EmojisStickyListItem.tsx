import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'react-native-blur-view';
import Animated, { useAnimatedStyle, SharedValue } from 'react-native-reanimated';
import { IS_IOS } from '@/env';
import { fonts } from '@/styles';
import { useTheme } from '@/theme';
import { Categories } from './Categories';
import { AllEmojiHeaderEntry } from './helpers/getFormattedAllEmojiList';

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
        {IS_IOS ? (
          <View
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
            <BlurView blurStyle="light" blurIntensity={10} style={StyleSheet.absoluteFill} />
            <Text style={[sx.sectionStickyHeader, { backgroundColor: colors.alpha(colors.white, 0.7) }]}>{headerData.title}</Text>
          </View>
        ) : (
          <View style={sx.sectionStickyBlur}>
            <Text style={[sx.sectionStickyHeader, { color: colors.alpha(colors.blueGreyDark, 0.5) }]}>{headerData.title}</Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const semibold = fonts.weight.semibold as '600';

const sx = StyleSheet.create({
  sectionStickyBlur: {
    borderRadius: 11,
    marginTop: 12,
    overflow: 'hidden',
  },
  sectionStickyHeader: {
    fontFamily: fonts.family.SFProRounded,
    fontSize: fonts.size.small,
    fontWeight: semibold,
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

import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Categories } from './Categories';
import { fonts } from '@rainbow-me/styles';
import { useTheme } from '@rainbow-me/theme';

const { width } = Dimensions.get('screen');

const EmojisLoader = () => {
  const { colors } = useTheme();

  return (
    <View style={sx.loader}>
      <View style={[sx.sectionHeaderWrap, { backgroundColor: colors.white }]}>
        <Text
          style={[
            sx.sectionHeader,
            { color: colors.alpha(colors.blueGreyDark, 0.5) },
          ]}
        >
          {Categories.people.getTitle()}
        </Text>
      </View>
      {null}
    </View>
  );
};

const sx = StyleSheet.create({
  loader: {
    flex: 1,
    position: 'absolute',
    top: 0,
    width: width,
  },
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

export default React.memo(EmojisLoader);

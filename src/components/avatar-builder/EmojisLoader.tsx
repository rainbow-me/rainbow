import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Categories } from './Categories';
import { avatarBuilderStyles } from './avatarBuilderStyles';
import { useTheme } from '@/theme';

const { width } = Dimensions.get('screen');

const EmojisLoader = () => {
  const { colors } = useTheme();

  return (
    <View style={sx.loader}>
      <View style={[avatarBuilderStyles.sectionHeaderWrap, { backgroundColor: colors.white }]}>
        <Text style={[avatarBuilderStyles.sectionHeader, { color: colors.alpha(colors.blueGreyDark, 0.5) }]}>
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
});

export default React.memo(EmojisLoader);

import { StyleSheet } from 'react-native';
import { fonts } from '@/styles';

const semibold = fonts.weight.semibold as '600';

export const avatarBuilderStyles = StyleSheet.create({
  sectionHeader: {
    fontFamily: fonts.family.SFProRounded,
    fontSize: fonts.size.small,
    fontWeight: semibold,
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

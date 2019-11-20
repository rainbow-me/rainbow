import { StyleSheet } from 'react-native';
import { fonts } from '../../styles';

module.exports = StyleSheet.create({
  backspace: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    width: 80,
  },
  cell: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    maxWidth: 80,
  },
  container: {
    alignItems: 'center',
  },
  number: {
    fontFamily: fonts.family.SFProRounded,
    fontSize: 44,
    fontWeight: fonts.weight.bold,
    lineHeight: 64,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
});

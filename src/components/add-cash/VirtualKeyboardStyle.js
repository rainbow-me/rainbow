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
    width: 80,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
});

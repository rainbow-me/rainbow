import PropTypes from 'prop-types';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../styles';
import { getFontSize } from '../../styles/fonts';
import { ButtonPressAnimation } from '../animations';

const sx = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  text: {
    color: colors.appleBlue,
    fontFamily: fonts.family.SFProRounded,
    fontSize: getFontSize(fonts.size.lmedium),
    fontWeight: fonts.weight.semibold,
    height: 57,
    letterSpacing: fonts.letterSpacing.roundedMedium,
    padding: 15,
  },
  textDisabled: {
    color: colors.alpha(colors.blueGreyDark, 0.2),
  },
});

const WalletOption = ({ editMode, label, onPress }) => (
  <ButtonPressAnimation disabled={editMode} scaleTo={0.98} onPress={onPress}>
    <View style={sx.container}>
      <Text style={[sx.text, editMode ? sx.textDisabled : null]}>{label}</Text>
    </View>
  </ButtonPressAnimation>
);

WalletOption.propTypes = {
  label: PropTypes.string.isRequired,
  onPress: PropTypes.func,
};

export default WalletOption;

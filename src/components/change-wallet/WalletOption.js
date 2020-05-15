import PropTypes from 'prop-types';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../styles';
import { getFontSize } from '../../styles/fonts';
import { ButtonPressAnimation } from '../animations';
import WalletDivider from './WalletDivider';

const sx = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    marginLeft: 19,
    paddingVertical: 19,
  },
  text: {
    color: colors.appleBlue,
    fontFamily: fonts.family.SFProRounded,
    fontSize: getFontSize(fonts.size.lmedium),
    fontWeight: fonts.weight.semibold,
    letterSpacing: fonts.letterSpacing.roundedMedium,
  },
  textDisabled: {
    color: colors.lightGrey,
  },
});

const WalletOption = ({ editMode, label, onPress }) => (
  <ButtonPressAnimation disabled={editMode} scaleTo={0.96} onPress={onPress}>
    <WalletDivider />
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

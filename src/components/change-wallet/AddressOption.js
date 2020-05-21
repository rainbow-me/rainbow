import PropTypes from 'prop-types';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../styles';
import { getFontSize } from '../../styles/fonts';
import { ButtonPressAnimation } from '../animations';

const sx = StyleSheet.create({
  optionContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  optionText: {
    color: colors.appleBlue,
    fontFamily: fonts.family.SFProRounded,
    fontSize: getFontSize(fonts.size.lmedium),
    fontWeight: fonts.weight.semibold,
    letterSpacing: fonts.letterSpacing.roundedMedium,
    marginBottom: 9.5,
    paddingHorizontal: 19,
    paddingVertical: 9.5,
  },
  optionTextDisabled: {
    color: colors.alpha(colors.blueGreyDark, 0.2),
  },
});

export default function AddressOption({ editMode, label, onPress }) {
  return (
    <ButtonPressAnimation disabled={editMode} onPress={onPress} scaleTo={0.98}>
      <View style={sx.optionContainer}>
        <Text style={[sx.optionText, editMode ? sx.optionTextDisabled : null]}>
          {label}
        </Text>
      </View>
    </ButtonPressAnimation>
  );
}

AddressOption.propTypes = {
  label: PropTypes.string,
  onPress: PropTypes.func,
};

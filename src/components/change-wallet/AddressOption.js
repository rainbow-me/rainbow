import PropTypes from 'prop-types';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../styles';
import { getFontSize } from '../../styles/fonts';
import { ButtonPressAnimation } from '../animations';

const sx = StyleSheet.create({
  borderBottom: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lightestGrey,
  },
  optionContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingBottom: 19,
    paddingTop: 12,
  },
  optionText: {
    color: colors.appleBlue,
    fontFamily: fonts.family.SFProRounded,
    fontSize: getFontSize(fonts.size.lmedium),
    fontWeight: fonts.weight.semibold,
    letterSpacing: fonts.letterSpacing.roundedMedium,
  },
  optionTextDisabled: {
    color: colors.lightGrey,
  },
  wrapper: {
    marginLeft: 20,
  },
});

export default function AddressOption({
  borderBottom,
  editMode,
  label,
  onPress,
}) {
  return (
    <View style={sx.wrapper}>
      <View style={[sx.subItem, borderBottom ? sx.borderBottom : null]}>
        <ButtonPressAnimation scaleTo={0.96} onPress={onPress}>
          <View style={sx.optionContainer}>
            <View>
              <Text
                style={[sx.optionText, editMode ? sx.optionTextDisabled : null]}
              >
                {label}
              </Text>
            </View>
          </View>
        </ButtonPressAnimation>
      </View>
    </View>
  );
}

AddressOption.propTypes = {
  label: PropTypes.string,
  onPress: PropTypes.func,
};

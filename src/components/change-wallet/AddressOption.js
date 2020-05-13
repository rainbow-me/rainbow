import PropTypes from 'prop-types';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../styles';
import { getFontSize } from '../../styles/fonts';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';

const sx = StyleSheet.create({
  borderBottom: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lightestGrey,
  },
  optionContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingBottom: 17,
    paddingTop: 12,
  },
  optionIconWrapper: {
    alignItems: 'center',
    backgroundColor: colors.appleBlue,
    borderRadius: 18,
    height: 18,
    justifyContent: 'center',
    marginLeft: 2,
    marginRight: 9,
    width: 18,
  },
  optionIconWrapperDisabled: {
    backgroundColor: colors.lightGrey,
  },
  optionText: {
    color: colors.appleBlue,
    fontSize: getFontSize(fonts.size.lmedium),
    fontWeight: fonts.weight.semibold,
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
  icon,
  label,
  onPress,
}) {
  return (
    <View style={sx.wrapper}>
      <View style={[sx.subItem, borderBottom ? sx.borderBottom : null]}>
        <ButtonPressAnimation scaleTo={0.96} onPress={onPress}>
          <View style={sx.optionContainer}>
            <View
              style={[
                sx.optionIconWrapper,
                editMode ? sx.optionIconWrapperDisabled : null,
              ]}
            >
              <Icon color={colors.white} height={12} width={12} name={icon} />
            </View>
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
  icon: PropTypes.string,
  label: PropTypes.string,
  onPress: PropTypes.func,
};

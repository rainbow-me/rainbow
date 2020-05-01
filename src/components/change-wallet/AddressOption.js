import PropTypes from 'prop-types';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';

const sx = StyleSheet.create({
  optionContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 7.5,
    paddingVertical: 0,
  },
  optionIconWrapper: {
    alignItems: 'center',
    backgroundColor: colors.skeleton,
    borderRadius: 14,
    height: 22,
    justifyContent: 'center',
    marginLeft: 11,
    marginRight: 17,
    width: 22,
  },
  optionText: {
    color: colors.darkGrey,
    fontFamily: fonts.family.SFProText,
    fontSize: Number(fonts.size.small.replace('px', '')),
    fontWeight: fonts.weight.smedium,
  },
});

export default function AddressOption({ icon, label, onPress }) {
  return (
    <View style={sx.subItem}>
      <ButtonPressAnimation scaleTo={0.96} onPress={onPress}>
        <View style={sx.optionContainer}>
          <View style={sx.optionIconWrapper}>
            <Icon
              color={colors.blueGreyDark50}
              height={15}
              width={15}
              name={icon}
            />
          </View>
          <View>
            <Text style={sx.optionText}>{label}</Text>
          </View>
        </View>
      </ButtonPressAnimation>
    </View>
  );
}

AddressOption.propTypes = {
  icon: PropTypes.string,
  label: PropTypes.string,
  onPress: PropTypes.func,
};

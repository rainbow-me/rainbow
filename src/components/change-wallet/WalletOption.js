import PropTypes from 'prop-types';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../styles';
import { getFontSize } from '../../styles/fonts';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';

const sx = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderColor: colors.lightestGrey,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    marginLeft: 20,
    paddingVertical: 25,
  },
  iconWrapper: {
    alignItems: 'center',
    backgroundColor: colors.appleBlue,
    borderRadius: 18,
    height: 18,
    justifyContent: 'center',
    marginLeft: 2,
    marginRight: 9,
    width: 18,
  },
  iconWrapperDisabled: {
    backgroundColor: colors.lightGrey,
  },
  text: {
    color: colors.appleBlue,
    fontFamily: fonts.family.SFProText,
    fontSize: getFontSize(fonts.size.lmedium),
    fontWeight: fonts.weight.semibold,
  },
  textDisabled: {
    color: colors.lightGrey,
  },
});

const WalletOption = ({ editMode, icon, label, onPress }) => (
  <ButtonPressAnimation disabled={editMode} scaleTo={0.96} onPress={onPress}>
    <View style={sx.container}>
      <View style={[sx.iconWrapper, editMode ? sx.iconWrapperDisabled : null]}>
        <Icon color={colors.white} height={11} width={11} name={icon} />
      </View>
      <View>
        <Text style={[sx.text, editMode ? sx.textDisabled : null]}>
          {label}
        </Text>
      </View>
    </View>
  </ButtonPressAnimation>
);

WalletOption.propTypes = {
  icon: PropTypes.string,
  label: PropTypes.string.isRequired,
  onPress: PropTypes.func,
};

export default WalletOption;

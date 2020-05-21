import { isEmpty } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Caret from '../../assets/family-dropdown-arrow.png';
import { useAccountSettings, useWallets } from '../../hooks';
import { colors, fonts } from '../../styles';
import { getFirstGrapheme } from '../../utils';
import { ButtonPressAnimation } from '../animations';

const sx = StyleSheet.create({
  arrowWrapper: {
    alignItems: 'center',
    height: 16,
    justifyContent: 'center',
    paddingLeft: 10,
    paddingRight: 20,
    paddingTop: 2,
    width: 12,
  },
  avatarCircle: {
    borderRadius: 20,
    height: 32,
    marginLeft: 8,
    marginRight: 9,
    width: 32,
  },
  container: {
    alignItems: 'center',
    backgroundColor: colors.skeleton,
    borderRadius: 23,
    flexDirection: 'row',
    height: 46,
    marginLeft: 6,
  },
  firstLetter: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 31,
    paddingLeft: 0.5,
    textAlign: 'center',
    width: '100%',
  },
  nickname: {
    color: colors.dark,
    fontFamily: fonts.family.SFProText,
    fontSize: Number(fonts.size.smedium.replace('px', '')),
    fontWeight: fonts.weight.medium,
    maxWidth: 120,
  },
  settingsIcon: {
    height: 12,
    transform: [{ rotate: '90deg' }],
    width: 6,
  },
  topRow: {
    flexDirection: 'row',
  },
});

const HeaderWalletInfo = ({ onPress }) => {
  const { selectedWallet } = useWallets();
  const { accountAddress } = useAccountSettings();

  if (isEmpty(selectedWallet) || !selectedWallet.addresses.length) return null;

  const selectedAccount = selectedWallet.addresses.find(
    account => account.address === accountAddress
  );

  if (!selectedAccount) return null;

  const { label, color } = selectedAccount;

  const accountName = label || `Account ${selectedAccount.index + 1}`;
  const accountColor = color;

  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.9}>
      <View style={sx.container}>
        <View
          style={[
            sx.avatarCircle,
            { backgroundColor: colors.avatarColor[accountColor] },
          ]}
        >
          <Text style={sx.firstLetter}>{getFirstGrapheme(accountName)}</Text>
        </View>
        <View>
          <View style={sx.topRow}>
            <Text style={sx.nickname} numberOfLines={1}>
              {accountName}
            </Text>
            <View style={sx.arrowWrapper}>
              <FastImage style={sx.settingsIcon} source={Caret} />
            </View>
          </View>
        </View>
      </View>
    </ButtonPressAnimation>
  );
};

HeaderWalletInfo.propTypes = {
  onPress: PropTypes.func.isRequired,
};

export default HeaderWalletInfo;

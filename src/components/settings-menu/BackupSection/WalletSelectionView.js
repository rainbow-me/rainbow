import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import styled from 'styled-components';
import Caret from '../../../assets/family-dropdown-arrow.png';
import { useWallets } from '../../../hooks';
import { colors, fonts } from '../../../styles';
import { getFontSize } from '../../../styles/fonts';
import { abbreviations } from '../../../utils';
import { ButtonPressAnimation } from '../../animations';
import { BottomRowText } from '../../coin-row';
import { ContactAvatar } from '../../contacts';
import { Icon } from '../../icons';
import { Column, Row } from '../../layout';
import { TruncatedAddress } from '../../text';
import NeedsBackupView from './NeedsBackupView';

const IconWrapper = styled(View)`
  margin-bottom: 12;
  height: 22;
  position: absolute;
  right: 20;
  top: 12;
  width: 22;
`;

const WarningIcon = () => (
  <IconWrapper>
    <Icon color={colors.yellowOrange} name="warningCircled" size={40} />
  </IconWrapper>
);
const ChecmarkIcon = ({ color }) => (
  <IconWrapper>
    <Icon color={color} name="checkmarkCircled" size={22} />
  </IconWrapper>
);

const sx = StyleSheet.create({
  accountLabel: {
    color: colors.dark,
    fontFamily: fonts.family.SFProText,
    fontSize: getFontSize(fonts.size.lmedium),
    fontWeight: fonts.weight.medium,
    paddingBottom: 5,
  },
  accountRow: {
    justifyContent: 'center',
    marginLeft: 15,
    marginTop: 22,
  },
  leftContent: {
    flex: 1,
    flexDirection: 'row',
  },
  rightContent: {
    flex: 0,
    marginRight: 19,
  },
});

const WalletSelectionView = ({ navigation }) => {
  const { wallets } = useWallets();
  const onPress = useCallback(
    (wallet_id, name) => {
      navigation.setParams({
        section: {
          component: NeedsBackupView,
          title: name,
        },
        wallet_id,
      });
    },
    [navigation]
  );

  return Object.keys(wallets).map(key => {
    const wallet = wallets[key];
    const visibleAccounts = wallet.addresses.filter(a => a.visible);
    const account = visibleAccounts[0];
    const totalAccounts = visibleAccounts.length;
    const { color, label, index, address } = account;

    return (
      <View style={sx.accountRow} key={key}>
        <ButtonPressAnimation
          onPress={() =>
            onPress(key, label || abbreviations.address(address, 4, 6))
          }
          scaleTo={0.98}
        >
          <Row>
            <Column style={sx.leftContent}>
              <ContactAvatar
                color={color}
                marginRight={10}
                size="medium"
                value={label || `${index + 1}`}
              />
              <View>
                <View>
                  {label ? (
                    <Text style={sx.accountLabel}>{label}</Text>
                  ) : (
                    <TruncatedAddress
                      firstSectionLength={6}
                      size="smaller"
                      truncationLength={4}
                      weight="medium"
                      address={address}
                      style={sx.accountLabel}
                    />
                  )}
                </View>
                {totalAccounts && (
                  <BottomRowText>
                    And {totalAccounts} more wallets
                  </BottomRowText>
                )}
              </View>
            </Column>
            <Column style={sx.rightContent}>
              {wallet.isBackedUp ? (
                wallet.backupType === 'cloud' ? (
                  <ChecmarkIcon color={colors.green} />
                ) : (
                  <ChecmarkIcon color={colors.grey} />
                )
              ) : (
                <WarningIcon />
              )}

              <FastImage
                source={Caret}
                style={{
                  height: 17,
                  marginTop: 15,
                  width: 9,
                }}
                tintColor={colors.blueGreyDark}
              />
            </Column>
          </Row>
        </ButtonPressAnimation>
      </View>
    );
  });
};

export default WalletSelectionView;

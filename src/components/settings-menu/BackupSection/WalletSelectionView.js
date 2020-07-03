import { useNavigation } from '@react-navigation/core';
import React, { useCallback } from 'react';
import { View } from 'react-native';
import FastImage from 'react-native-fast-image';
import styled from 'styled-components';
import Caret from '../../../assets/family-dropdown-arrow.png';
import WalletBackupTypes from '../../../helpers/walletBackupTypes';
import WalletTypes from '../../../helpers/walletTypes';
import { useWallets } from '../../../hooks';
import { colors, fonts } from '../../../styles';
import { abbreviations } from '../../../utils';
import Divider from '../../Divider';
import { ButtonPressAnimation } from '../../animations';
import { BottomRowText } from '../../coin-row';
import { ContactAvatar } from '../../contacts';
import { Icon } from '../../icons';
import { Column, ColumnWithMargins, Row } from '../../layout';
import { Text, TruncatedAddress } from '../../text';

const IconWrapper = styled(View)`
  margin-bottom: 12;
  height: 22;
  position: absolute;
  right: 20;
  top: 12;
  width: 24;
`;

const CaretIcon = styled(FastImage).attrs({
  source: Caret,
  tintColor: colors.alpha(colors.blueGreyDark, 0.6),
})`
  height: 17;
  margin-top: 15;
  width: 9;
`;

const Address = styled(TruncatedAddress).attrs({
  color: colors.dark,
  firstSectionLength: 6,
  size: fonts.size.lmedium,
  truncationLength: 4,
  weight: 'regular',
})``;

const AccountLabel = styled(Text).attrs({
  color: colors.dark,
  size: fonts.size.lmedium,
  weight: 'regular',
})``;

const WarningIconText = styled(Text).attrs({
  color: colors.orangeLight,
  size: 22,
})`
  box-shadow: 0px 4px 12px rgba(254, 190, 68, 0.4);
`;

const WarningIcon = () => (
  <IconWrapper>
    <WarningIconText>􀇿</WarningIconText>
  </IconWrapper>
);

const CheckmarkIcon = ({ color }) => (
  <IconWrapper>
    <Icon color={color} name="checkmarkCircled" size={22} />
  </IconWrapper>
);

const WalletSelectionView = () => {
  const { navigate } = useNavigation();
  const { walletNames, wallets } = useWallets();
  const onPress = useCallback(
    (wallet_id, name) => {
      const wallet = wallets[wallet_id];
      if (wallet.backedUp || wallet.imported) {
        navigate('SettingsBackupView', {
          imported: wallet.imported,
          title: name,
          type: 'AlreadyBackedUpView',
          wallet_id,
        });
      } else {
        navigate('SettingsBackupView', {
          title: name,
          type: 'NeedsBackupView',
          wallet_id,
        });
      }
    },
    [navigate, wallets]
  );

  return Object.keys(wallets)
    .filter(key => wallets[key].type !== WalletTypes.readOnly)
    .map(key => {
      const wallet = wallets[key];
      const visibleAccounts = wallet.addresses.filter(a => a.visible);
      const account = visibleAccounts[0];
      const totalAccounts = visibleAccounts.length;
      const { color, label, index, address } = account;
      let labelOrName = label;
      if (!label) {
        if (walletNames[address]) {
          labelOrName = walletNames[address];
        }
      }

      console.log(walletNames);

      return (
        <Column key={key}>
          <ButtonPressAnimation
            onPress={() =>
              onPress(key, label || abbreviations.address(address, 4, 6))
            }
            scaleTo={0.98}
          >
            <Row height={56}>
              <Row alignSelf="center" flex={1} marginLeft={15}>
                <ContactAvatar
                  alignSelf="center"
                  color={color}
                  marginRight={10}
                  size="smedium"
                  value={labelOrName || `${index + 1}`}
                />
                <ColumnWithMargins margin={3} marginBottom={0.5}>
                  <Row>
                    {labelOrName ? (
                      <AccountLabel>{labelOrName}</AccountLabel>
                    ) : (
                      <Address address={address} />
                    )}
                  </Row>
                  {totalAccounts > 1 ? (
                    <BottomRowText weight={fonts.weight.medium}>
                      And {totalAccounts - 1} more wallets
                    </BottomRowText>
                  ) : wallet.backedUp ? (
                    wallet.backupType === WalletBackupTypes.cloud ? (
                      <BottomRowText weight={fonts.weight.medium}>
                        Backed up
                      </BottomRowText>
                    ) : (
                      <BottomRowText weight={fonts.weight.medium}>
                        Backed up manually
                      </BottomRowText>
                    )
                  ) : wallet.imported ? (
                    <BottomRowText weight={fonts.weight.medium}>
                      Imported
                    </BottomRowText>
                  ) : (
                    <BottomRowText
                      color={colors.orangeLight}
                      weight={fonts.weight.medium}
                    >
                      Not backed up
                    </BottomRowText>
                  )}
                </ColumnWithMargins>
              </Row>
              <Row alignSelf="center" height={47} marginRight={18}>
                {wallet.backedUp ? (
                  wallet.backupType === WalletBackupTypes.cloud ? (
                    <CheckmarkIcon color={colors.green} />
                  ) : (
                    <CheckmarkIcon color={colors.grey} />
                  )
                ) : wallet.imported ? (
                  <CheckmarkIcon color={colors.grey} />
                ) : (
                  <WarningIcon />
                )}

                <CaretIcon />
              </Row>
            </Row>
          </ButtonPressAnimation>
          <Divider
            color={colors.alpha(colors.blueGreyDark, 0.01)}
            inset={[0, 15, 0]}
          />
        </Column>
      );
    });
};

export default WalletSelectionView;

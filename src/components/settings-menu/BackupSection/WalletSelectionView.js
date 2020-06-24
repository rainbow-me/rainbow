import React, { useCallback } from 'react';
import { View } from 'react-native';
import FastImage from 'react-native-fast-image';
import styled from 'styled-components';
import Caret from '../../../assets/family-dropdown-arrow.png';
import WalletBackupTypes from '../../../helpers/walletBackupTypes';
import WalletTypes from '../../../helpers/walletTypes';
import { useWallets } from '../../../hooks';
import { colors, fonts } from '../../../styles';
import { getFontSize } from '../../../styles/fonts';
import { abbreviations } from '../../../utils';
import { ButtonPressAnimation } from '../../animations';
import { BottomRowText } from '../../coin-row';
import { ContactAvatar } from '../../contacts';
import { Icon } from '../../icons';
import { Column, Row } from '../../layout';
import { Text, TruncatedAddress } from '../../text';
// eslint-disable-next-line import/no-cycle
import BackupSection from '.';

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
  tintColor: colors.blueGreyDark,
})`
  height: 17;
  margin-top: 15;
  width: 9;
`;

const Address = styled(TruncatedAddress).attrs({
  color: colors.dark,
  firstSectionLength: 6,
  size: getFontSize(fonts.size.lmedium),
  truncationLength: 4,
  weight: 'medium',
})`
  padding-bottom: 5;
`;

const AccountLabel = styled(Text).attrs({
  color: colors.dark,
  weight: 'normal',
})`
  font-size: ${fonts.size.lmedium};
  padding-bottom: 5;
`;

const WarningIconText = styled(Text).attrs({
  color: colors.yellowOrange,
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

const WalletSelectionView = ({ navigation }) => {
  const { wallets } = useWallets();
  const onPress = useCallback(
    (wallet_id, name) => {
      const wallet = wallets[wallet_id];
      if (wallet.backedUp || wallet.imported) {
        navigation.setParams({
          section: {
            component: BackupSection,
            imported: wallet.imported,
            title: name,
          },
          wallet_id,
        });
      } else {
        navigation.setParams({
          section: {
            component: BackupSection,
            title: name,
          },
          wallet_id,
        });
      }
    },
    [navigation, wallets]
  );

  return Object.keys(wallets)
    .filter(key => wallets[key].type !== WalletTypes.readOnly)
    .map(key => {
      const wallet = wallets[key];
      const visibleAccounts = wallet.addresses.filter(a => a.visible);
      const account = visibleAccounts[0];
      const totalAccounts = visibleAccounts.length;
      const { color, label, index, address } = account;

      return (
        <Column
          marginLeft={15}
          marginTop={22}
          key={key}
          justifyContent="center"
        >
          <ButtonPressAnimation
            onPress={() =>
              onPress(key, label || abbreviations.address(address, 4, 6))
            }
            scaleTo={0.98}
          >
            <Row>
              <Row flex={1}>
                <ContactAvatar
                  color={color}
                  marginRight={10}
                  size="medium"
                  value={label || `${index + 1}`}
                />
                <Column>
                  <Row>
                    {label ? (
                      <AccountLabel>{label}</AccountLabel>
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
                      <BottomRowText
                        color={colors.green}
                        weight={fonts.weight.medium}
                      >
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
                      color={colors.yellowOrange}
                      weight={fonts.weight.medium}
                    >
                      Not Backed up
                    </BottomRowText>
                  )}
                </Column>
              </Row>
              <Row marginRight={19}>
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
        </Column>
      );
    });
};

export default WalletSelectionView;

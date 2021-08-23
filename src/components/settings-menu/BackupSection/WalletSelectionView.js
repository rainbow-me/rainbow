import React, { useCallback } from 'react';
import { ScrollView } from 'react-native';
import styled from 'styled-components';
import { useTheme } from '../../../context/ThemeContext';
import { cloudPlatform } from '../../../utils/platform';
import Divider from '../../Divider';
import { ButtonPressAnimation } from '../../animations';
import { BottomRowText } from '../../coin-row';
import { ContactAvatar } from '../../contacts';
import { Icon } from '../../icons';
import { Centered, Column, ColumnWithMargins, Row } from '../../layout';
import { Text, TruncatedAddress } from '../../text';
import Caret from '@rainbow-me/assets/family-dropdown-arrow.png';
import WalletBackupTypes from '@rainbow-me/helpers/walletBackupTypes';
import WalletTypes from '@rainbow-me/helpers/walletTypes';
import { useManageCloudBackups, useWallets } from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import { useNavigation } from '@rainbow-me/navigation';
import { fonts, padding } from '@rainbow-me/styles';
import { abbreviations } from '@rainbow-me/utils';

const CaretIcon = styled(ImgixImage).attrs(({ theme: { colors } }) => ({
  source: Caret,
  tintColor: colors.alpha(colors.blueGreyDark, 0.6),
}))`
  height: 18;
  margin-top: 15;
  width: 8;
`;

const Address = styled(TruncatedAddress).attrs(({ theme: { colors } }) => ({
  color: colors.dark,
  firstSectionLength: 6,
  size: fonts.size.lmedium,
  truncationLength: 4,
  weight: 'regular',
}))``;

const AccountLabel = styled(Text).attrs(({ theme: { colors } }) => ({
  color: colors.dark,
  size: fonts.size.lmedium,
  weight: 'regular',
}))``;

const CheckmarkIcon = styled(Icon).attrs({
  name: 'checkmarkCircled',
})`
  align-self: center;
  margin-bottom: 1px;
  margin-right: 7px;
`;

const GreenCheck = styled(CheckmarkIcon).attrs(({ theme: { colors } }) => ({
  color: colors.green,
}))`
  box-shadow: 0px 4px 6px
    ${({ theme: { colors, isDarkMode } }) =>
      colors.alpha(isDarkMode ? colors.shadow : colors.green, 0.4)};
`;

const GreyCheck = styled(CheckmarkIcon).attrs(({ theme: { colors } }) => ({
  color: colors.blueGreyDark50,
}))`
  box-shadow: 0px 4px 6px
    ${({ theme: { colors, isDarkMode } }) =>
      colors.alpha(isDarkMode ? colors.shadow : colors.blueGreyDark50, 0.4)};
`;

const WarningIcon = styled(Icon).attrs(({ theme: { colors } }) => ({
  color: colors.orangeLight,
  name: 'warning',
}))`
  align-self: center;
  box-shadow: 0px 4px 6px
    ${({ theme: { colors, isDarkMode } }) =>
      colors.alpha(isDarkMode ? colors.shadow : colors.orangeLight, 0.4)};
  margin-right: 7px;
`;

const Footer = styled(Centered)`
  flex: 1;
  align-items: flex-end;
  ${padding(19, 15, 30)};
`;

const WalletSelectionView = () => {
  const { navigate } = useNavigation();
  const { colors, isDarkMode } = useTheme();
  const { walletNames, wallets } = useWallets();
  const { manageCloudBackups } = useManageCloudBackups();
  const onPress = useCallback(
    (walletId, name) => {
      const wallet = wallets[walletId];
      if (wallet.backedUp || wallet.imported) {
        navigate('SettingsBackupView', {
          imported: wallet.imported,
          title: name,
          type: 'AlreadyBackedUpView',
          walletId,
        });
      } else {
        navigate('SettingsBackupView', {
          title: name,
          type: 'NeedsBackupView',
          walletId,
        });
      }
    },
    [navigate, wallets]
  );

  let cloudBackedUpWallets = 0;

  return (
    <ScrollView>
      {Object.keys(wallets)
        .filter(key => wallets[key].type !== WalletTypes.readOnly)
        .map(key => {
          const wallet = wallets[key];
          const visibleAccounts = wallet.addresses.filter(a => a.visible);
          const account = visibleAccounts[0];
          const totalAccounts = visibleAccounts.length;
          const { color, label, index, address } = account;
          if (wallet.backupType === WalletBackupTypes.cloud) {
            cloudBackedUpWallets += 1;
          }
          let labelOrName = label;
          if (!label) {
            if (walletNames[address]) {
              labelOrName = walletNames[address];
            }
          }

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
                          And {totalAccounts - 1} more{' '}
                          {totalAccounts > 2 ? `wallets` : `wallet`}
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
                        <GreenCheck isDarkMode={isDarkMode} />
                      ) : (
                        <GreyCheck isDarkMode={isDarkMode} />
                      )
                    ) : wallet.imported ? (
                      <GreyCheck />
                    ) : (
                      <WarningIcon />
                    )}

                    <CaretIcon />
                  </Row>
                </Row>
              </ButtonPressAnimation>
              <Divider color={colors.rowDividerFaint} inset={[0, 15, 0]} />
            </Column>
          );
        })}
      {cloudBackedUpWallets > 0 && (
        <Footer>
          <ButtonPressAnimation onPress={manageCloudBackups}>
            <Text
              align="center"
              color={colors.alpha(colors.blueGreyDark, 0.6)}
              letterSpacing="roundedMedium"
              size="lmedium"
              weight="semibold"
            >
              􀍢 Manage {cloudPlatform} Backups
            </Text>
          </ButtonPressAnimation>
        </Footer>
      )}
    </ScrollView>
  );
};

export default WalletSelectionView;

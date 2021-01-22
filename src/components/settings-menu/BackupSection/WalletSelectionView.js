import React, { Fragment, useCallback } from 'react';
import { Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import { useTheme } from '../../../context/ThemeContext';
import { deleteAllBackups } from '../../../handlers/cloudBackup';
import { walletsUpdate } from '../../../redux/wallets';
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
import { useWallets } from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import { useNavigation } from '@rainbow-me/navigation';
import { colors_NOT_REACTIVE, fonts, padding } from '@rainbow-me/styles';
import { abbreviations, showActionSheetWithOptions } from '@rainbow-me/utils';

const CaretIcon = styled(ImgixImage).attrs({
  source: Caret,
  tintColor: colors_NOT_REACTIVE.alpha(colors_NOT_REACTIVE.blueGreyDark, 0.6),
})`
  height: 18;
  margin-top: 15;
  width: 8;
`;

const Address = styled(TruncatedAddress).attrs({
  color: colors_NOT_REACTIVE.dark,
  firstSectionLength: 6,
  size: fonts.size.lmedium,
  truncationLength: 4,
  weight: 'regular',
})``;

const AccountLabel = styled(Text).attrs({
  color: colors_NOT_REACTIVE.dark,
  size: fonts.size.lmedium,
  weight: 'regular',
})``;

const CheckmarkIcon = styled(Icon).attrs({
  name: 'checkmarkCircled',
})`
  align-self: center;
  margin-bottom: 1px;
  margin-right: 7px;
`;

const GreenCheck = styled(CheckmarkIcon).attrs({
  color: colors_NOT_REACTIVE.green,
})`
  box-shadow: 0px 4px 6px
    ${({ isDarkMode }) =>
      colors_NOT_REACTIVE.alpha(
        isDarkMode ? colors_NOT_REACTIVE.shadow : colors_NOT_REACTIVE.green,
        0.4
      )};
`;

const GreyCheck = styled(CheckmarkIcon).attrs({
  color: colors_NOT_REACTIVE.blueGreyDark50,
})`
  box-shadow: 0px 4px 6px
    ${({ isDarkMode }) =>
      colors_NOT_REACTIVE.alpha(
        isDarkMode
          ? colors_NOT_REACTIVE.shadow
          : colors_NOT_REACTIVE.blueGreyDark50,
        0.4
      )};
`;

const WarningIcon = styled(Icon).attrs({
  color: colors_NOT_REACTIVE.orangeLight,
  name: 'warning',
})`
  align-self: center;
  box-shadow: 0px 4px 6px
    ${({ theme: { colors } }) =>
      colors.alpha(colors_NOT_REACTIVE.orangeLight, 0.4)};
  margin-right: 7px;
`;

const Footer = styled(Centered)`
  flex: 1;
  align-items: flex-end;
  ${padding(0, 15, 42)};
`;

const WalletSelectionView = () => {
  const { navigate } = useNavigation();
  const { isDarkMode } = useTheme();
  const dispatch = useDispatch();
  const { walletNames, wallets } = useWallets();
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

  const manageCloudBackups = useCallback(() => {
    const buttons = [`Delete All ${cloudPlatform} Backups`, 'Cancel'];

    showActionSheetWithOptions(
      {
        cancelButtonIndex: 1,
        destructiveButtonIndex: 0,
        options: buttons,
        title: `Manage ${cloudPlatform} Backups`,
      },
      buttonIndex => {
        if (buttonIndex === 0) {
          // Delete wallet with confirmation
          showActionSheetWithOptions(
            {
              cancelButtonIndex: 1,
              destructiveButtonIndex: 0,
              message: `Are you sure you want to delete your ${cloudPlatform} wallet backups?`,
              options: [`Confirm and Delete Backups`, 'Cancel'],
            },
            async buttonIndex => {
              if (buttonIndex === 0) {
                const newWallets = { ...wallets };
                Object.keys(newWallets).forEach(key => {
                  newWallets[key].backedUp = undefined;
                  newWallets[key].backupDate = undefined;
                  newWallets[key].backupFile = undefined;
                  newWallets[key].backupType = undefined;
                });

                await dispatch(walletsUpdate(newWallets));

                // Delete all backups (debugging)
                await deleteAllBackups();

                Alert.alert('Backups Deleted Succesfully');
              }
            }
          );
        }
      }
    );
  }, [dispatch, wallets]);

  let cloudBackedUpWallets = 0;

  return (
    <Fragment>
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
                          color={colors_NOT_REACTIVE.orangeLight}
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
              <Divider
                color={colors_NOT_REACTIVE.rowDividerFaint}
                inset={[0, 15, 0]}
              />
            </Column>
          );
        })}
      {cloudBackedUpWallets > 0 && (
        <Footer>
          <ButtonPressAnimation onPress={manageCloudBackups}>
            <Text
              align="center"
              color={colors_NOT_REACTIVE.alpha(
                colors_NOT_REACTIVE.blueGreyDark,
                0.6
              )}
              letterSpacing="roundedMedium"
              size="lmedium"
              weight="semibold"
            >
              􀍢 Manage {cloudPlatform} Backups
            </Text>
          </ButtonPressAnimation>
        </Footer>
      )}
    </Fragment>
  );
};

export default WalletSelectionView;

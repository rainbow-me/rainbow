import { useRoute } from '@react-navigation/native';
import analytics from '@segment/analytics-react-native';
import React, { Fragment, useCallback, useEffect, useMemo } from 'react';
import { Alert, View } from 'react-native';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import { deleteAllBackups } from '../../../handlers/cloudBackup';
import { walletsUpdate } from '../../../redux/wallets';
import { cloudPlatform } from '../../../utils/platform';
import { DelayedAlert } from '../../alerts';
import { ButtonPressAnimation } from '../../animations';
import { Centered, Column } from '../../layout';
import { SheetActionButton } from '../../sheet';
import { Text } from '../../text';
import WalletBackupStepTypes from '@rainbow-me/helpers/walletBackupStepTypes';
import WalletBackupTypes from '@rainbow-me/helpers/walletBackupTypes';
import WalletTypes from '@rainbow-me/helpers/walletTypes';
import { useWalletCloudBackup, useWallets } from '@rainbow-me/hooks';
import { Navigation, useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { colors, fonts, padding, position, shadow } from '@rainbow-me/styles';
import { showActionSheetWithOptions } from '@rainbow-me/utils';

const WalletBackupStatus = {
  CLOUD_BACKUP: 0,
  IMPORTED: 1,
  MANUAL_BACKUP: 2,
};

const CheckmarkIconContainer = styled(View)`
  ${({ color }) => shadow.build(0, 4, 6, color, 0.4)};
  ${position.size(50)};
  background-color: ${({ color }) => color};
  border-radius: 25;
  margin-bottom: 19;
  padding-top: ${ios ? 13 : 7};
`;

const CheckmarkIconText = styled(Text).attrs({
  align: 'center',
  color: colors.white,
  size: 'larger',
  weight: 'bold',
})``;

const CheckmarkIcon = ({ color }) => (
  <CheckmarkIconContainer color={color}>
    <CheckmarkIconText>􀆅</CheckmarkIconText>
  </CheckmarkIconContainer>
);

const Content = styled(Centered).attrs({
  direction: 'column',
})`
  ${padding(0, 19, 30)};
  flex: 1;
`;

const DescriptionText = styled(Text).attrs({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.5),
  lineHeight: 'loosest',
  size: 'large',
})`
  margin-bottom: 42;
  padding-horizontal: 23;
`;

const Footer = styled(Centered)`
  ${padding(0, 15, 42)};
`;

const Subtitle = styled(Text).attrs({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.5),
  size: fonts.size.smedium,
  weight: fonts.weight.medium,
})`
  margin-top: -10;
`;

const Title = styled(Text).attrs({
  align: 'center',
  size: 'larger',
  weight: 'bold',
})`
  margin-bottom: 8;
  padding-horizontal: 11;
`;

const onError = error => DelayedAlert({ title: error }, 500);

export default function AlreadyBackedUpView() {
  const { navigate } = useNavigation();
  const { params } = useRoute();
  const dispatch = useDispatch();
  const { wallets, selectedWallet } = useWallets();
  const walletCloudBackup = useWalletCloudBackup();
  const walletId = params?.walletId || selectedWallet.id;

  useEffect(() => {
    analytics.track('Already Backed Up View', {
      category: 'settings backup',
    });
  }, []);

  const walletStatus = useMemo(() => {
    let status = null;
    if (wallets[walletId].backedUp) {
      if (wallets[walletId].backupType === WalletBackupTypes.manual) {
        status = WalletBackupStatus.MANUAL_BACKUP;
      } else {
        status = WalletBackupStatus.CLOUD_BACKUP;
      }
    } else {
      status = WalletBackupStatus.IMPORTED;
    }
    return status;
  }, [walletId, wallets]);

  const handleNoLatestBackup = useCallback(() => {
    Navigation.handleAction(
      android ? Routes.BACKUP_SCREEN : Routes.BACKUP_SHEET,
      {
        nativeScreen: android,
        step: WalletBackupStepTypes.cloud,
        walletId,
      }
    );
  }, [walletId]);

  const handlePasswordNotFound = useCallback(() => {
    Navigation.handleAction(
      android ? Routes.BACKUP_SCREEN : Routes.BACKUP_SHEET,
      {
        missingPassword: true,
        nativeScreen: android,
        step: WalletBackupStepTypes.cloud,
        walletId,
      }
    );
  }, [walletId]);

  const manageCloudBackups = useCallback(() => {
    const buttons = [`Delete all ${cloudPlatform} backups`, 'Cancel'];

    showActionSheetWithOptions(
      {
        cancelButtonIndex: 1,
        destructiveButtonIndex: 0,
        options: buttons,
        title: `Manage ${cloudPlatform} backups`,
      },
      buttonIndex => {
        if (buttonIndex === 0) {
          // Delete wallet with confirmation
          showActionSheetWithOptions(
            {
              cancelButtonIndex: 1,
              destructiveButtonIndex: 0,
              message: `Are you sure you want to delete all ${cloudPlatform} Backups`,
              options: [`YES, Delete All ${cloudPlatform} Backups`, 'Cancel'],
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

                Alert.alert('Backups deleted succesfully');
              }
            }
          );
        }
      }
    );
  }, [dispatch, wallets]);

  const handleIcloudBackup = useCallback(() => {
    if (
      ![WalletBackupStatus.MANUAL_BACKUP, WalletBackupStatus.IMPORTED].includes(
        walletStatus
      )
    ) {
      return;
    }

    analytics.track(`Back up to ${cloudPlatform} pressed`, {
      category: 'settings backup',
    });

    walletCloudBackup({
      handleNoLatestBackup,
      handlePasswordNotFound,
      onError,
      walletId,
    });
  }, [
    handleNoLatestBackup,
    handlePasswordNotFound,
    walletCloudBackup,
    walletId,
    walletStatus,
  ]);

  const handleViewRecoveryPhrase = useCallback(() => {
    navigate('ShowSecretView', {
      title: `Recovery ${
        WalletTypes.mnemonic === wallets[walletId].type ? 'Phrase' : 'Key'
      }`,
      walletId,
    });
  }, [navigate, walletId, wallets]);

  const checkmarkColor =
    walletStatus === WalletBackupStatus.CLOUD_BACKUP
      ? colors.green
      : colors.blueGreyDark50;

  const hasMultipleWallets =
    Object.keys(wallets).filter(
      key => wallets[key].type !== WalletTypes.readOnly
    ).length > 1;

  return (
    <Fragment>
      <Subtitle>
        {(walletStatus === WalletBackupStatus.CLOUD_BACKUP && `Backed up`) ||
          (walletStatus === WalletBackupStatus.MANUAL_BACKUP &&
            `Backed up manually`) ||
          (walletStatus === WalletBackupStatus.IMPORTED && `Imported`)}
      </Subtitle>
      <Content>
        <Centered direction="column">
          <CheckmarkIcon color={checkmarkColor} />
          <Title>
            {(walletStatus === WalletBackupStatus.IMPORTED &&
              `Your wallet was imported`) ||
              `Your wallet is backed up`}
          </Title>
          <DescriptionText>
            {(walletStatus === WalletBackupStatus.CLOUD_BACKUP &&
              `If you lose this device, you can recover your encrypted wallet backup from ${cloudPlatform}.`) ||
              (walletStatus === WalletBackupStatus.MANUAL_BACKUP &&
                `If you lose this device, you can restore your wallet with the recovery phrase you saved.`) ||
              (walletStatus === WalletBackupStatus.IMPORTED &&
                `If you lose this device, you can restore your wallet with the key you originally imported.`)}
          </DescriptionText>
        </Centered>
        <Column>
          <SheetActionButton
            color={ios ? colors.white : colors.lightestGrey}
            label="🗝 View recovery key"
            noFlex
            onPress={handleViewRecoveryPhrase}
            textColor={colors.alpha(colors.blueGreyDark, 0.8)}
          />
        </Column>
      </Content>
      {walletStatus !== WalletBackupStatus.CLOUD_BACKUP ? (
        <Footer>
          <ButtonPressAnimation onPress={handleIcloudBackup}>
            <Text
              align="center"
              color={colors.appleBlue}
              letterSpacing="roundedMedium"
              size="large"
              weight="semibold"
            >
              􀙶 Back up {cloudPlatform}
            </Text>
          </ButtonPressAnimation>
        </Footer>
      ) : !hasMultipleWallets ? (
        <Footer>
          <ButtonPressAnimation onPress={manageCloudBackups}>
            <Text
              align="center"
              color={colors.alpha(colors.blueGreyDark, 0.6)}
              letterSpacing="roundedMedium"
              size="lmedium"
              weight="semibold"
            >
              􀍢 Manage {cloudPlatform} backups
            </Text>
          </ButtonPressAnimation>
        </Footer>
      ) : null}
    </Fragment>
  );
}

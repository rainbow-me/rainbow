import { useRoute } from '@react-navigation/native';
import analytics from '@segment/analytics-react-native';
import React, { Fragment, useCallback, useEffect, useMemo } from 'react';
import { Alert, View } from 'react-native';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import { deleteAllBackups } from '../../../handlers/cloudBackup';
import { walletsUpdate } from '../../../redux/wallets';
import { DelayedAlert } from '../../alerts';
import { ButtonPressAnimation } from '../../animations';
import { Centered, Column } from '../../layout';
import { LoadingOverlay } from '../../modal';
import { SheetActionButton } from '../../sheet';
import { Text } from '../../text';
import WalletBackupStepTypes from '@rainbow-me/helpers/walletBackupStepTypes';
import WalletBackupTypes from '@rainbow-me/helpers/walletBackupTypes';
import WalletTypes from '@rainbow-me/helpers/walletTypes';
import { useWalletCloudBackup, useWallets } from '@rainbow-me/hooks';
import { Navigation, useNavigation } from '@rainbow-me/navigation';
import { sheetVerticalOffset } from '@rainbow-me/navigation/effects';
import Routes from '@rainbow-me/routes';
import { colors, fonts, padding, position, shadow } from '@rainbow-me/styles';
import { showActionSheetWithOptions } from '@rainbow-me/utils';
import { usePortal } from 'react-native-cool-modals/Portal';

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
  padding-top: 13;
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
  const { isWalletLoading, wallets, selectedWallet } = useWallets();
  const walletCloudBackup = useWalletCloudBackup();
  const walletId = params?.walletId || selectedWallet.id;

  const { setComponent, hide } = usePortal();

  useEffect(() => {
    analytics.track('Already Backed Up View', {
      category: 'settings backup',
    });
  }, []);

  useEffect(() => {
    if (isWalletLoading) {
      setComponent(
        <LoadingOverlay
          paddingTop={sheetVerticalOffset}
          title={isWalletLoading}
        />,
        false
      );
    }
    return hide;
  }, [hide, isWalletLoading, setComponent]);

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
    Navigation.handleAction(Routes.BACKUP_SHEET, {
      step: WalletBackupStepTypes.cloud,
      walletId,
    });
  }, [walletId]);

  const handlePasswordNotFound = useCallback(() => {
    Navigation.handleAction(Routes.BACKUP_SHEET, {
      missingPassword: true,
      step: WalletBackupStepTypes.cloud,
      walletId,
    });
  }, [walletId]);

  const manageCloudBackups = useCallback(() => {
    const buttons = ['Delete all iCloud backups', 'Cancel'];

    showActionSheetWithOptions(
      {
        cancelButtonIndex: 1,
        destructiveButtonIndex: 0,
        options: buttons,
        title: `Manage iCloud backups`,
      },
      buttonIndex => {
        if (buttonIndex === 0) {
          // Delete wallet with confirmation
          showActionSheetWithOptions(
            {
              cancelButtonIndex: 1,
              destructiveButtonIndex: 0,
              message: `Are you sure you want to delete all iCloud Backups`,
              options: ['YES, Delete All iCloud Backups', 'Cancel'],
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

    analytics.track('Back up to iCloud pressed', {
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
              `If you lose this device, you can recover your encrypted wallet backup from iCloud.`) ||
              (walletStatus === WalletBackupStatus.MANUAL_BACKUP &&
                `If you lose this device, you can restore your wallet with the recovery phrase you saved.`) ||
              (walletStatus === WalletBackupStatus.IMPORTED &&
                `If you lose this device, you can restore your wallet with the key you originally imported.`)}
          </DescriptionText>
        </Centered>
        <Column>
          <SheetActionButton
            color={colors.white}
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
              􀙶 Back up to iCloud
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
              􀍢 Manage iCloud backups
            </Text>
          </ButtonPressAnimation>
        </Footer>
      ) : null}
    </Fragment>
  );
}

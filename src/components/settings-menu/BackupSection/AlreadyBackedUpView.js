import { useRoute } from '@react-navigation/native';
import analytics from '@segment/analytics-react-native';
import React, { Fragment, useCallback, useEffect, useMemo } from 'react';
import { Alert, Platform, View } from 'react-native';
import styled from 'styled-components';
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
import { colors, fonts, padding } from '@rainbow-me/styles';
import { usePortal } from 'react-native-cool-modals/Portal';

const WalletBackupStatus = {
  CLOUD_BACKUP: 0,
  IMPORTED: 1,
  MANUAL_BACKUP: 2,
};

const DescriptionText = styled(Text).attrs({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.5),
  lineHeight: 'loosest',
  size: 'large',
})`
  margin-bottom: 42;
  padding-horizontal: 23;
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

const TopIcon = styled(View)`
  border-radius: 25;
  height: 50;
  margin-bottom: 19;
  padding-top: 13;
  width: 50;
`;

const TopIconGreen = styled(TopIcon)`
  background-color: ${colors.green};
  box-shadow: 0 4px 6px ${colors.alpha(colors.green, 0.4)};
`;

const TopIconGrey = styled(TopIcon)`
  background-color: ${colors.blueGreyDark50};
  box-shadow: 0 4px 6px ${colors.alpha(colors.blueGreyDark50, 0.4)};
`;

const AlreadyBackedUpView = () => {
  const { navigate } = useNavigation();
  const { params } = useRoute();
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

  const onViewRecoveryPhrase = useCallback(() => {
    navigate('ShowSecretView', {
      title: `Recovery ${
        WalletTypes.mnemonic === wallets[walletId].type ? 'Phrase' : 'Key'
      }`,
      walletId,
    });
  }, [navigate, walletId, wallets]);

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

  const onError = useCallback(msg => {
    setTimeout(() => {
      Alert.alert(msg);
    }, 500);
  }, []);

  const onIcloudBackup = useCallback(() => {
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
    walletCloudBackup,
    walletId,
    handleNoLatestBackup,
    handlePasswordNotFound,
    onError,
    walletStatus,
  ]);

  return (
    <Fragment>
      <Centered>
        <Subtitle>
          {(walletStatus === WalletBackupStatus.CLOUD_BACKUP && `Backed up`) ||
            (walletStatus === WalletBackupStatus.MANUAL_BACKUP &&
              `Backed up manually`) ||
            (walletStatus === WalletBackupStatus.IMPORTED && `Imported`)}
        </Subtitle>
      </Centered>
      <Column align="center" css={padding(0, 19, 30)} flex={1} justify="center">
        <Centered direction="column">
          {walletStatus !== WalletBackupStatus.CLOUD_BACKUP ? (
            <TopIconGrey>
              <Text align="center" color="white" size="larger" weight="bold">
                􀆅
              </Text>
            </TopIconGrey>
          ) : (
            <TopIconGreen>
              <Text align="center" color="white" size="larger" weight="bold">
                􀆅
              </Text>
            </TopIconGreen>
          )}
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
            onPress={onViewRecoveryPhrase}
            textColor={colors.alpha(colors.blueGreyDark, 0.8)}
          />
        </Column>
      </Column>

      {Platform.OS === 'ios' &&
        walletStatus !== WalletBackupStatus.CLOUD_BACKUP && (
          <Centered css={padding(0, 15, 42)}>
            <ButtonPressAnimation onPress={onIcloudBackup}>
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
          </Centered>
        )}
    </Fragment>
  );
};

export default AlreadyBackedUpView;

import { useRoute } from '@react-navigation/native';
import analytics from '@segment/analytics-react-native';
import lang from 'i18n-js';
import React, { Fragment, useCallback, useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { cloudPlatform } from '../../../utils/platform';
import { DelayedAlert } from '../../alerts';
import { ButtonPressAnimation } from '../../animations';
import { Centered, Column } from '../../layout';
import { SheetActionButton } from '../../sheet';
import { Text as NativeText } from '../../text';
import { Box, Text } from '@rainbow-me/design-system';
import WalletBackupStepTypes from '@rainbow-me/helpers/walletBackupStepTypes';
import WalletBackupTypes from '@rainbow-me/helpers/walletBackupTypes';
import WalletTypes from '@rainbow-me/helpers/walletTypes';
import {
  useManageCloudBackups,
  useWalletCloudBackup,
  useWallets,
} from '@rainbow-me/hooks';
import { Navigation, useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import styled from '@rainbow-me/styled-components';
import { fonts, padding, position, shadow } from '@rainbow-me/styles';

const WalletBackupStatus = {
  CLOUD_BACKUP: 0,
  IMPORTED: 1,
  MANUAL_BACKUP: 2,
};

const CheckmarkIconContainer = styled(View)(
  ({ color, isDarkMode, theme: { colors } }) => ({
    ...shadow.buildAsObject(0, 4, 6, isDarkMode ? colors.shadow : color, 0.4),
    ...position.sizeAsObject(50),
    backgroundColor: color,
    borderRadius: 25,
    marginBottom: 19,
    paddingTop: ios ? 13 : 7,
  })
);

const CheckmarkIconText = styled(NativeText).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.whiteLabel,
  size: 'larger',
  weight: 'bold',
}))({});

const CheckmarkIcon = ({ color, isDarkMode }) => (
  <CheckmarkIconContainer color={color} isDarkMode={isDarkMode}>
    <CheckmarkIconText>􀆅</CheckmarkIconText>
  </CheckmarkIconContainer>
);

const Content = styled(Centered).attrs({
  direction: 'column',
})({
  ...padding.object(0, 19, 30),
  flex: 1,
});

const DescriptionText = styled(NativeText).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.5),
  lineHeight: 'loosest',
  size: 'large',
}))({
  marginBottom: 42,
  paddingHorizontal: 23,
});

const Footer = styled(Centered)({
  ...padding.object(0, 15, 42),
});

const Subtitle = styled(NativeText).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.5),
  size: fonts.size.smedium,
  weight: fonts.weight.medium,
}))({
  marginTop: -10,
});

const Title = styled(NativeText).attrs({
  align: 'center',
  size: 'larger',
  weight: 'bold',
})({
  marginBottom: 8,
  paddingHorizontal: 11,
});

const onError = error => DelayedAlert({ title: error }, 500);

export default function AlreadyBackedUpView() {
  const { navigate } = useNavigation();
  const { params } = useRoute();
  const { manageCloudBackups } = useManageCloudBackups();
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

  const isSecretPhrase = WalletTypes.mnemonic === wallets[walletId].type;

  const handleViewRecoveryPhrase = useCallback(() => {
    navigate('ShowSecretView', {
      title: `${
        isSecretPhrase
          ? lang.t('back_up.secret.secret_phrase_title')
          : lang.t('back_up.secret.private_key_title')
      }`,
      walletId,
    });
  }, [isSecretPhrase, navigate, walletId]);

  const { colors } = useTheme();

  const checkmarkColor =
    walletStatus === WalletBackupStatus.CLOUD_BACKUP
      ? colors.green
      : colors.alpha(colors.blueGreyDark, 0.5);

  const hasMultipleWallets =
    Object.keys(wallets).filter(
      key => wallets[key].type !== WalletTypes.readOnly
    ).length > 1;

  const { isDarkMode } = useTheme();

  return (
    <Box
      alignItems="center"
      justifyContent="space-between"
      width="full"
      height="full"
    >
      <Box marginTop="-10px">
        <Text color="secondary50" size="14px" weight="medium">
          {(walletStatus === WalletBackupStatus.CLOUD_BACKUP && `Backed up`) ||
            (walletStatus === WalletBackupStatus.MANUAL_BACKUP &&
              `Backed up manually`) ||
            (walletStatus === WalletBackupStatus.IMPORTED && `Imported`)}
        </Text>
      </Box>

      <Box alignItems="center" marginTop="-42px">
        <CheckmarkIcon color={checkmarkColor} isDarkMode={isDarkMode} />

        <Text size="20px" weight="bold">
          {(walletStatus === WalletBackupStatus.IMPORTED &&
            `Your wallet was imported`) ||
            `Your wallet is backed up`}
        </Text>
        <Box paddingHorizontal="60px" paddingTop="24px">
          <Text size="18px" color="secondary50" align="center">
            {(walletStatus === WalletBackupStatus.CLOUD_BACKUP &&
              lang.t('back_up.explainers.if_lose_cloud', {
                cloudPlatformName: cloudPlatform,
              })) ||
              (walletStatus === WalletBackupStatus.MANUAL_BACKUP &&
                lang.t('back_up.explainers.if_lose_manual')) ||
              (walletStatus === WalletBackupStatus.IMPORTED &&
                lang.t('back_up.explainers.if_lose_imported'))}
          </Text>
        </Box>
        <Box paddingTop="42px">
          <ButtonPressAnimation onPress={handleViewRecoveryPhrase}>
            <Box
              background="body"
              paddingHorizontal="19px"
              height={{ custom: 48 }}
              borderRadius={56}
              justifyContent="center"
              shadow="15px light"
            >
              <Text color="secondary80" size="18px" weight="semibold">
                {`🗝 ${
                  isSecretPhrase
                    ? lang.t('back_up.secret.view_secret_phrase')
                    : lang.t('back_up.secret.view_private_key')
                }`}
              </Text>
            </Box>
          </ButtonPressAnimation>
        </Box>
      </Box>
      <Box paddingBottom="42px">
        {walletStatus !== WalletBackupStatus.CLOUD_BACKUP ? (
          <ButtonPressAnimation onPress={handleIcloudBackup}>
            <Text color="action" size="18px" weight="semibold">
              {`􀙶 ${lang.t('back_up.cloud.back_up_to_platform', {
                cloudPlatformName: cloudPlatform,
              })}`}
            </Text>
          </ButtonPressAnimation>
        ) : !hasMultipleWallets ? (
          <ButtonPressAnimation onPress={manageCloudBackups}>
            <Text color="secondary60" size="18px" weight="semibold">
              {`􀍢 ${lang.t('back_up.cloud.manage_platform_backups', {
                cloudPlatformName: cloudPlatform,
              })}`}
            </Text>
          </ButtonPressAnimation>
        ) : null}
      </Box>
    </Box>
  );
}

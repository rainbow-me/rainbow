import { useRoute } from '@react-navigation/native';
import lang from 'i18n-js';
import React, { useCallback, useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { cloudPlatform } from '@/utils/platform';
import { DelayedAlert } from '../../../components/alerts';
import { ButtonPressAnimation } from '../../../components/animations';
import { analytics } from '@/analytics';
import { AccentColorProvider, Box, Text } from '@/design-system';
import WalletBackupStepTypes from '@/helpers/walletBackupStepTypes';
import WalletBackupTypes from '@/helpers/walletBackupTypes';
import WalletTypes from '@/helpers/walletTypes';
import {
  useManageCloudBackups,
  useWalletCloudBackup,
  useWallets,
} from '@/hooks';
import { Navigation, useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import styled from '@/styled-thing';
import { colors, position, shadow } from '@/styles';
import { useTheme } from '@/theme';

const WalletBackupStatus = {
  CLOUD_BACKUP: 0,
  IMPORTED: 1,
  MANUAL_BACKUP: 2,
};

const CheckmarkIconContainer = styled(View)(
  ({ color, isDarkMode, theme: { colors } }: any) => ({
    ...shadow.buildAsObject(0, 4, 6, isDarkMode ? colors.shadow : color, 0.4),
    ...position.sizeAsObject(50),
    backgroundColor: color,
    borderRadius: 25,
    marginBottom: 19,
  })
);

const CheckmarkIcon = ({ color, isDarkMode }: any) => (
  <CheckmarkIconContainer color={color} isDarkMode={isDarkMode}>
    <Box alignItems="center" height="full" justifyContent="center" width="full">
      <Text
        color={{ custom: colors.whiteLabel }}
        size="20px / 24px (Deprecated)"
        weight="bold"
      >
        􀆅
      </Text>
    </Box>
  </CheckmarkIconContainer>
);

const onError = (error: any) => DelayedAlert({ title: error }, 500);

export default function AlreadyBackedUpView() {
  const { navigate } = useNavigation();
  const { params } = useRoute();
  const { manageCloudBackups } = useManageCloudBackups();
  const { wallets } = useWallets();
  const walletCloudBackup = useWalletCloudBackup();
  const walletId = (params as any)?.walletId;

  useEffect(() => {
    analytics.track('Already Backed Up View', {
      category: 'settings backup',
    });
  }, []);

  const walletStatus = useMemo(() => {
    let status = null;
    if (wallets?.[walletId]?.backedUp) {
      if (wallets?.[walletId].backupType === WalletBackupTypes.manual) {
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

  const { colors, isDarkMode } = useTheme();

  const isSecretPhrase = WalletTypes.mnemonic === wallets?.[walletId]?.type;

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

  const checkmarkColor =
    walletStatus === WalletBackupStatus.CLOUD_BACKUP
      ? colors.green
      : colors.alpha(colors.blueGreyDark, 0.5);

  const hasMultipleWallets = wallets
    ? Object.keys(wallets).filter(
        key => wallets?.[key].type !== WalletTypes.readOnly
      ).length > 1
    : false;

  return (
    <Box
      alignItems="center"
      height="full"
      justifyContent="space-between"
      width="full"
    >
      <Box marginTop="-10px">
        <Text
          color="secondary50 (Deprecated)"
          size="14px / 19px (Deprecated)"
          weight="medium"
        >
          {(walletStatus === WalletBackupStatus.CLOUD_BACKUP &&
            lang.t('back_up.already_backed_up.backed_up')) ||
            (walletStatus === WalletBackupStatus.MANUAL_BACKUP &&
              lang.t('back_up.already_backed_up.backed_up_manually')) ||
            (walletStatus === WalletBackupStatus.IMPORTED &&
              lang.t('back_up.already_backed_up.imported'))}
        </Text>
      </Box>
      <Box alignItems="center" marginTop="-42px (Deprecated)">
        <CheckmarkIcon color={checkmarkColor} isDarkMode={isDarkMode} />
        <Text
          color="primary (Deprecated)"
          size="20px / 24px (Deprecated)"
          weight="bold"
        >
          {(walletStatus === WalletBackupStatus.IMPORTED &&
            lang.t('back_up.already_backed_up.imported_message')) ||
            lang.t('back_up.already_backed_up.backed_up_message')}
        </Text>
        <Box paddingHorizontal="60px" paddingTop="24px">
          <Text
            align="center"
            color="secondary50 (Deprecated)"
            size="18px / 27px (Deprecated)"
          >
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
        <Box paddingTop="42px (Deprecated)">
          <AccentColorProvider color={colors.whiteLabel}>
            <ButtonPressAnimation
              onPress={handleViewRecoveryPhrase}
              style={
                android && {
                  // fix shadow clipping
                  paddingBottom: 8,
                }
              }
            >
              <Box
                background="card (Deprecated)"
                borderRadius={56}
                height={{ custom: 48 }}
                justifyContent="center"
                paddingHorizontal="19px (Deprecated)"
                shadow="15px light (Deprecated)"
              >
                <Text
                  color="secondary (Deprecated)"
                  containsEmoji
                  size="18px / 27px (Deprecated)"
                  weight="semibold"
                >
                  {`🗝 ${
                    isSecretPhrase
                      ? lang.t('back_up.secret.view_secret_phrase')
                      : lang.t('back_up.secret.view_private_key')
                  }`}
                </Text>
              </Box>
            </ButtonPressAnimation>
          </AccentColorProvider>
        </Box>
      </Box>
      <Box paddingBottom="42px (Deprecated)">
        {walletStatus !== WalletBackupStatus.CLOUD_BACKUP ? (
          <ButtonPressAnimation onPress={handleIcloudBackup}>
            <Text
              color="action (Deprecated)"
              size="18px / 27px (Deprecated)"
              weight="semibold"
            >
              {`􀙶 ${lang.t('back_up.cloud.back_up_to_platform', {
                cloudPlatformName: cloudPlatform,
              })}`}
            </Text>
          </ButtonPressAnimation>
        ) : !hasMultipleWallets ? (
          <ButtonPressAnimation onPress={manageCloudBackups}>
            <Text
              color="secondary60 (Deprecated)"
              size="18px / 27px (Deprecated)"
              weight="semibold"
            >
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

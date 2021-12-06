import { useRoute } from '@react-navigation/native';
import analytics from '@segment/analytics-react-native';
import React, { Fragment, useCallback, useEffect, useMemo } from 'react';
import { View } from 'react-native';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../../context/ThemeContext' was resolve... Remove this comment to see the full error message
import { useTheme } from '../../../context/ThemeContext';
import { cloudPlatform } from '../../../utils/platform';
import { DelayedAlert } from '../../alerts';
import { ButtonPressAnimation } from '../../animations';
import { Centered, Column } from '../../layout';
import { SheetActionButton } from '../../sheet';
import { Text } from '../../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/walletBack... Remove this comment to see the full error message
import WalletBackupStepTypes from '@rainbow-me/helpers/walletBackupStepTypes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/walletBack... Remove this comment to see the full error message
import WalletBackupTypes from '@rainbow-me/helpers/walletBackupTypes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/walletType... Remove this comment to see the full error message
import WalletTypes from '@rainbow-me/helpers/walletTypes';
import {
  useManageCloudBackups,
  useWalletCloudBackup,
  useWallets,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
} from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { Navigation, useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { fonts, padding, position, shadow } from '@rainbow-me/styles';

const WalletBackupStatus = {
  CLOUD_BACKUP: 0,
  IMPORTED: 1,
  MANUAL_BACKUP: 2,
};

const CheckmarkIconContainer = styled(View)`
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'color' does not exist on type 'ViewProps... Remove this comment to see the full error message
  ${({ color, isDarkMode, theme: { colors } }) =>
    shadow.build(0, 4, 6, isDarkMode ? colors.shadow : color, 0.4)};
  ${position.size(50)};
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'color' does not exist on type 'ViewProps... Remove this comment to see the full error message
  background-color: ${({ color }) => color};
  border-radius: 25;
  margin-bottom: 19;
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
  padding-top: ${ios ? 13 : 7};
`;

const CheckmarkIconText = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.whiteLabel,
  size: 'larger',
  weight: 'bold',
}))``;

const CheckmarkIcon = ({ color, isDarkMode }: any) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <CheckmarkIconContainer color={color} isDarkMode={isDarkMode}>
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
    <CheckmarkIconText>􀆅</CheckmarkIconText>
  </CheckmarkIconContainer>
);

const Content = styled(Centered).attrs({
  direction: 'column',
})`
  ${padding(0, 19, 30)};
  flex: 1;
`;

const DescriptionText = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.5),
  lineHeight: 'loosest',
  size: 'large',
}))`
  margin-bottom: 42;
  padding-horizontal: 23;
`;

const Footer = styled(Centered)`
  ${padding(0, 15, 42)};
`;

const Subtitle = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.5),
  size: fonts.size.smedium,
  weight: fonts.weight.medium,
}))`
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

const onError = (error: any) => DelayedAlert({ title: error }, 500);

export default function AlreadyBackedUpView() {
  const { navigate } = useNavigation();
  const { params } = useRoute();
  const { manageCloudBackups } = useManageCloudBackups();
  const { wallets, selectedWallet } = useWallets();
  const walletCloudBackup = useWalletCloudBackup();
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'walletId' does not exist on type 'object... Remove this comment to see the full error message
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
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
      android ? Routes.BACKUP_SCREEN : Routes.BACKUP_SHEET,
      {
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
        nativeScreen: android,
        step: WalletBackupStepTypes.cloud,
        walletId,
      }
    );
  }, [walletId]);

  const handlePasswordNotFound = useCallback(() => {
    Navigation.handleAction(
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
      android ? Routes.BACKUP_SCREEN : Routes.BACKUP_SHEET,
      {
        missingPassword: true,
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
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
      title: `${isSecretPhrase ? 'Secret Phrase' : 'Private Key'}`,
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Fragment>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Subtitle>
        {(walletStatus === WalletBackupStatus.CLOUD_BACKUP && `Backed up`) ||
          (walletStatus === WalletBackupStatus.MANUAL_BACKUP &&
            `Backed up manually`) ||
          (walletStatus === WalletBackupStatus.IMPORTED && `Imported`)}
      </Subtitle>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Content>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Centered direction="column">
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <CheckmarkIcon color={checkmarkColor} isDarkMode={isDarkMode} />
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Title>
            {(walletStatus === WalletBackupStatus.IMPORTED &&
              `Your wallet was imported`) ||
              `Your wallet is backed up`}
          </Title>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <DescriptionText>
            {(walletStatus === WalletBackupStatus.CLOUD_BACKUP &&
              `If you lose this device, you can recover your encrypted wallet backup from ${cloudPlatform}.`) ||
              (walletStatus === WalletBackupStatus.MANUAL_BACKUP &&
                `If you lose this device, you can restore your wallet with the secret phrase you saved.`) ||
              (walletStatus === WalletBackupStatus.IMPORTED &&
                `If you lose this device, you can restore your wallet with the key you originally imported.`)}
          </DescriptionText>
        </Centered>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Column>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <SheetActionButton
            color={colors.white}
            label={`🗝 View ${isSecretPhrase ? 'secret phrase' : 'private key'}`}
            onPress={handleViewRecoveryPhrase}
            textColor={colors.alpha(colors.blueGreyDark, 0.8)}
          />
        </Column>
      </Content>
      {walletStatus !== WalletBackupStatus.CLOUD_BACKUP ? (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Footer>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <ButtonPressAnimation onPress={handleIcloudBackup}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text
              align="center"
              color={colors.appleBlue}
              letterSpacing="roundedMedium"
              size="large"
              weight="semibold"
            >
              􀙶 Back up to {cloudPlatform}
            </Text>
          </ButtonPressAnimation>
        </Footer>
      ) : !hasMultipleWallets ? (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Footer>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <ButtonPressAnimation onPress={manageCloudBackups}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
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
      ) : null}
    </Fragment>
  );
}

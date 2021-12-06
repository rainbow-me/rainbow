import { useRoute } from '@react-navigation/native';
import analytics from '@segment/analytics-react-native';
import React, { Fragment, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { cloudPlatform } from '../../../utils/platform';
import { RainbowButton } from '../../buttons';
import { Centered, Column } from '../../layout';
import { SheetActionButton } from '../../sheet';
import { Text } from '../../text';
import BackupIcon from '@rainbow-me/assets/backupIcon.png';
import BackupIconDark from '@rainbow-me/assets/backupIconDark.png';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/walletBack... Remove this comment to see the full error message
import WalletBackupStepTypes from '@rainbow-me/helpers/walletBackupStepTypes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useWallets } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/images' or its cor... Remove this comment to see the full error message
import { ImgixImage } from '@rainbow-me/images';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { fonts, padding } from '@rainbow-me/styles';

const BackupButton = styled(RainbowButton).attrs({
  type: 'small',
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
  width: ios ? 221 : 270,
})`
  margin-bottom: 19;
`;

const Content = styled(Centered).attrs({
  direction: 'column',
})`
  ${padding(0, 19, 42)};
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

const Subtitle = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.orangeLight,
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

const TopIcon = styled(ImgixImage).attrs({
  resizeMode: ImgixImage.resizeMode.contain,
})`
  height: 74;
  width: 75;
`;

export default function NeedsBackupView() {
  const { navigate, setParams } = useNavigation();
  const { params } = useRoute();
  const { wallets, selectedWallet } = useWallets();
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'walletId' does not exist on type 'object... Remove this comment to see the full error message
  const walletId = params?.walletId || selectedWallet.id;

  useEffect(() => {
    if (wallets[walletId]?.backedUp) {
      setParams({ type: 'AlreadyBackedUpView' });
    }
  }, [setParams, walletId, wallets]);

  useEffect(() => {
    analytics.track('Needs Backup View', {
      category: 'settings backup',
    });
  }, []);

  const onIcloudBackup = useCallback(() => {
    analytics.track(`Back up to ${cloudPlatform} pressed`, {
      category: 'settings backup',
    });
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
    navigate(ios ? Routes.BACKUP_SHEET : Routes.BACKUP_SCREEN, {
      nativeScreen: true,
      step: WalletBackupStepTypes.cloud,
      walletId,
    });
  }, [navigate, walletId]);

  const onManualBackup = useCallback(() => {
    analytics.track('Manual Backup pressed', {
      category: 'settings backup',
    });
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
    navigate(ios ? Routes.BACKUP_SHEET : Routes.BACKUP_SCREEN, {
      nativeScreen: true,
      step: WalletBackupStepTypes.manual,
      walletId,
    });
  }, [navigate, walletId]);

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors, isDarkMode } = useTheme();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Fragment>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Subtitle>Not backed up</Subtitle>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Content>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Column align="center">
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <TopIcon source={isDarkMode ? BackupIconDark : BackupIcon} />
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Title>Back up your wallet </Title>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <DescriptionText>
            Don&apos;t risk your money! Back up your wallet so you can recover
            it if you lose this device.
          </DescriptionText>
        </Column>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Column align="center">
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <BackupButton
            label={`􀙶 Back up to ${cloudPlatform}`}
            onPress={onIcloudBackup}
          />
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <SheetActionButton
            color={colors.white}
            label="🤓 Back up manually"
            onPress={onManualBackup}
            textColor={colors.alpha(colors.blueGreyDark, 0.8)}
          />
        </Column>
      </Content>
    </Fragment>
  );
}

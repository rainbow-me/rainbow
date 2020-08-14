import { useNavigation, useRoute } from '@react-navigation/native';
import React, { Fragment, useCallback, useEffect, useMemo } from 'react';
import { Alert, Platform, View } from 'react-native';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import WalletBackupTypes from '../../../helpers/walletBackupTypes';
import WalletLoadingStates from '../../../helpers/walletLoadingStates';
import WalletTypes from '../../../helpers/walletTypes';
import { useWallets } from '../../../hooks';
import {
  addWalletToCloudBackup,
  fetchBackupPassword,
} from '../../../model/backup';
import { Navigation } from '../../../navigation';
import { sheetVerticalOffset } from '../../../navigation/effects';
import { usePortal } from '../../../react-native-cool-modals/Portal';
import { setIsWalletLoading, setWalletBackedUp } from '../../../redux/wallets';
import { logger } from '../../../utils';
import { ButtonPressAnimation } from '../../animations';
import { Centered, Column } from '../../layout';
import LoadingOverlay from '../../modal/LoadingOverlay';
import { SheetActionButton } from '../../sheet';
import { Text } from '../../text';
import Routes from '@rainbow-me/routes';
import { colors, fonts, padding } from '@rainbow-me/styles';

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
  const dispatch = useDispatch();
  const {
    isWalletLoading,
    latestBackup,
    wallets,
    selectedWallet,
  } = useWallets();
  const walletId = params?.walletId || selectedWallet.id;

  const { setComponent, hide } = usePortal();

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

  const onFooterAction = useCallback(async () => {
    if (
      [WalletBackupStatus.MANUAL_BACKUP, WalletBackupStatus.IMPORTED].includes(
        walletStatus
      )
    ) {
      let password = null;
      if (latestBackup) {
        password = await fetchBackupPassword();
        // If we can't get the password, we need to prompt it again
        if (!password) {
          Navigation.handleAction(Routes.BACKUP_SHEET, {
            missingPassword: true,
            option: WalletBackupTypes.cloud,
            walletId,
          });
        } else {
          await dispatch(
            setIsWalletLoading(WalletLoadingStates.BACKING_UP_WALLET)
          );
          // We have the password and we need to add it to an existing backup
          logger.log('AlreadyBackedUpView::password fetched correctly');
          const backupFile = await addWalletToCloudBackup(
            password,
            wallets[walletId],
            latestBackup
          );
          if (backupFile) {
            logger.log('AlreadyBackedUpView:: backup completed!', backupFile);
            await dispatch(
              setWalletBackedUp(walletId, WalletBackupTypes.cloud, backupFile)
            );
            logger.log('AlreadyBackedUpView:: backup saved everywhere!');
          } else {
            Alert.alert('Error while trying to backup');
          }
        }
      } else {
        // No password, No latest backup meaning
        // it's a first time backup so we need to show the password sheet
        Navigation.handleAction(Routes.BACKUP_SHEET, {
          option: WalletBackupTypes.cloud,
          walletId,
        });
      }
    }
  }, [walletStatus, latestBackup, walletId, wallets, dispatch]);
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
            <ButtonPressAnimation onPress={onFooterAction}>
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

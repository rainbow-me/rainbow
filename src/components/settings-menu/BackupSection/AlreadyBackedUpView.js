import React, { Fragment, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import WalletBackupTypes from '../../../helpers/walletBackupTypes';
import WalletTypes from '../../../helpers/walletTypes';
import { useWallets } from '../../../hooks';
import { fetchBackupPassword } from '../../../model/keychain';
import { addWalletToCloudBackup } from '../../../model/wallet';
import { deleteCloudBackup, setWalletBackedUp } from '../../../redux/wallets';
import Routes from '../../../screens/Routes/routesNames';
import { colors, fonts, padding } from '../../../styles';
import { logger } from '../../../utils';
import { ButtonPressAnimation } from '../../animations';
import { Centered, Column, ColumnWithMargins } from '../../layout';
import { SheetButton } from '../../sheet';
import { Text } from '../../text';
import ShowSecretView from './ShowSecretView';

const Title = styled(Text).attrs({
  size: 'big',
  weight: 'bold',
})`
  margin-bottom: 12;
`;

const TopIcon = styled(Text).attrs({
  align: 'center',
  color: 'white',
  size: 30,
  weight: 'bold',
})`
  margin-bottom: 19;
  margin-top: 0;
  border-radius: 30;
  overflow: hidden;
  padding-top: 10;
  padding-bottom: 10;
  padding-left: 10;
  padding-right: 10;
`;

const TopIconGreen = styled(TopIcon)`
  background-color: ${colors.green};
`;

const TopIconGrey = styled(TopIcon)`
  background-color: ${colors.grey};
`;

const DescriptionText = styled(Text).attrs({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.5),
  lineHeight: 'looser',
  size: 'large',
})`
  padding-bottom: 30;
  padding-left: 20;
  padding-right: 20;
`;

const AlreadyBackedUpView = () => {
  const { navigate, getParam, setParams } = useNavigation();
  const dispatch = useDispatch();
  const { latestBackup, wallets, selectedWallet } = useWallets();
  const wallet_id = getParam('wallet_id', null) || selectedWallet.id;
  const onViewRecoveryPhrase = useCallback(() => {
    setParams({
      section: {
        component: ShowSecretView,
        title: `Recovery ${
          WalletTypes.mnemonic === wallets[wallet_id].type ? 'Phrase' : 'Key'
        }`,
      },
      wallet_id,
    });
  }, [setParams, wallet_id, wallets]);

  const walletStatus = useMemo(() => {
    let status = null;
    if (wallets[wallet_id].backedUp) {
      if (wallets[wallet_id].backupType === WalletBackupTypes.manual) {
        status = 'manual_backup';
      } else {
        status = 'cloud_backup';
      }
    } else {
      status = 'imported';
    }
    return status;
  }, [wallet_id, wallets]);

  const onFooterAction = useCallback(async () => {
    if (['manual_backup', 'imported'].includes(walletStatus)) {
      let password = null;
      if (latestBackup) {
        password = await fetchBackupPassword();
        // If we can't get the password, we need to prompt it again
        if (!password) {
          navigate(Routes.BACKUP_SHEET_TOP, {
            option: WalletBackupTypes.cloud,
            wallet_id,
          });
        } else {
          // We have the password and we need to add it to an existing backup
          logger.log('password fetched correctly', password);
          const backupFile = await addWalletToCloudBackup(
            password,
            wallets[wallet_id],
            latestBackup
          );
          if (backupFile) {
            logger.log('onConfirmBackup:: backup completed!', backupFile);
            await dispatch(
              setWalletBackedUp(wallet_id, WalletBackupTypes.cloud, backupFile)
            );
            logger.log(
              'onConfirmBackup:: backup saved in redux / keychain!',
              backupFile
            );

            logger.log(
              'onConfirmBackup:: backed up user data in the cloud!',
              backupFile
            );
          } else {
            Alert.alert('Error while trying to backup');
          }
        }
      } else {
        // No password, No latest backup meaning
        // it's a first time backup so we need to show the password sheet
        navigate(Routes.BACKUP_SHEET_TOP, {
          option: WalletBackupTypes.cloud,
          wallet_id,
        });
      }
    } else {
      await dispatch(deleteCloudBackup(wallet_id));
    }
  }, [walletStatus, latestBackup, navigate, wallet_id, wallets, dispatch]);

  return (
    <Fragment>
      <Centered>
        <Text
          color={walletStatus === 'cloud_backup' ? colors.green : colors.grey}
          weight={fonts.weight.semibold}
          size={parseFloat(fonts.size.medium)}
        >
          {(walletStatus === 'cloud_backup' && `Backed up`) ||
            (walletStatus === 'cloud_backup' && `Backed up manually`) ||
            (walletStatus === 'imported' && `Imported`)}
        </Text>
      </Centered>
      <Column align="center" css={padding(0, 40, 0)} flex={1}>
        <Centered direction="column" paddingTop={70} paddingBottom={15}>
          {walletStatus !== 'cloud_backup' ? (
            <TopIconGrey>􀆅</TopIconGrey>
          ) : (
            <TopIconGreen>􀆅</TopIconGreen>
          )}
          <Title>
            {(walletStatus === 'imported' && `Your wallet was imported`) ||
              `Your wallet is backed up`}
          </Title>
          <DescriptionText>
            {(walletStatus === 'cloud_backup' &&
              `If you lose this device, you can recover your encrypted wallet backup from iCloud`) ||
              (walletStatus === 'manual_backup' &&
                `If you lose this device, you can restore your wallet with the recovery phrase you saved.`) ||
              (walletStatus === 'imported' &&
                `If you lose this device, you can restore your wallet with the recovery phrase you used to import it.`)}
          </DescriptionText>
        </Centered>
        <ColumnWithMargins css={padding(19, 10)} margin={19} width="100%">
          <SheetButton
            color={colors.white}
            textColor={colors.alpha(colors.blueGreyDark, 0.8)}
            label="🗝 View recovery phrase"
            onPress={onViewRecoveryPhrase}
          />
        </ColumnWithMargins>
      </Column>

      <Centered css={padding(42, 15)}>
        <ButtonPressAnimation onPress={onFooterAction}>
          <Text
            align="center"
            color={
              walletStatus !== 'cloud_backup' ? colors.appleBlue : colors.red
            }
            size="larger"
            style={{
              lineHeight: 24,
            }}
            weight="semibold"
          >
            {walletStatus !== 'cloud_backup'
              ? `􀙶 Back up to iCloud`
              : `􀈒 Delete iCloud backup`}
          </Text>
        </ButtonPressAnimation>
      </Centered>
    </Fragment>
  );
};

export default AlreadyBackedUpView;

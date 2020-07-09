import { useRoute } from '@react-navigation/native';
import React, { Fragment, useCallback, useEffect } from 'react';
import FastImage from 'react-native-fast-image';
import styled from 'styled-components';
import BackupIcon from '../../../assets/backupIcon.png';
import WalletBackupTypes from '../../../helpers/walletBackupTypes';
import { useWallets } from '../../../hooks';
import { useNavigation } from '../../../navigation/Navigation';
import Routes from '../../../navigation/routesNames';
import { colors, fonts, padding } from '../../../styles';
import { RainbowButton } from '../../buttons';
import { Column } from '../../layout';
import { SheetActionButton } from '../../sheet';
import { Text } from '../../text';

const BackupButton = styled(RainbowButton).attrs({
  type: 'small',
  width: 221,
})`
  margin-bottom: 19;
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

const Subtitle = styled(Text).attrs({
  align: 'center',
  color: colors.orangeLight,
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

const TopIcon = styled(FastImage).attrs({
  resizeMode: FastImage.resizeMode.contain,
  source: BackupIcon,
})`
  height: 74;
  width: 75;
`;

const NeedsBackupView = () => {
  const { navigate, setParams } = useNavigation();
  const { params } = useRoute();
  const { wallets, selectedWallet } = useWallets();
  const wallet_id = params?.wallet_id || selectedWallet.id;

  useEffect(() => {
    if (wallets[wallet_id]?.backedUp) {
      setParams({ type: 'AlreadyBackedUpView' });
    }
  }, [setParams, wallet_id, wallets]);

  const onIcloudBackup = useCallback(() => {
    navigate(Routes.BACKUP_SHEET, {
      option: WalletBackupTypes.cloud,
      wallet_id,
    });
  }, [navigate, wallet_id]);

  const onManualBackup = useCallback(() => {
    navigate(Routes.BACKUP_SHEET, {
      option: WalletBackupTypes.manual,
      wallet_id,
    });
  }, [navigate, wallet_id]);

  return (
    <Fragment>
      <Subtitle>Not backed up</Subtitle>
      <Column align="center" css={padding(0, 19, 42)} flex={1} justify="center">
        <Column align="center">
          <TopIcon />
          <Title>Back up your wallet </Title>
          <DescriptionText>
            Don&apos;t risk your money! Back up your wallet so you can recover
            it if you lose this device.
          </DescriptionText>
        </Column>
        <Column align="center">
          <BackupButton label="􀙶 Back up to iCloud" onPress={onIcloudBackup} />
          <SheetActionButton
            color={colors.white}
            textColor={colors.alpha(colors.blueGreyDark, 0.8)}
            label="🤓 Back up manually"
            onPress={onManualBackup}
          />
        </Column>
      </Column>
    </Fragment>
  );
};

export default NeedsBackupView;

import { useNavigation, useRoute } from '@react-navigation/native';
import React, { Fragment, useCallback } from 'react';
import FastImage from 'react-native-fast-image';
import styled from 'styled-components';
import BackupIcon from '../../../assets/backupIcon.png';
import WalletBackupTypes from '../../../helpers/walletBackupTypes';
import Routes from '../../../navigation/routesNames';
import { colors, fonts, padding } from '../../../styles';
import { RainbowButton } from '../../buttons';
import { Centered, Column } from '../../layout';
import { SheetButton } from '../../sheet';
import { Text } from '../../text';

const BackupButton = styled(RainbowButton).attrs({
  width: 280,
})`
  margin-bottom: 12;
`;
const Title = styled(Text).attrs({
  size: 'big',
  weight: 'bold',
})`
  margin-bottom: 12;
`;

const TopIcon = styled(FastImage).attrs({
  resizeMode: FastImage.resizeMode.contain,
  source: BackupIcon,
})`
  height: 85;
  width: 85;
  margin-bottom: 12;
  margin-top: 0;
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

const NeedsBackupView = () => {
  const { navigate } = useNavigation();
  const { params } = useRoute();

  const wallet_id = params?.wallet_id;
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
      <Centered>
        <Text
          color={colors.yellow}
          weight={fonts.weight.semibold}
          size={parseFloat(fonts.size.medium)}
        >
          Not backed up
        </Text>
      </Centered>
      <Column align="center" css={padding(0, 40, 0)} flex={1}>
        <Column align="center" paddingTop={70} paddingBottom={15}>
          <TopIcon />
          <Title>Back up your wallet </Title>
          <DescriptionText>
            Don&apos;t risk your money! Back up your wallet so you can recover
            it if you lose this device.
          </DescriptionText>
        </Column>
        <Column align="center">
          <BackupButton
            label="􀙶 Back up to iCloud"
            onPress={onIcloudBackup}
            type="add-cash"
          />
          <Column paddingHorizontal={15} paddingTop={10}>
            <SheetButton
              color={colors.white}
              textColor={colors.alpha(colors.blueGreyDark, 0.8)}
              label="🤓 Back up manually"
              onPress={onManualBackup}
            />
          </Column>
        </Column>
      </Column>
    </Fragment>
  );
};

export default NeedsBackupView;

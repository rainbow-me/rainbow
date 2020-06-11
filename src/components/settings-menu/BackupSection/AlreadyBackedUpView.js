import React, { Fragment, useCallback } from 'react';
import { useNavigation } from 'react-navigation-hooks';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import WalletBackupTypes from '../../../helpers/walletBackupTypes';
import WalletTypes from '../../../helpers/walletTypes';
import { useWallets } from '../../../hooks';
import { deleteCloudBackup } from '../../../redux/wallets';
import Routes from '../../../screens/Routes/routesNames';
import { colors, fonts, padding } from '../../../styles';
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
  const { wallets, selectedWallet } = useWallets();
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

  const isManualBackup =
    wallets[wallet_id].backupType === WalletBackupTypes.manual;

  const onFooterAction = useCallback(async () => {
    if (isManualBackup) {
      navigate(Routes.BACKUP_SHEET_TOP, {
        option: WalletBackupTypes.cloud,
        wallet_id,
      });
    } else {
      await dispatch(deleteCloudBackup(wallet_id));
    }
  }, [dispatch, isManualBackup, navigate, wallet_id]);

  return (
    <Fragment>
      <Centered>
        <Text
          color={isManualBackup ? colors.grey : colors.green}
          weight={fonts.weight.semibold}
          size={parseFloat(fonts.size.medium)}
        >
          Backed up {isManualBackup && 'manually'}
        </Text>
      </Centered>
      <Column align="center" css={padding(0, 40, 0)} flex={1}>
        <Centered direction="column" paddingTop={70} paddingBottom={15}>
          {isManualBackup ? (
            <TopIconGrey>􀆅</TopIconGrey>
          ) : (
            <TopIconGreen>􀆅</TopIconGreen>
          )}
          <Title>Your wallet is backed up</Title>
          <DescriptionText>
            {isManualBackup
              ? `If you lose this device, you can restore your wallet with the recovery phrase you saved.`
              : `If you lose this device, you can recover your encrypted wallet backup from iCloud`}
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
            color={isManualBackup ? colors.appleBlue : colors.red}
            size="larger"
            style={{
              lineHeight: 24,
            }}
            weight="semibold"
          >
            {isManualBackup ? `􀙶 Back up to iCloud` : `􀈒 Delete iCloud backup`}
          </Text>
        </ButtonPressAnimation>
      </Centered>
    </Fragment>
  );
};

export default AlreadyBackedUpView;

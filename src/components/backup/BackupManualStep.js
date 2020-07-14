import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import WalletBackupTypes from '../../helpers/walletBackupTypes';
import WalletTypes from '../../helpers/walletTypes';
import { useWallets } from '../../hooks';
import { setWalletBackedUp } from '../../redux/wallets';
import { colors, padding } from '../../styles';
import { deviceUtils } from '../../utils';
import { Centered, Column } from '../layout';
import { SecretDisplaySection } from '../secret-display';
import { SheetActionButton } from '../sheet';
import { Text } from '../text';

const contentHeight = deviceUtils.dimensions.height - 150;

const Title = styled(Text).attrs({
  size: 'big',
  weight: 'bold',
})`
  margin-bottom: 12;
`;

const TopIcon = styled(Text).attrs({
  align: 'center',
  color: 'appleBlue',
  size: 48,
  weight: 'bold',
})``;
const DescriptionText = styled(Text).attrs({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.5),
  lineHeight: 'looser',
  size: 'large',
})``;

const ImportantText = styled(Text).attrs({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.5),
  lineHeight: 'looser',
  size: 'large',
  weight: '600',
})``;

const BackupManualStep = () => {
  const { selectedWallet } = useWallets();
  const dispatch = useDispatch();
  const { goBack } = useNavigation();
  const { params } = useRoute();
  const [type, setType] = useState(null);
  const [secretLoaded, setSecretLoaded] = useState(false);
  const walletId = params?.walletId || selectedWallet.id;

  const onComplete = useCallback(async () => {
    await dispatch(setWalletBackedUp(walletId, WalletBackupTypes.manual));
    goBack();
  }, [dispatch, goBack, walletId]);

  return (
    <Centered
      direction="column"
      flex={1}
      height={contentHeight}
      paddingBottom={15}
    >
      <Column marginBottom={12} marginTop={15}>
        <TopIcon>􀉆</TopIcon>
      </Column>
      <Title>Back up manually</Title>
      <Column paddingBottom={65} paddingHorizontal={60}>
        <DescriptionText>
          <ImportantText>
            {type === WalletTypes.privateKey
              ? `This is the key to your wallet!`
              : `These words are the keys to your wallet!`}
          </ImportantText>
          &nbsp;
          {type === WalletTypes.privateKey
            ? `Copy it and save it in your password manager, or in another secure spot.`
            : `Write them down or save them in your password manager.`}
        </DescriptionText>
      </Column>
      <Column>
        <SecretDisplaySection
          onWalletTypeIdentified={setType}
          secretLoaded={setSecretLoaded}
        />
      </Column>
      <Column css={padding(0, 15)} flex={1} justify="end" width="100%">
        {secretLoaded && (
          <SheetActionButton
            color={colors.appleBlue}
            label={`􀁣 I’ve saved ${
              type === WalletTypes.privateKey ? 'my key' : 'these words'
            }`}
            onPress={onComplete}
            size="big"
            weight="bold"
          />
        )}
      </Column>
    </Centered>
  );
};

export default BackupManualStep;

import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import WalletBackupTypes from '../../helpers/walletBackupTypes';
import WalletTypes from '../../helpers/walletTypes';
import { useDimensions, useWallets } from '../../hooks';
import { setWalletBackedUp } from '../../redux/wallets';
import { deviceUtils } from '../../utils';
import { Centered, Column } from '../layout';
import { SecretDisplaySection } from '../secret-display';
import { SheetActionButton } from '../sheet';
import { Text } from '../text';
import { colors, padding } from '@rainbow-me/styles';

const contentHeight =
  Platform.OS === 'android'
    ? deviceUtils.dimensions.height - 50
    : deviceUtils.dimensions.height - (deviceUtils.isTallPhone ? 150 : 60);

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
  const { isTallPhone } = useDimensions();
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
      paddingBottom={isTallPhone ? 15 : 20}
    >
      <Column marginBottom={12} marginTop={15}>
        <TopIcon>􀉆</TopIcon>
      </Column>
      <Title>Back up manually</Title>
      <Column
        paddingBottom={Platform.OS === 'android' ? 30 : isTallPhone ? 65 : 15}
        paddingHorizontal={isTallPhone ? 65 : 35}
      >
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

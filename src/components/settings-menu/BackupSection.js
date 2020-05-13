import analytics from '@segment/analytics-react-native';
import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import FastImage from 'react-native-fast-image';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import SeedPhraseImageSource from '../../assets/seed-phrase-icon.png';
import { useInitializeWallet, useWallets } from '../../hooks';
import * as keychain from '../../model/keychain';
import { loadSeedPhraseAndMigrateIfNeeded } from '../../model/wallet';
import { walletsLoadState } from '../../redux/wallets';
import { colors, padding, position, shadow } from '../../styles';
import { logger } from '../../utils';
import { Button } from '../buttons';
import CopyTooltip from '../copy-tooltip';
import { Centered, Column, RowWithMargins } from '../layout';
import { Br, Monospace, Text } from '../text';

const Content = styled(Centered)`
  margin-bottom: 34;
  margin-top: 6;
  max-width: 265;
  padding-top: ${({ seedPhrase }) => (seedPhrase ? 34 : 0)};
`;

const ToggleSeedPhraseButton = styled(Button)`
  ${shadow.build(0, 5, 15, colors.purple, 0.3)}
  background-color: ${colors.appleBlue};
  width: 235;
`;

const BackupButton = styled(Button)`
  ${shadow.build(0, 5, 15, colors.purple, 0.3)}
  background-color: ${colors.appleBlue};
  width: 235;
`;

const BackupSection = ({ navigation }) => {
  const [seedPhrase, setSeedPhrase] = useState(null);
  const dispatch = useDispatch();
  const { selected: selectedWallet = {} } = useWallets();
  const initializeWallet = useInitializeWallet();

  const hideSeedPhrase = () => setSeedPhrase(null);

  const icloudBackup = useCallback(async () => {
    try {
      const success = await keychain.backupToCloud('PA$$WOOORD');
      if (success) {
        Alert.alert('Your wallet has been backed up!');
      } else {
        Alert.alert('Error while trying to backup');
      }
    } catch (e) {
      logger.log('Error while backing up', e);
    }
  }, []);

  const restoreBackup = useCallback(async () => {
    try {
      const success = await keychain.restoreCloudBackup('PA$$WOOORD');
      if (success) {
        await initializeWallet();
        dispatch(walletsLoadState());
        Alert.alert('Your wallet has been restored!');
      } else {
        Alert.alert('Error while restoring your backup');
      }
    } catch (e) {
      logger.log('Error while restoring backup', e);
    }
  }, [dispatch, initializeWallet]);

  const resetKeychain = useCallback(async () => {
    try {
      await keychain.reset();
      await initializeWallet();
      dispatch(walletsLoadState());
      Alert.alert('The keychain has been reset');
    } catch (e) {
      logger.log('Error while restoring backup', e);
    }
  }, [dispatch, initializeWallet]);

  const handlePressToggleSeedPhrase = useCallback(() => {
    if (!seedPhrase) {
      loadSeedPhraseAndMigrateIfNeeded(selectedWallet.id)
        .then(keychainValue => {
          setSeedPhrase(keychainValue);
          analytics.track('Viewed backup seed phrase text');
        })
        .catch(hideSeedPhrase);
    } else {
      hideSeedPhrase();
    }
  }, [seedPhrase, selectedWallet.id]);

  return (
    <Column align="center" css={padding(80, 40, 0)} flex={1}>
      <FastImage
        source={SeedPhraseImageSource}
        style={position.sizeAsObject(70)}
      />
      <Text lineHeight="loosest" size="larger" weight="semibold">
        Your Private Key
      </Text>
      <Content flex={0} seedPhrase={seedPhrase}>
        {seedPhrase ? (
          <CopyTooltip
            navigation={navigation}
            textToCopy={seedPhrase}
            tooltipText="Copy Private Key"
          >
            <Monospace
              align="center"
              lineHeight="looser"
              size="large"
              weight="regular"
            >
              {seedPhrase}
            </Monospace>
          </CopyTooltip>
        ) : (
          <Text
            align="center"
            color={colors.alpha(colors.blueGreyDark, 0.6)}
            lineHeight="loose"
            size="lmedium"
          >
            If you lose access to your device, the only way to restore your
            funds is with your private key.
            <Br />
            <Br />
            Please store it in a safe place.
          </Text>
        )}
      </Content>
      <ToggleSeedPhraseButton onPress={handlePressToggleSeedPhrase}>
        {seedPhrase ? 'Hide' : 'Show'} Private Key
      </ToggleSeedPhraseButton>
      {__DEV__ && (
        <React.Fragment>
          <RowWithMargins marginTop={20}>
            <BackupButton onPress={icloudBackup}>iCloud Backup</BackupButton>
          </RowWithMargins>
          <RowWithMargins marginTop={20}>
            <BackupButton onPress={restoreBackup}>Restore backup</BackupButton>
          </RowWithMargins>
          <RowWithMargins marginTop={20}>
            <BackupButton onPress={resetKeychain}>Reset keychain</BackupButton>
          </RowWithMargins>
        </React.Fragment>
      )}
    </Column>
  );
};

BackupSection.propTypes = {
  navigation: PropTypes.object,
};

export default BackupSection;

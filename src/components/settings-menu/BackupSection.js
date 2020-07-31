import analytics from '@segment/analytics-react-native';
import { captureMessage } from '@sentry/react-native';
import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';
import FastImage from 'react-native-fast-image';
import styled from 'styled-components';
import SeedPhraseImageSource from '../../assets/seed-phrase-icon.png';
import { useInitializeWallet, useWallets } from '../../hooks';
import {
  getAllWallets,
  getPrivateKey,
  getSeedPhrase,
  getSelectedWallet,
  loadAddress,
  loadSeedPhraseAndMigrateIfNeeded,
} from '../../model/wallet';
import store from '../../redux/store';
import { logger } from '../../utils';
import { Button } from '../buttons';
import CopyTooltip from '../copy-tooltip';
import { Centered, Column } from '../layout';
import { Br, Monospace, Text } from '../text';
import { colors, padding, position, shadow } from '@rainbow-me/styles';

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

const BackupSection = ({ navigation }) => {
  const initializeWallet = useInitializeWallet();
  const [seedPhrase, setSeedPhrase] = useState(null);
  const { selectedWallet } = useWallets();
  const [shouldRetry, setShouldRetry] = useState(true);

  const hideSeedPhrase = () => setSeedPhrase(null);

  const logAndAttemptRestore = useCallback(
    async error => {
      if (!shouldRetry) {
        hideSeedPhrase();
        return;
      }

      setShouldRetry(false);

      // 1 - Log the error if exists
      if (error) {
        logger.sentry(
          '[logAndAttemptRestore]: Error while revealing seed',
          error
        );
      }

      const { wallets, settings } = store.getState();

      // 2 - Log redux and public keychain entries
      logger.sentry('[logAndAttemptRestore]: REDUX DATA:', {
        settings,
        wallets,
      });
      try {
        const allWallets = await getAllWallets();
        logger.sentry(
          '[logAndAttemptRestore]: Keychain allWallets:',
          allWallets
        );
      } catch (e) {
        logger.sentry('Got error on getAllWallets', e);
      }

      try {
        const selectedWallet = await getSelectedWallet();
        logger.sentry(
          '[logAndAttemptRestore]: Keychain selectedWallet:',
          selectedWallet
        );
      } catch (e) {
        logger.sentry('Got error on getSelectedWallet', e);
      }

      try {
        const address = await loadAddress();
        logger.sentry('[logAndAttemptRestore]: Keychain address:', address);
      } catch (e) {
        logger.sentry('Got error on loadAddress', e);
      }

      // 3 - Send message to sentry
      captureMessage(`Error while revealing seed`);
      logger.sentry('[logAndAttemptRestore] message sent to sentry');

      // 4 - Attempt to restore
      try {
        const { wallets } = await getAllWallets();
        logger.sentry('[logAndAttemptRestore]: Got all wallets');

        // If we don't have the private key, let's try with the seed directly
        const walletId = selectedWallet?.id || Object.keys(wallets)[0];
        logger.sentry('[logAndAttemptRestore] got wallet id', walletId);
        const seedData = await getSeedPhrase(walletId);
        if (seedData?.seedphrase) {
          logger.sentry('[logAndAttemptRestore]: got seedphrase');
          setSeedPhrase(seedData?.seedphrase);
          captureMessage('Rescued seedphrase!');
          //Attempt to fix the broken state
          logger.sentry('[logAndAttemptRestore]: initializing wallet...');
          await initializeWallet(seedData.seedphrase, null, null, false, true);
          captureMessage('Reimported seedphrase sucessful');
        } else {
          // If we have everything, let's try to export the pkey
          // as a fallback measure
          const res = await getPrivateKey(settings.accountAddress);
          if (res?.privateKey) {
            logger.sentry('[logAndAttemptRestore]: got private key');
            setSeedPhrase(res.privateKey);
            captureMessage('Rescued private key!');

            //Attempt to fix the broken state
            logger.sentry('[logAndAttemptRestore]: initializing wallet...');
            await initializeWallet(res.privateKey, null, null, false, true);
            captureMessage('Reimported private key sucessful');
          }
        }
      } catch (e) {
        logger.sentry(
          '[logAndAttemptRestore] Got error getting all wallets',
          e
        );
      }
    },
    [initializeWallet, selectedWallet?.id, shouldRetry]
  );

  const handlePressToggleSeedPhrase = useCallback(() => {
    if (!seedPhrase) {
      loadSeedPhraseAndMigrateIfNeeded(selectedWallet.id)
        .then(keychainValue => {
          if (!keychainValue) {
            logAndAttemptRestore();
          } else {
            setSeedPhrase(keychainValue);
            analytics.track('Viewed backup seed phrase text');
          }
        })
        .catch(e => logAndAttemptRestore(e));
    } else {
      hideSeedPhrase();
    }
  }, [logAndAttemptRestore, seedPhrase, selectedWallet.id]);

  return (
    <Column align="center" css={padding(80, 40, 0)} flex={1}>
      <FastImage
        source={SeedPhraseImageSource}
        style={position.sizeAsObject(70)}
      />
      <Text lineHeight="loosest" size="larger" weight="semibold">
        Your Private Key
      </Text>
      <Content seedPhrase={seedPhrase}>
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
    </Column>
  );
};

BackupSection.propTypes = {
  navigation: PropTypes.object,
};

export default BackupSection;

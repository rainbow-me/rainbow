import analytics from '@segment/analytics-react-native';
import { captureMessage } from '@sentry/react-native';
import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';
import FastImage from 'react-native-fast-image';
import styled from 'styled-components';
import SeedPhraseImageSource from '../../assets/seed-phrase-icon.png';
import { useWallets } from '../../hooks';
import {
  getAllWallets,
  getSelectedWallet,
  loadAddress,
  loadSeedPhraseAndMigrateIfNeeded,
} from '../../model/wallet';
import store from '../../redux/store';
import { walletsLoadState, walletsUpdate } from '../../redux/wallets';
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
        logger.sentry(
          '[logAndAttemptRestore]: Keychain allWallets:',
          await getAllWallets()
        );
        // eslint-disable-next-line no-empty
      } catch (e) {}

      try {
        logger.sentry(
          '[logAndAttemptRestore]: Keychain selectedWallet:',
          await getSelectedWallet()
        );
        // eslint-disable-next-line no-empty
      } catch (e) {}

      try {
        logger.sentry(
          '[logAndAttemptRestore]: Keychain address:',
          await loadAddress()
        );
        // eslint-disable-next-line no-empty
      } catch (e) {}

      // 3 - Send message to sentry
      captureMessage(`Error while revealing seed`);
      logger.sentry('[logAndAttemptRestore] message sent to sentry');

      // 4 - Attempt to restore
      try {
        // eslint-disable-next-line no-unused-vars
        const { wallets } = await getAllWallets();
        logger.sentry('[logAndAttemptRestore] Got all wallets');
      } catch (e) {
        logger.sentry(
          '[logAndAttemptRestore] Got error getting all wallets',
          e
        );
        // if we don't have all wallets, let's see if we have a selected wallet
        const selected = await getSelectedWallet();
        logger.sentry('[logAndAttemptRestore] Got selected wallet');
        if (selected?.wallet?.id) {
          const { wallet } = selected;
          // We can recover it based in the selected wallet
          await store.dispatch(walletsUpdate({ [wallet.id]: wallet }));
          logger.sentry('[logAndAttemptRestore] Updated wallets');
          await store.dispatch(walletsLoadState());
          logger.sentry('[logAndAttemptRestore] Reloaded wallets state');
          // Retrying one more time
          const keychainValue = await loadSeedPhraseAndMigrateIfNeeded(
            wallet.id
          );
          if (keychainValue) {
            setSeedPhrase(keychainValue);
            captureMessage(`Restore from selected wallet successful`);
          }
        }
      }
    },
    [shouldRetry]
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

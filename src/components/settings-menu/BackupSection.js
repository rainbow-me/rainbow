import analytics from '@segment/analytics-react-native';
import { captureMessage } from '@sentry/react-native';
import { keys } from 'lodash';
import React, { useCallback, useState } from 'react';
import FastImage from 'react-native-fast-image';
import styled from 'styled-components';
import SeedPhraseImageSource from '../../assets/seed-phrase-icon.png';
import { getAllKeysAnonymized } from '../../model/keychain';
import {
  getAllWallets,
  getPrivateKey,
  getSeedPhrase,
  getSelectedWallet,
  loadAddress,
  loadSeedPhraseAndMigrateIfNeeded,
} from '../../model/wallet';
import store from '../../redux/store';
import { Button } from '../buttons';
import CopyTooltip from '../copy-tooltip';
import { Icon } from '../icons';
import { Centered, Column, RowWithMargins } from '../layout';
import { Br, Monospace, Text } from '../text';
import BiometryTypes from '@rainbow-me/helpers/biometryTypes';
import showWalletErrorAlert from '@rainbow-me/helpers/support';
import {
  useBiometryType,
  useInitializeWallet,
  useWallets,
} from '@rainbow-me/hooks';
import { colors, padding, position, shadow } from '@rainbow-me/styles';
import logger from 'logger';

const BackupGraphic = styled(FastImage).attrs({
  source: SeedPhraseImageSource,
})`
  ${position.size(70)};
`;

const BiometryIcon = styled(Icon).attrs(({ biometryType }) => ({
  name: biometryType.toLowerCase(),
  size: biometryType === BiometryTypes.passcode ? 19 : 20,
}))`
  margin-bottom: ${({ biometryType }) =>
    biometryType === BiometryTypes.passcode ? 1.5 : 0};
`;

const ButtonLabel = styled(Text).attrs({
  align: 'center',
  color: colors.white,
  size: 'large',
  weight: 'semibold',
})``;

const Container = styled(Column).attrs({
  align: 'center',
})`
  ${padding(80, 40, 0)};
  flex: 1;
`;

const Content = styled(Centered)`
  margin-bottom: 34;
  margin-top: 6;
  max-width: 265;
  padding-top: ${({ seedPhrase }) => (seedPhrase ? 34 : 0)};
`;

const ToggleSeedPhraseButton = styled(Button)`
  ${shadow.build(0, 5, 15, colors.purple, 0.3)}
  background-color: ${colors.appleBlue};
  width: 265;
`;

export default function BackupSection({ navigation }) {
  const initializeWallet = useInitializeWallet();
  const [seedPhrase, setSeedPhrase] = useState(null);
  const { selectedWallet } = useWallets();
  const [shouldRetry, setShouldRetry] = useState(true);
  const biometryType = useBiometryType();

  const hideSeedPhrase = () => setSeedPhrase(null);

  const logAndAttemptRestore = useCallback(
    async error => {
      if (!shouldRetry) {
        hideSeedPhrase();
        selectedWallet?.damaged && showWalletErrorAlert();
        return;
      }

      setShouldRetry(false);

      // 0 - Log the error if exists
      if (error) {
        logger.sentry(
          '[logAndAttemptRestore]: Error while revealing seed',
          error
        );
      }

      // 1 - Dump all keys anonymized
      try {
        const keysDump = await getAllKeysAnonymized();
        logger.sentry('[logAndAttemptRestore]: all keys', keysDump);
      } catch (e) {
        logger.sentry('Got error on getAllKeysAnonymized', e);
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
        const selectedWalletFromKeychain = await getSelectedWallet();
        logger.sentry(
          '[logAndAttemptRestore]: Keychain selectedWallet:',
          selectedWalletFromKeychain
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
        const allWallets = await getAllWallets();
        if (allWallets?.wallets) {
          logger.sentry('[logAndAttemptRestore]: Got all wallets');
        }

        // If we don't have the private key, let's try with the seed directly
        const walletId = selectedWallet?.id || keys(allWallets?.wallets)[0];
        logger.sentry('[logAndAttemptRestore] got wallet id', walletId);
        let seedData;
        try {
          seedData = await getSeedPhrase(walletId);
        } catch (e) {
          logger.sentry('Error on getSeedPhrase', e);
        }

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
          let res;
          try {
            res = await getPrivateKey(settings.accountAddress);
          } catch (e) {
            logger.sentry('Error on getPrivateKey', e);
          }
          if (res?.privateKey) {
            logger.sentry('[logAndAttemptRestore]: got private key');
            setSeedPhrase(res.privateKey);
            captureMessage('Rescued private key!');

            //Attempt to fix the broken state
            logger.sentry('[logAndAttemptRestore]: initializing wallet...');
            await initializeWallet(res.privateKey, null, null, false, true);
            captureMessage('Reimported private key sucessful');
          } else {
            selectedWallet?.damaged && showWalletErrorAlert();
            captureMessage('Pkey & Seed lookup failed');
          }
        }
      } catch (e) {
        selectedWallet?.damaged && showWalletErrorAlert();
        logger.sentry(
          '[logAndAttemptRestore] Got error while attempting to restore wallets',
          e
        );
      }
    },
    [initializeWallet, selectedWallet?.damaged, selectedWallet?.id, shouldRetry]
  );

  const handlePressToggleSeedPhrase = useCallback(async () => {
    if (!seedPhrase) {
      try {
        const keychainValue = await loadSeedPhraseAndMigrateIfNeeded(
          selectedWallet.id
        );
        if (!keychainValue) {
          logAndAttemptRestore();
        } else {
          setSeedPhrase(keychainValue);
          analytics.track('Viewed backup seed phrase text');
        }
      } catch (e) {
        logAndAttemptRestore(e);
      }
    } else {
      hideSeedPhrase();
    }
  }, [logAndAttemptRestore, seedPhrase, selectedWallet]);

  const showBiometryIcon =
    !seedPhrase &&
    (biometryType === BiometryTypes.passcode ||
      biometryType === BiometryTypes.TouchID);
  const showFaceIDCharacter =
    !seedPhrase && biometryType === BiometryTypes.FaceID;

  return (
    <Container>
      <BackupGraphic />
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
        <RowWithMargins align="center" justify="center" margin={9}>
          {showBiometryIcon && <BiometryIcon biometryType={biometryType} />}
          <ButtonLabel
            color="appleBlue"
            letterSpacing="rounded"
            weight="semibold"
          >
            {showFaceIDCharacter && '􀎽  '}
            {`${seedPhrase ? 'Hide' : 'Show'} Private Key`}
          </ButtonLabel>
        </RowWithMargins>
      </ToggleSeedPhraseButton>
    </Container>
  );
}

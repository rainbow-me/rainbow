import { captureException } from '@sentry/react-native';
import React, { useCallback } from 'react';
import { NativeModules, Platform } from 'react-native';
// eslint-disable-next-line import/default
import CodePush from 'react-native-code-push';
import RNFS from 'react-native-fs';
import { hasInternetCredentials } from 'react-native-keychain';
import Share from 'react-native-share';
import VersionNumber from 'react-native-version-number';
import styled from 'styled-components';
import { useSendFeedback } from '../../hooks';
import {
  getAllWallets,
  getSelectedWallet,
  loadAddress,
} from '../../model/wallet';
import store from '../../redux/store';
import { Button } from '../buttons';
import { Centered, Column } from '../layout';
import { Br, Emoji, Text } from '../text';
import { colors, padding, shadow } from '@rainbow-me/styles';
import { logger } from '@rainbow-me/utils';

const Content = styled(Centered)`
  margin-bottom: 34;
  margin-top: 25;
  max-width: 265;
`;

const SendAppLogsButton = styled(Button)`
  ${shadow.build(0, 5, 15, colors.purple, 0.3)}
  background-color: ${colors.appleBlue};
  width: 235;
`;

const SupportSection = () => {
  const onSendFeedback = useSendFeedback();

  const sendAppLogs = useCallback(async () => {
    // All redux state
    let reduxLogs = null;
    try {
      const seen = [];
      reduxLogs = JSON.stringify(
        store.getState(),
        // Required to ignore cyclic structures
        (key, val) => {
          if (val != null && typeof val == 'object') {
            if (seen.indexOf(val) >= 0) {
              return;
            }
            seen.push(val);
          }
          return val;
        },
        2
      );
    } catch (e) {
      console.log(e);
      return;
    }
    // All wallets keychain content
    let allWalletsLogs = '';
    try {
      const allWallets = await getAllWallets();
      allWalletsLogs = allWallets;
    } catch (e) {
      allWalletsLogs = e.name + ': ' + e.message;
    }

    // All wallets keychain content
    let selectedWalletLogs = '';
    try {
      const selectedWallet = await getSelectedWallet();
      selectedWalletLogs = selectedWallet;
    } catch (e) {
      selectedWalletLogs = e.name + ': ' + e.message;
    }

    // All wallets keychain content
    let keychainAddressLogs = '';
    try {
      const keychainAddress = await loadAddress();
      keychainAddressLogs = keychainAddress;
    } catch (e) {
      keychainAddressLogs = e.name + ': ' + e.message;
    }

    const hasMigratedFlag = await hasInternetCredentials(
      'rainbowSeedPhraseMigratedKey'
    );

    const hasOldSeedphrase = await hasInternetCredentials('rainbowSeedPhrase');

    let isRunningTestflight = false;
    if (NativeModules.RNTestFlight) {
      const { isTestFlight } = NativeModules.RNTestFlight.getConstants();
      if (isTestFlight) {
        isRunningTestflight = true;
      }
    }

    let codepushVersion = 'none';

    // eslint-disable-next-line no-unused-vars
    const [{ appVersion }, update] = await Promise.all([
      CodePush.getConfiguration(),
      CodePush.getUpdateMetadata(),
    ]);
    if (update) {
      codepushVersion = update.label.substring(1);
    }

    const appLogs = `
      Rainbow App logs
      ========================================
      App Version: ${VersionNumber.appVersion} (${VersionNumber.buildVersion})
      Is Testflight: ${isRunningTestflight}
      Codepush version: ${codepushVersion}

      ========================================

      REDUX STATE:
      
      ${reduxLogs}

      ========================================

      ALL WALLETS (KEYCHAIN):
      
      ${JSON.stringify(allWalletsLogs, null, 2)}

      ========================================

      SELECTED WALLET (KEYCHAIN):
      
      ${JSON.stringify(selectedWalletLogs, null, 2)}

      ========================================

      ADDRESS (KEYCHAIN):
      
      ${JSON.stringify(keychainAddressLogs, null, 2)}

      ========================================

      HAS MIGRATED FLAG (KEYCHAIN): ${hasMigratedFlag}

      ========================================


      HAS OLD SEEDPHRASE (KEYCHAIN): ${hasOldSeedphrase}
    
    `;
    console.log(appLogs);

    try {
      const path =
        RNFS.DocumentDirectoryPath +
        `/rainbow-logs-${VersionNumber.appVersion}(${VersionNumber.buildVersion}).json`;

      let url = null;
      if (Platform.OS === 'ios') {
        await RNFS.writeFile(path, appLogs, 'utf8');
        url = path;
      } else {
        url = `data:text/plain;base64,${new Buffer(appLogs).toString(
          'base64'
        )}`;
      }

      await Share.open({
        email: 'hello@rainbow.me',
        message: `Rainbow App Logs ${VersionNumber.appVersion} (${VersionNumber.buildVersion})`,
        subject: `Rainbow App Logs - ${VersionNumber.appVersion} (${VersionNumber.buildVersion})`,
        title: `Rainbow App Logs ${VersionNumber.appVersion} (${VersionNumber.buildVersion})`,
        url,
      });
    } catch (err) {
      logger.sentry('Error while exporting app logs');
      captureException(err);
    }
  }, []);

  return (
    <Column align="center" css={padding(80, 40, 0)} flex={1}>
      <Emoji name="raised_hands" size="h1" />
      <Text lineHeight="loosest" size="larger" weight="semibold">
        Support
      </Text>
      <Content>
        <Text
          align="center"
          color={colors.alpha(colors.blueGreyDark, 0.6)}
          lineHeight="loose"
          size="lmedium"
        >
          If you need help please reach out at{' '}
          <Text
            color={colors.appleBlue}
            onPress={onSendFeedback}
            weight="semibold"
          >
            hello@rainbow.me
          </Text>
          <Br />
          <Br />
          If you already reached out and we asked you to send us the app logs,
          please tap the button below, select your preferred email client and
          send us the email with the logs attached to{' '}
          <Text weight="bold">hello@rainbow.me</Text>
        </Text>
      </Content>
      <SendAppLogsButton onPress={sendAppLogs}>Send App logs</SendAppLogsButton>
    </Column>
  );
};

export default SupportSection;

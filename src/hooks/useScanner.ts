import { isValidAddress } from 'ethereumjs-util';
import lang from 'i18n-js';
import qs from 'qs';
import { useCallback, useEffect, useRef } from 'react';
import { InteractionManager } from 'react-native';
import URL from 'url-parse';
import { parseUri } from '@walletconnect/utils';
import { Alert } from '../components/alerts';
import useExperimentalFlag, { PROFILES } from '../config/experimentalHooks';
import { useNavigation } from '../navigation/Navigation';
import useWalletConnectConnections from './useWalletConnectConnections';
import { fetchReverseRecordWithRetry } from '@/utils/profileUtils';
import { analytics } from '@/analytics';
import {
  checkIsValidAddressOrDomain,
  isENSAddressFormat,
} from '@/helpers/validators';
import { Navigation } from '@/navigation';
import { POAP_BASE_URL, RAINBOW_PROFILES_BASE_URL } from '@/references';
import Routes from '@/navigation/routesNames';
import { addressUtils, ethereumUtils, haptics } from '@/utils';
import logger from '@/utils/logger';
import { checkPushNotificationPermissions } from '@/notifications/permissions';
import { pair as pairWalletConnect } from '@/walletConnect';
import {
  getPoapAndOpenSheetWithQRHash,
  getPoapAndOpenSheetWithSecretWord,
} from '@/utils/poaps';

export default function useScanner(enabled: boolean, onSuccess: () => unknown) {
  const { navigate, goBack } = useNavigation();
  const { walletConnectOnSessionRequest } = useWalletConnectConnections();
  const profilesEnabled = useExperimentalFlag(PROFILES);
  const enabledVar = useRef<boolean>();

  const enableScanning = useCallback(() => {
    logger.log('📠✅ Enabling QR Code Scanner');
    enabledVar.current = true;
  }, [enabledVar]);

  const disableScanning = useCallback(() => {
    logger.log('📠🚫 Disabling QR Code Scanner');
    enabledVar.current = false;
  }, [enabledVar]);

  useEffect(() => {
    if (enabled) {
      enableScanning();
    } else {
      disableScanning();
    }

    enabledVar.current = enabled;
  }, [enabled, disableScanning, enableScanning]);

  const handleScanEthereumUrl = useCallback((data: string) => {
    ethereumUtils.parseEthereumUrl(data);
  }, []);

  const handleScanAddress = useCallback(
    async (address: string) => {
      haptics.notificationSuccess();
      analytics.track('Scanned address QR code');
      const ensName = isENSAddressFormat(address)
        ? address
        : await fetchReverseRecordWithRetry(address);
      // First navigate to wallet screen
      navigate(Routes.WALLET_SCREEN);

      // And then navigate to Profile sheet
      InteractionManager.runAfterInteractions(() => {
        Navigation.handleAction(
          profilesEnabled ? Routes.PROFILE_SHEET : Routes.SHOWCASE_SHEET,
          {
            address: ensName || address,
            fromRoute: 'QR Code',
          }
        );

        setTimeout(onSuccess, 500);
      });
    },
    [navigate, onSuccess, profilesEnabled]
  );

  const handleScanRainbowProfile = useCallback(
    async (url: string) => {
      haptics.notificationSuccess();
      analytics.track('Scanned Rainbow profile url');

      const urlObj = new URL(url);
      const addressOrENS = urlObj.pathname?.split('/profile/')?.[1] || '';
      const isValid = await checkIsValidAddressOrDomain(addressOrENS);
      if (isValid) {
        const ensName = isENSAddressFormat(addressOrENS)
          ? addressOrENS
          : await fetchReverseRecordWithRetry(addressOrENS);
        // First navigate to wallet screen
        navigate(Routes.WALLET_SCREEN);

        // And then navigate to Profile sheet
        InteractionManager.runAfterInteractions(() => {
          Navigation.handleAction(
            profilesEnabled ? Routes.PROFILE_SHEET : Routes.SHOWCASE_SHEET,
            {
              address: ensName,
              fromRoute: 'QR Code',
            }
          );

          setTimeout(onSuccess, 500);
        });
      }
    },
    [navigate, onSuccess, profilesEnabled]
  );

  const handleScanWalletConnect = useCallback(
    async (uri: string, connector?: string) => {
      haptics.notificationSuccess();
      analytics.track('Scanned WalletConnect QR code');
      await checkPushNotificationPermissions();
      goBack();
      onSuccess();
      try {
        const { version } = parseUri(uri);
        if (version === 1) {
          await walletConnectOnSessionRequest(uri, connector, () => {});
        } else if (version === 2) {
          await pairWalletConnect({ uri, connector });
        }
      } catch (e) {
        logger.log('walletConnectOnSessionRequest exception', e);
      }
    },
    [goBack, onSuccess, walletConnectOnSessionRequest]
  );

  const handleScanInvalid = useCallback(
    (qrCodeData: string) => {
      haptics.notificationError();
      analytics.track('Scanned broken or unsupported QR code', { qrCodeData });

      Alert({
        buttons: [{ onPress: enableScanning, text: lang.t('button.okay') }],
        message: lang.t('wallet.qr.sorry_could_not_be_recognized'),
        title: lang.t('wallet.qr.unrecognized_qr_code_title'),
      });
    },
    [enableScanning]
  );

  const onScan = useCallback(
    async ({ data }: { data: string }) => {
      if (!data || !enabledVar.current) return null;

      disableScanning();

      // EIP 681 / 831
      if (data.startsWith('ethereum:')) {
        onSuccess();

        return handleScanEthereumUrl(data);
      }
      const address = await addressUtils.getEthereumAddressFromQRCodeData(data);
      // Ethereum address (no ethereum: prefix)
      if (
        data.startsWith('0x') &&
        address !== null &&
        isValidAddress(address)
      ) {
        return handleScanAddress(address);
      }
      // Walletconnect QR Code
      if (data.startsWith('wc:')) {
        return handleScanWalletConnect(data);
      }
      // Walletconnect via universal link
      const urlObj = new URL(data);
      if (
        urlObj?.protocol === 'https:' &&
        urlObj?.pathname?.split('/')?.[1] === 'wc'
      ) {
        // @ts-expect-error ts-migrate(2722) FIXME: Cannot invoke an object which is possibly 'undefin... Remove this comment to see the full error message
        const { uri, connector } = qs.parse(urlObj.query.substring(1));
        onSuccess();
        // @ts-expect-error The QS type is very broad. We could narrow it down but it's not worth it to not break current functionality
        return handleScanWalletConnect(uri, connector);
      }

      const lowerCaseData = data?.toLowerCase();

      // poap mints
      if (lowerCaseData.startsWith(`${POAP_BASE_URL}`)) {
        const secretWord = lowerCaseData.split(`${POAP_BASE_URL}`)?.[1];
        return getPoapAndOpenSheetWithSecretWord(secretWord, true);
      }

      if (lowerCaseData.startsWith(`https://collectors.poap.xyz/mint/`)) {
        const qrHash = lowerCaseData.split(
          'https://collectors.poap.xyz/mint/'
        )?.[1];
        return getPoapAndOpenSheetWithQRHash(qrHash, true);
      }

      if (lowerCaseData.startsWith(`https://poap.xyz/claim/`)) {
        const qrHash = lowerCaseData.split('https://poap.xyz/claim/')?.[1];
        return getPoapAndOpenSheetWithQRHash(qrHash, true);
      }

      if (lowerCaseData.startsWith(`https://app.poap.xyz/claim/`)) {
        const qrHash = lowerCaseData.split('https://app.poap.xyz/claim/')?.[1];
        return getPoapAndOpenSheetWithQRHash(qrHash, true);
      }

      if (lowerCaseData.startsWith(`${RAINBOW_PROFILES_BASE_URL}/poap`)) {
        const secretWordOrQrHash = lowerCaseData.split(
          `${RAINBOW_PROFILES_BASE_URL}/poap/`
        )?.[1];
        logger.log('onScan: handling poap scan', { secretWordOrQrHash });
        await getPoapAndOpenSheetWithSecretWord(secretWordOrQrHash, true);
        return getPoapAndOpenSheetWithQRHash(secretWordOrQrHash, true);
      }

      if (lowerCaseData.startsWith(`rainbow://poap`)) {
        const secretWordOrQrHash = lowerCaseData.split(`rainbow://poap/`)?.[1];
        logger.log('onScan: handling poap scan', { secretWordOrQrHash });
        await getPoapAndOpenSheetWithSecretWord(secretWordOrQrHash, true);
        return getPoapAndOpenSheetWithQRHash(secretWordOrQrHash, true);
      }

      // Rainbow profile QR code
      if (data.startsWith(RAINBOW_PROFILES_BASE_URL)) {
        return handleScanRainbowProfile(data);
      }
      return handleScanInvalid(data);
    },
    [
      disableScanning,
      handleScanInvalid,
      onSuccess,
      handleScanEthereumUrl,
      handleScanAddress,
      handleScanWalletConnect,
      handleScanRainbowProfile,
    ]
  );

  return {
    onScan,
  };
}

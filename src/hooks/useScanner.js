import analytics from '@segment/analytics-react-native';
import { isValidAddress } from 'ethereumjs-util';
import lang from 'i18n-js';
import qs from 'qs';
import { useCallback, useEffect } from 'react';
import { InteractionManager } from 'react-native';
import URL from 'url-parse';
import { Alert } from '../components/alerts';
import { checkPushNotificationPermissions } from '../model/firebase';
import { useNavigation } from '../navigation/Navigation';
import useWalletConnectConnections from './useWalletConnectConnections';
import { handleQRScanner } from '@rainbow-me/handlers/fedora';
import { checkIsValidAddressOrDomain } from '@rainbow-me/helpers/validators';
import { Navigation } from '@rainbow-me/navigation';
import { RAINBOW_PROFILES_BASE_URL } from '@rainbow-me/references';
import Routes from '@rainbow-me/routes';
import { addressUtils, ethereumUtils, haptics } from '@rainbow-me/utils';
import logger from 'logger';

export default function useScanner(enabled, onSuccess) {
  const { navigate } = useNavigation();
  const { walletConnectOnSessionRequest } = useWalletConnectConnections();
  const enabledVar = useRef();

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

  const handleScanEthereumUrl = useCallback(data => {
    ethereumUtils.parseEthereumUrl(data);
  }, []);

  const handleScanAddress = useCallback(
    address => {
      haptics.notificationSuccess();
      analytics.track('Scanned address QR code');

      // First navigate to wallet screen
      navigate(Routes.WALLET_SCREEN);

      // And then navigate to Showcase sheet
      InteractionManager.runAfterInteractions(() => {
        Navigation.handleAction(Routes.SHOWCASE_SHEET, {
          address,
        });

        setTimeout(onSuccess, 500);
      });
    },
    [navigate, onSuccess]
  );

  const handleScanRainbowProfile = useCallback(
    async url => {
      haptics.notificationSuccess();
      analytics.track('Scanned Rainbow profile url');

      const urlObj = new URL(url);
      const addressOrENS = urlObj.pathname?.split('/')?.[1] || '';
      const isValid = await checkIsValidAddressOrDomain(addressOrENS);
      if (isValid) {
        // First navigate to wallet screen
        navigate(Routes.WALLET_SCREEN);

        // And then navigate to Showcase sheet
        InteractionManager.runAfterInteractions(() => {
          Navigation.handleAction(Routes.SHOWCASE_SHEET, {
            address: addressOrENS,
          });

          setTimeout(onSuccess, 500);
        });
      }
    },
    [navigate, onSuccess]
  );

  const handleScanWalletConnect = useCallback(
    async qrCodeData => {
      haptics.notificationSuccess();
      analytics.track('Scanned WalletConnect QR code');
      await checkPushNotificationPermissions();

      onSuccess();
      try {
        await walletConnectOnSessionRequest(qrCodeData, () => {});
      } catch (e) {
        logger.log('walletConnectOnSessionRequest exception', e);
      }
    },
    [walletConnectOnSessionRequest, onSuccess]
  );

  const handleScanInvalid = useCallback(
    qrCodeData => {
      haptics.notificationError();
      analytics.track('Scanned broken or unsupported QR code', { qrCodeData });

      Alert({
        buttons: [{ onPress: enableScanning, text: lang.t('button.okay') }],
        message: lang.t('wallet.unrecognized_qrcode'),
        title: lang.t('wallet.unrecognized_qrcode_title'),
      });
    },
    [enableScanning]
  );

  const onScan = useCallback(
    async ({ data }) => {
      if (!data || !enabledVar.current) return null;

      disableScanning();

      // EIP 681 / 831
      if (data.startsWith('ethereum:')) {
        onSuccess();

        return handleScanEthereumUrl(data);
      }
      const address = await addressUtils.getEthereumAddressFromQRCodeData(data);
      // Ethereum address (no ethereum: prefix)
      if (data.startsWith('0x') && isValidAddress(address)) {
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
        const { uri } = qs.parse(urlObj.query.substring(1));
        onSuccess();
        return handleScanWalletConnect(uri);
      }
      // Rainbow profile QR code
      if (data.startsWith(RAINBOW_PROFILES_BASE_URL)) {
        return handleScanRainbowProfile(data);
      }

      const isHandled = handleQRScanner(data);

      if (isHandled) {
        return;
      }

      return handleScanInvalid(data);
    },
    [
      disableScanning,
      onSuccess,
      handleScanWalletConnect,
      handleScanInvalid,
      handleScanEthereumUrl,
      handleScanAddress,
      handleScanRainbowProfile,
    ]
  );

  return {
    onScan,
  };
}

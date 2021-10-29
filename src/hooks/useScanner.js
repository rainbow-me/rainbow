import analytics from '@segment/analytics-react-native';
import { isValidAddress } from 'ethereumjs-util';
import lang from 'i18n-js';
import qs from 'qs';
import { useCallback, useEffect, useState } from 'react';
import { InteractionManager } from 'react-native';
import { PERMISSIONS, request } from 'react-native-permissions';
import URL from 'url-parse';
import { Alert } from '../components/alerts';
import { checkPushNotificationPermissions } from '../model/firebase';
import { useNavigation } from '../navigation/Navigation';
import usePrevious from './usePrevious';
import useWalletConnectConnections from './useWalletConnectConnections';
import { checkIsValidAddressOrDomain } from '@rainbow-me/helpers/validators';
import { Navigation } from '@rainbow-me/navigation';
import { RAINBOW_PROFILES_BASE_URL } from '@rainbow-me/references';
import Routes from '@rainbow-me/routes';
import { addressUtils, ethereumUtils, haptics } from '@rainbow-me/utils';
import logger from 'logger';

function useScannerState(enabled) {
  const [isCameraAuthorized, setIsCameraAuthorized] = useState(true);
  const [isScanningEnabled, setIsScanningEnabled] = useState(enabled);
  const wasEnabled = usePrevious(enabled);

  useEffect(() => {
    setIsScanningEnabled(enabled);
  }, [enabled]);

  const disableScanning = useCallback(() => {
    logger.log('📠🚫 Disabling QR Code Scanner');
    setIsScanningEnabled(false);
  }, []);

  const enableScanning = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      logger.log('📠✅ Enabling QR Code Scanner');
      setIsScanningEnabled(enabled);
    });
  }, [enabled]);

  useEffect(() => {
    if (enabled && !wasEnabled && ios) {
      request(PERMISSIONS.IOS.CAMERA)
        .then(permission => {
          const result = permission === 'granted';
          if (isCameraAuthorized !== result) {
            setIsCameraAuthorized(result);
          }
        })
        .catch(e => {
          logger.log('ERROR REQUESTING CAM PERMISSION', e);
        });

      if (!isScanningEnabled) {
        enableScanning();
      }
    }
  }, [
    enabled,
    enableScanning,
    isCameraAuthorized,
    isScanningEnabled,
    wasEnabled,
  ]);

  return {
    disableScanning,
    enableScanning,
    isCameraAuthorized,
    isScanningEnabled,
  };
}

export default function useScanner(enabled) {
  const { navigate } = useNavigation();
  const { walletConnectOnSessionRequest } = useWalletConnectConnections();

  const {
    disableScanning,
    enableScanning,
    isCameraAuthorized,
    isScanningEnabled,
  } = useScannerState(enabled);

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
      });

      setTimeout(enableScanning, 2500);
    },
    [enableScanning, navigate]
  );

  const handleScanRainbowProfile = useCallback(
    url => {
      haptics.notificationSuccess();
      analytics.track('Scanned Rainbow profile url');

      const urlObj = new URL(url);
      const addressOrENS = urlObj.pathname?.split('/')?.[1] || '';
      if (checkIsValidAddressOrDomain(addressOrENS)) {
        // First navigate to wallet screen
        navigate(Routes.WALLET_SCREEN);

        // And then navigate to Showcase sheet
        InteractionManager.runAfterInteractions(() => {
          Navigation.handleAction(Routes.SHOWCASE_SHEET, {
            address: addressOrENS,
          });
        });
      }
      setTimeout(enableScanning, 2500);
    },
    [enableScanning, navigate]
  );

  const handleScanWalletConnect = useCallback(
    async qrCodeData => {
      haptics.notificationSuccess();
      analytics.track('Scanned WalletConnect QR code');
      await checkPushNotificationPermissions();

      try {
        await walletConnectOnSessionRequest(qrCodeData, () => {
          setTimeout(enableScanning, 2000);
        });
      } catch (e) {
        logger.log('walletConnectOnSessionRequest exception', e);
        setTimeout(enableScanning, 2000);
      }
    },
    [enableScanning, walletConnectOnSessionRequest]
  );

  const handleScanInvalid = useCallback(
    qrCodeData => {
      haptics.notificationError();
      analytics.track('Scanned broken or unsupported QR code', { qrCodeData });
      return Alert({
        callback: enableScanning,
        message: lang.t('wallet.unrecognized_qrcode'),
        title: lang.t('wallet.unrecognized_qrcode_title'),
      });
    },
    [enableScanning]
  );

  const onScan = useCallback(
    async ({ data }) => {
      if (!data || !isScanningEnabled) return null;
      disableScanning();
      // EIP 681 / 831
      if (data.startsWith('ethereum:')) {
        return handleScanEthereumUrl(data);
      }
      const address = await addressUtils.getEthereumAddressFromQRCodeData(data);
      // Ethereum address (no ethereum: prefix)
      if (data.startsWith('0x') && isValidAddress(address)) {
        return handleScanAddress(address);
      }
      // Walletconnect QR Code
      if (data.startsWith('wc:')) return handleScanWalletConnect(data);
      // Walletconnect via universal link
      const urlObj = new URL(data);
      if (
        urlObj?.protocol === 'https:' &&
        urlObj?.pathname?.split('/')?.[1] === 'wc'
      ) {
        const { uri } = qs.parse(urlObj.query.substring(1));
        return handleScanWalletConnect(uri);
      }
      // Rainbow profile QR code
      if (data.startsWith(RAINBOW_PROFILES_BASE_URL)) {
        return handleScanRainbowProfile(data);
      }
      return handleScanInvalid(data);
    },
    [
      isScanningEnabled,
      disableScanning,
      handleScanWalletConnect,
      handleScanInvalid,
      handleScanEthereumUrl,
      handleScanAddress,
      handleScanRainbowProfile,
    ]
  );

  return {
    isCameraAuthorized,
    onScan,
  };
}

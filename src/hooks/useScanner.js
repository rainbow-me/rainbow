import analytics from '@segment/analytics-react-native';
import lang from 'i18n-js';
import { useCallback, useEffect, useState } from 'react';
import { InteractionManager, Alert as NativeAlert } from 'react-native';
import { PERMISSIONS, request } from 'react-native-permissions';
import { Alert } from '../components/alerts';
import isNativeStackAvailable from '../helpers/isNativeStackAvailable';
import { checkPushNotificationPermissions } from '../model/firebase';
import { useNavigation } from '../navigation/Navigation';
import usePrevious from './usePrevious';
import useWalletConnectConnections from './useWalletConnectConnections';
import useWallets from './useWallets';
import Routes from '@rainbow-me/routes';
import { addressUtils, haptics } from '@rainbow-me/utils';
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
      request(PERMISSIONS.IOS.CAMERA).then(permission => {
        const result = permission === 'granted';
        if (isCameraAuthorized !== result) {
          setIsCameraAuthorized(result);
        }
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
  const { isReadOnlyWallet } = useWallets();
  const { walletConnectOnSessionRequest } = useWalletConnectConnections();

  const {
    disableScanning,
    enableScanning,
    isCameraAuthorized,
    isScanningEnabled,
  } = useScannerState(enabled);

  const handleScanAddress = useCallback(
    address => {
      if (isReadOnlyWallet) {
        NativeAlert.alert(`You need to import the wallet in order to do this`);
        return null;
      }

      haptics.notificationSuccess();
      analytics.track('Scanned address QR code');

      // First navigate to wallet screen
      navigate(Routes.WALLET_SCREEN);

      // And then navigate to Send sheet
      if (isNativeStackAvailable || android) {
        navigate(Routes.SEND_FLOW, {
          params: { address },
          screen: Routes.SEND_SHEET,
        });
      } else {
        navigate(Routes.SEND_FLOW, { address });
      }

      setTimeout(enableScanning, 1000);
    },
    [enableScanning, isReadOnlyWallet, navigate]
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
      const address = await addressUtils.getEthereumAddressFromQRCodeData(data);
      if (address) return handleScanAddress(address);
      if (data.startsWith('wc:')) return handleScanWalletConnect(data);
      return handleScanInvalid(data);
    },
    [
      handleScanAddress,
      handleScanInvalid,
      handleScanWalletConnect,
      isScanningEnabled,
      disableScanning,
    ]
  );

  return {
    isCameraAuthorized,
    onScan,
  };
}

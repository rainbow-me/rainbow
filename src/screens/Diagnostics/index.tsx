import { useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { loadAllKeys } from '@/model/keychain';
import { useNavigation } from '@/navigation';
import { privateKeyKey, seedPhraseKey } from '@/utils/keychainConstants';
import AesEncryptor from '@/handlers/aesEncryption';
import { authenticateWithPINAndCreateIfNeeded } from '@/handlers/authentication';
import { useWalletsWithBalancesAndNames } from '@/hooks';
import Routes from '@/navigation/routesNames';
import { logger, RainbowError } from '@/logger';
import { deriveAccountFromWalletInput } from '@/utils/wallet';
import { getDeviceId } from '@/analytics/utils';
import { UserCredentials } from 'react-native-keychain';
import { DiagnosticsContent } from '@/screens/Diagnostics/DiagnosticsContent';
import { BackgroundProvider, Box } from '@/design-system';
import { Toast, ToastPositionContainer } from '@/components/toasts';
import * as i18n from '@/languages';
import { createAndShareStateDumpFile } from './helpers/createAndShareStateDumpFile';
import { haptics } from '@/utils';
import Clipboard from '@react-native-clipboard/clipboard';
import { SimpleSheet } from '@/components/sheet/SimpleSheet';

const encryptor = new AesEncryptor();

export const WalletDiagnosticsSheet = () => {
  const { navigate, goBack } = useNavigation();
  const { params } = useRoute<any>();

  const [keys, setKeys] = useState<UserCredentials[] | undefined>();
  const [userPin, setUserPin] = useState(params?.userPin);
  const [pinRequired, setPinRequired] = useState(false);
  const [uuid, setUuid] = useState<string | undefined>();
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimeout = useRef<NodeJS.Timeout>();

  const walletsWithBalancesAndNames = useWalletsWithBalancesAndNames();

  useEffect(() => {
    const init = async () => {
      try {
        // get and set uuid
        const userIdentifier = getDeviceId();
        setUuid(userIdentifier);

        // get wallet and set wallet data
        const allKeys = await loadAllKeys();
        if (allKeys) {
          const processedKeys = await Promise.all(
            allKeys
              .filter(key => {
                return key?.username?.indexOf(seedPhraseKey) !== -1 || key?.username?.indexOf(privateKeyKey) !== -1;
              })
              .map(async key => {
                const secretObj = JSON.parse(key.password);
                let secret = secretObj.seedphrase || secretObj.privateKey;
                if ((secret && secret.indexOf('cipher') === -1 && secret.indexOf('salt') === -1) || userPin) {
                  if (userPin) {
                    secret = await encryptor.decrypt(userPin, secret);
                  }
                  const { address, type } = await deriveAccountFromWalletInput(secret);
                  let createdAt = null;
                  let label = null;
                  Object.keys(walletsWithBalancesAndNames).some(k => {
                    const found = walletsWithBalancesAndNames[k].addresses.some(account => {
                      if (account?.address?.toLowerCase() === address?.toLowerCase()) {
                        label = account.label || account.ens;
                        return true;
                      }
                      return false;
                    });
                    return found;
                  });

                  if (key?.username?.indexOf(`_${seedPhraseKey}`) !== -1) {
                    const tsString = key.username.replace('wallet_', '').replace(`_${seedPhraseKey}`, '');
                    const ts = new Date(Number(tsString));
                    createdAt = ts.toString();
                  }

                  return {
                    ...key,
                    address,
                    createdAt,
                    label,
                    secret,
                    type,
                  };
                } else {
                  if (!pinRequired) {
                    setPinRequired(true);
                  }
                  return {
                    ...key,
                    address: '-',
                    createdAt: '-',
                    pinRequired: true,
                    secret: '',
                  };
                }
              })
          );
          setKeys(processedKeys);
        }
      } catch (error) {
        logger.error(new RainbowError('Error processing keys for wallet diagnostics'), {
          message: (error as Error).message,
          context: 'init',
        });
      }
    };
    setTimeout(() => {
      init();
    }, 2000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPin]);

  const seeds = useMemo(() => keys?.filter(key => key.username.indexOf(`_${seedPhraseKey}`) !== -1), [keys]);

  const pkeys = useMemo(() => keys?.filter(key => key.username.indexOf(`_${privateKeyKey}`) !== -1), [keys]);

  const oldSeed = useMemo(() => keys?.filter(key => key.username === seedPhraseKey) || [], [keys]);

  const handleClose = useCallback(() => {
    goBack();
  }, [goBack]);

  const handleAuthenticateWithPIN = useCallback(async () => {
    try {
      const pin = await authenticateWithPINAndCreateIfNeeded();
      setUserPin(pin);
      // This is a hack because we currently don't
      // support showing the PIN screen on top of certain sheets
      setTimeout(() => {
        navigate(Routes.DIAGNOSTICS_SHEET, {
          userPin: pin,
        });
      }, 500);
    } catch (e) {
      return null;
    }
  }, [navigate]);

  const copyUUID = () => {
    if (uuid) {
      haptics.notificationSuccess();
      Clipboard.setString(uuid);
      presentToast();
    }
  };

  const presentToast = () => {
    setToastVisible(true);
    if (toastTimeout.current) {
      clearTimeout(toastTimeout.current);
    }
    toastTimeout.current = setTimeout(() => {
      setToastVisible(false);
    }, 2000);
  };

  const shareApplicationStateDump = () => {
    createAndShareStateDumpFile();
  };

  return (
    <>
      <BackgroundProvider color="surfacePrimaryElevated">
        {({ backgroundColor }) => (
          <SimpleSheet backgroundColor={(backgroundColor as string) ?? 'white'}>
            <Box padding="20px">
              <DiagnosticsContent
                keys={keys}
                oldSeed={oldSeed}
                pinRequired={pinRequired}
                pkeys={pkeys}
                seeds={seeds}
                userPin={userPin}
                uuid={uuid}
                onPinAuth={handleAuthenticateWithPIN}
                onClose={handleClose}
                copyUUID={copyUUID}
                presentToast={presentToast}
                shareAppState={shareApplicationStateDump}
              />
            </Box>
          </SimpleSheet>
        )}
      </BackgroundProvider>
      <ToastPositionContainer>
        <Toast isVisible={toastVisible} text={i18n.t(i18n.l.wallet.diagnostics.uuid_copied)} testID="uuid-copied-toast" />
      </ToastPositionContainer>
    </>
  );
};

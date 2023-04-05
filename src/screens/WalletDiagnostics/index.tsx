import { useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SlackSheet } from '../../components/sheet';
import { loadAllKeys } from '@/model/keychain';
import { useNavigation } from '@/navigation';
import { privateKeyKey, seedPhraseKey } from '@/utils/keychainConstants';
import AesEncryptor from '@/handlers/aesEncryption';
import { authenticateWithPINAndCreateIfNeeded } from '@/handlers/authentication';
import { useDimensions, useWalletsWithBalancesAndNames } from '@/hooks';
import Routes from '@rainbow-me/routes';
import { logger, RainbowError } from '@/logger';
import { deriveAccountFromWalletInput } from '@/utils/wallet';
import { getDeviceId } from '@/analytics/utils';
import { IS_ANDROID, IS_IOS } from '@/env';
import { UserCredentials } from 'react-native-keychain';
import { WalletDiagnosticsContent } from '@/screens/WalletDiagnostics/WalletDiagnosticsContent';

const encryptor = new AesEncryptor();

export const WalletDiagnosticsSheet = () => {
  const { height: deviceHeight } = useDimensions();
  const { navigate, goBack } = useNavigation();
  const { params } = useRoute<any>();

  const [keys, setKeys] = useState<UserCredentials[] | undefined>();
  const [userPin, setUserPin] = useState(params?.userPin);
  const [pinRequired, setPinRequired] = useState(false);
  const [uuid, setUuid] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  const walletsWithBalancesAndNames = useWalletsWithBalancesAndNames();

  useEffect(() => {
    const init = async () => {
      setLoading(true);
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
                return (
                  key?.username?.indexOf(seedPhraseKey) !== -1 ||
                  key?.username?.indexOf(privateKeyKey) !== -1
                );
              })
              .map(async key => {
                const secretObj = JSON.parse(key.password);
                let secret = secretObj.seedphrase || secretObj.privateKey;
                if (
                  (secret.indexOf('cipher') === -1 &&
                    secret.indexOf('salt') === -1) ||
                  userPin
                ) {
                  if (userPin) {
                    secret = await encryptor.decrypt(userPin, secret);
                  }
                  const { address, type } = await deriveAccountFromWalletInput(
                    secret
                  );
                  let createdAt = null;
                  let label = null;
                  Object.keys(walletsWithBalancesAndNames).some(k => {
                    const found = walletsWithBalancesAndNames[k].addresses.some(
                      account => {
                        if (
                          account?.address?.toLowerCase() ===
                          address?.toLowerCase()
                        ) {
                          label = account.label || account.ens;
                          return true;
                        }
                        return false;
                      }
                    );
                    return found;
                  });

                  if (key?.username?.indexOf(`_${seedPhraseKey}`) !== -1) {
                    const tsString = key.username
                      .replace('wallet_', '')
                      .replace(`_${seedPhraseKey}`, '');
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
        logger.error(
          new RainbowError('Error processing keys for wallet diagnostics'),
          { message: (error as Error).message, context: 'init' }
        );
      } finally {
        setLoading(false);
      }
    };
    setTimeout(() => {
      init();
    }, 2000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const seeds = useMemo(
    () => keys?.filter(key => key.username.indexOf(`_${seedPhraseKey}`) !== -1),
    [keys]
  );

  const pkeys = useMemo(
    () => keys?.filter(key => key.username.indexOf(`_${privateKeyKey}`) !== -1),
    [keys]
  );

  const oldSeed = useMemo(
    () => keys?.filter(key => key.username === seedPhraseKey) || [],
    [keys]
  );

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
        navigate(Routes.WALLET_DIAGNOSTICS_SHEET, {
          userPin: pin,
        });
      }, 300);
    } catch (e) {
      return null;
    }
  }, [navigate]);

  return (
    // @ts-expect-error JS component
    <SlackSheet
      additionalTopPadding={IS_ANDROID}
      {...(IS_IOS
        ? { height: '100%' }
        : { additionalTopPadding: true, contentHeight: deviceHeight - 40 })}
      scrollEnabled
    >
      <WalletDiagnosticsContent
        keys={keys}
        oldSeed={oldSeed}
        pinRequired={pinRequired}
        pkeys={pkeys}
        seeds={seeds}
        userPin={userPin}
        uuid={uuid}
        onPinAuth={handleAuthenticateWithPIN}
        onClose={handleClose}
      />
    </SlackSheet>
  );
};

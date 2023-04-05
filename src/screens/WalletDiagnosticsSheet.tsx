import Clipboard from '@react-native-community/clipboard';
import { useRoute } from '@react-navigation/native';
import { captureException } from '@sentry/react-native';
import lang from 'i18n-js';
import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { TextInput, View } from 'react-native';
// @ts-expect-error untyped JS library
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';
import ActivityIndicator from '../components/ActivityIndicator';
import Divider from '../components/Divider';
import Spinner from '../components/Spinner';
import { ButtonPressAnimation } from '../components/animations';
import {
  Centered,
  Column,
  ColumnWithMargins,
  Row,
  RowWithMargins,
} from '../components/layout';
import { SheetActionButton, SheetTitle, SlackSheet } from '../components/sheet';
import { Bold, Text } from '../components/text';
import { loadAllKeys } from '@/model/keychain';
import { useNavigation } from '@/navigation';
import { privateKeyKey, seedPhraseKey } from '@/utils/keychainConstants';
import { WrappedAlert as Alert } from '@/helpers/alert';
import AesEncryptor from '@/handlers/aesEncryption';
import { authenticateWithPINAndCreateIfNeeded } from '@/handlers/authentication';
import {
  useDimensions,
  useImportingWallet,
  useWalletsWithBalancesAndNames,
} from '@/hooks';
import Routes from '@/navigation/routesNames';
import { haptics } from '@/utils';
import { logger, RainbowError } from '@/logger';
import { deriveAccountFromWalletInput } from '@/utils/wallet';
import { getDeviceId } from '@/analytics/utils';
import { useTheme } from '@/theme';
import { IS_ANDROID, IS_IOS } from '@/env';
import { UserCredentials } from 'react-native-keychain';

const LoadingSpinner = IS_ANDROID ? Spinner : ActivityIndicator;
const encryptor = new AesEncryptor();

const SecretInput = ({ value, color }: { value: string; color: string }) => {
  const { colors } = useTheme();
  const handleCopy = useCallback(() => {
    Alert.alert(
      lang.t('wallet.diagnostics.secret.reminder_title'),
      lang.t('wallet.diagnostics.secret.these_words_are_for_your_eyes_only'),
      [
        {
          onPress: () => {
            Clipboard.setString(value);
            haptics.notificationSuccess();
          },
          text: lang.t('wallet.diagnostics.secret.okay_i_understand'),
        },
        {
          onPress: undefined,
          style: 'cancel',
          text: lang.t('button.cancel'),
        },
      ]
    );
  }, [value]);
  return (
    <Row justify="space-between" width="100%">
      <TextInput
        // @ts-expect-error probably a valid prop but not typed properly
        disabled
        editable={false}
        secureTextEntry
        selectTextOnFocus
        style={{ width: '65%', color }}
        value={value}
      />
      <ButtonPressAnimation onPress={handleCopy}>
        <Row
          backgroundColor={colors.appleBlue}
          borderRadius={15}
          style={{ paddingHorizontal: android ? 10 : 15, paddingVertical: 10 }}
          width="100%"
        >
          <Text align="center" color={colors.whiteLabel} weight="bold">
            {lang.t('wallet.diagnostics.secret.copy_secret')}
          </Text>
        </Row>
      </ButtonPressAnimation>
    </Row>
  );
};

const ItemRow = ({ data }: any) => {
  const { colors } = useTheme();
  const {
    busy,
    handleSetSeedPhrase,
    handlePressImportButton,
  } = useImportingWallet();

  const handlePressRestore = useCallback(async () => {
    if (busy) return;
    Alert.alert(
      lang.t('wallet.diagnostics.restore.heads_up_title'),
      lang.t('wallet.diagnostics.restore.this_action_will_completely_replace'),
      [
        {
          onPress: async () => {
            try {
              handleSetSeedPhrase(data.secret);
              // @ts-expect-error poorly typed function
              await handlePressImportButton(null, data.secret);
            } catch (error) {
              logger.error(
                new RainbowError('Error restoring from wallet diagnostics'),
                {
                  message: (error as Error).message,
                  context: 'restore',
                }
              );
            }
          },
          text: lang.t('wallet.diagnostics.restore.yes_i_understand'),
        },
        {
          style: 'cancel',
          text: lang.t('button.cancel'),
        },
      ]
    );
  }, [busy, data.secret, handlePressImportButton, handleSetSeedPhrase]);

  if (data.pinRequired) {
    return (
      <ColumnWithMargins key={`key_${data.username}`}>
        <RowWithMargins>
          <Text size="lmedium">
            <Bold>{lang.t('wallet.diagnostics.restore.key')}:</Bold> {` `}
            <Text color={colors.blueGreyDark50}>{data.username}</Text>
          </Text>
        </RowWithMargins>
      </ColumnWithMargins>
    );
  }

  return (
    <ColumnWithMargins key={`key_${data.username}`}>
      <RowWithMargins>
        <Text size="lmedium">
          <Bold>{lang.t('wallet.diagnostics.restore.type')}:</Bold> {` `}
          <Text color={colors.blueGreyDark50}>{data.type}</Text>
        </Text>
      </RowWithMargins>
      <RowWithMargins>
        <Text size="lmedium">
          <Bold>{lang.t('wallet.diagnostics.restore.key')}:</Bold> {` `}
          <Text color={colors.blueGreyDark50}>{data.username}</Text>
        </Text>
      </RowWithMargins>
      {data.createdAt && (
        <RowWithMargins>
          <Text size="lmedium">
            <Bold>{lang.t('wallet.diagnostics.restore.created_at')}:</Bold>{' '}
            {` `}
            <Text color={colors.blueGreyDark50}>{data.createdAt}</Text>
          </Text>
        </RowWithMargins>
      )}
      {data.label && (
        <RowWithMargins>
          <Text size="lmedium">
            <Bold>{lang.t('wallet.diagnostics.restore.label')}:</Bold> {` `}
            <Text color={colors.blueGreyDark50}>{data.label}</Text>
          </Text>
        </RowWithMargins>
      )}
      <RowWithMargins>
        <Text size="lmedium">
          <Bold>{lang.t('wallet.diagnostics.restore.address')}:</Bold> {` `}
          <Text color={colors.blueGreyDark50}>{data.address}</Text>
        </Text>
      </RowWithMargins>
      <Text size="lmedium">
        <Bold>{lang.t('wallet.diagnostics.restore.secret')}:</Bold> {` `}
      </Text>
      <RowWithMargins>
        <SecretInput color={colors.blueGreyDark} value={data.secret} />
      </RowWithMargins>
      <ButtonPressAnimation onPress={handlePressRestore}>
        <View
          style={{
            paddingHorizontal: 15,
            paddingVertical: 10,
            backgroundColor: colors.dpiMid,
            borderRadius: 15,
          }}
        >
          <Text align="center" color={colors.whiteLabel} weight="bold">
            {lang.t('wallet.diagnostics.restore.restore')}
          </Text>
        </View>
      </ButtonPressAnimation>
      {/* @ts-expect-error JS component */}
      <Divider />
    </ColumnWithMargins>
  );
};

const WalletDiagnosticsSheet = () => {
  const { height: deviceHeight } = useDimensions();
  const { colors } = useTheme();
  const { navigate, goBack } = useNavigation();
  const [keys, setKeys] = useState<UserCredentials[] | undefined>();
  const { params } = useRoute<any>();
  const [userPin, setUserPin] = useState(params?.userPin);
  const [pinRequired, setPinRequired] = useState(false);
  const walletsWithBalancesAndNames = useWalletsWithBalancesAndNames();
  const [uuid, setUuid] = useState<string | undefined>();

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
      <ColumnWithMargins
        margin={15}
        style={{
          paddingBottom: IS_IOS ? 60 : 40 + getSoftMenuBarHeight(),
          paddingHorizontal: 19,
          paddingTop: 19,
          width: '100%',
        }}
      >
        {/* @ts-expect-error JS component */}
        <SheetTitle align="center" size="big" weight="heavy">
          {lang.t('wallet.diagnostics.wallet_diagnostics_title')}
        </SheetTitle>

        {!keys && (
          <Centered flex={1} height={300}>
            {/* @ts-expect-error JS component */}
            <LoadingSpinner />
          </Centered>
        )}

        {IS_ANDROID && keys && pinRequired && !userPin && (
          <ColumnWithMargins>
            <Text align="center">
              {lang.t(
                'wallet.diagnostics.you_need_to_authenticate_with_your_pin'
              )}
            </Text>
            <SheetActionButton
              color={colors.alpha(colors.green, 0.06)}
              isTransparent
              label={lang.t('wallet.diagnostics.authenticate_with_pin')}
              onPress={handleAuthenticateWithPIN}
              size="big"
              style={{ margin: 0, padding: 0 }}
              textColor={colors.green}
              weight="heavy"
            />
          </ColumnWithMargins>
        )}

        {uuid && (
          <Fragment>
            <ColumnWithMargins>
              <RowWithMargins>
                <Text size="lmedium">
                  <Bold>{lang.t('wallet.diagnostics.uuid')}:</Bold> {` `}
                  <Text color={colors.blueGreyDark50}>{uuid}</Text>
                </Text>
              </RowWithMargins>
            </ColumnWithMargins>
            {/* @ts-expect-error JS component */}
            <Divider />
          </Fragment>
        )}

        {seeds?.length !== undefined && seeds.length > 0 && (
          <Fragment>
            <Column>
              {seeds.map(key => (
                <ItemRow data={key} key={`row_${key.username}`} />
              ))}
            </Column>
          </Fragment>
        )}

        {pkeys?.length !== undefined && pkeys.length > 0 && (
          <Fragment>
            <Column>
              {pkeys?.map(key => (
                <ItemRow data={key} key={`row_${key.username}`} />
              ))}
            </Column>
          </Fragment>
        )}

        {keys?.length !== undefined && keys.length > 0 && (
          <Fragment>
            <Column>
              {oldSeed?.map(key => (
                <ItemRow data={key} key={`row_${key.username}`} />
              ))}
            </Column>
          </Fragment>
        )}

        {keys && (
          <SheetActionButton
            color={colors.alpha(colors.appleBlue, 0.06)}
            isTransparent
            label={lang.t('button.got_it')}
            onPress={handleClose}
            size="big"
            style={{ margin: 0, padding: 0 }}
            textColor={colors.appleBlue}
            weight="heavy"
          />
        )}
      </ColumnWithMargins>
    </SlackSheet>
  );
};

export default WalletDiagnosticsSheet;

import Clipboard from '@react-native-community/clipboard';
import { useRoute } from '@react-navigation/core';
import { captureException } from '@sentry/react-native';
import { toLower } from 'lodash';
import React, { Fragment, useCallback, useEffect } from 'react';
import { Alert, StatusBar, TextInput, View } from 'react-native';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/ActivityIndicator' was resol... Remove this comment to see the full error message
import ActivityIndicator from '../components/ActivityIndicator';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/Divider' was resolved to '/U... Remove this comment to see the full error message
import Divider from '../components/Divider';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/Spinner' was resolved to '/U... Remove this comment to see the full error message
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
import { loadAllKeys } from '../model/keychain';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../navigation/Navigation' was resolved to ... Remove this comment to see the full error message
import { useNavigation } from '../navigation/Navigation';
import { privateKeyKey, seedPhraseKey } from '../utils/keychainConstants';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/aesEncryp... Remove this comment to see the full error message
import AesEncryptor from '@rainbow-me/handlers/aesEncryption';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/authentic... Remove this comment to see the full error message
import { authenticateWithPIN } from '@rainbow-me/handlers/authentication';
import {
  useDimensions,
  useImportingWallet,
  useWalletsWithBalancesAndNames,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
} from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { ethereumUtils, haptics } from '@rainbow-me/utils';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'logger' or its corresponding t... Remove this comment to see the full error message
import logger from 'logger';

export const WalletDiagnosticsSheetHeight = '100%';
// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
const LoadingSpinner = android ? Spinner : ActivityIndicator;
const encryptor = new AesEncryptor();

const SecretInput = ({ value, color }: any) => {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  const handleCopy = useCallback(() => {
    Alert.alert(
      'Reminder',
      `These words are for your eyes only. Your secret phrase gives access to your entire wallet. 

       Be very careful with it.`,
      [
        {
          onPress: () => {
            Clipboard.setString(value);
            haptics.notificationSuccess();
          },
          text: 'Ok, I understand',
        },
        {
          // @ts-expect-error ts-migrate(2322) FIXME: Type 'null' is not assignable to type '((value?: s... Remove this comment to see the full error message
          onPress: null,
          style: 'cancel',
          text: 'Cancel',
        },
      ]
    );
  }, [value]);
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Row justify="space-between" width="100%">
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <TextInput
        // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
        color={color}
        disabled
        editable={false}
        secureTextEntry
        selectTextOnFocus
        style={{ width: '65%' }}
        value={value}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ButtonPressAnimation onPress={handleCopy}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Row
          backgroundColor={colors.appleBlue}
          borderRadius={15}
          // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
          style={{ paddingHorizontal: android ? 10 : 15, paddingVertical: 10 }}
          width="100%"
        >
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Text align="center" color={colors.whiteLabel} weight="bold">
            Copy Secret
          </Text>
        </Row>
      </ButtonPressAnimation>
    </Row>
  );
};

const ItemRow = ({ data }: any) => {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  const {
    busy,
    handleSetSeedPhrase,
    handlePressImportButton,
  } = useImportingWallet();

  const handlePressRestore = useCallback(async () => {
    if (busy) return;
    Alert.alert(
      'Heads up!',
      'This action will completely replace this wallet. Are you sure?',
      [
        {
          onPress: async () => {
            try {
              handleSetSeedPhrase(data.secret);
              await handlePressImportButton(null, data.secret);
            } catch (e) {
              logger.sentry('Error restoring from wallet diagnostics', e);
              const customError = new Error('WalletDiagnostics restore failed');
              captureException(customError);
            }
          },
          text: 'Yes, I understand',
        },
        {
          // @ts-expect-error ts-migrate(2322) FIXME: Type 'null' is not assignable to type '((value?: s... Remove this comment to see the full error message
          onPress: null,
          style: 'cancel',
          text: 'Cancel',
        },
      ]
    );
  }, [busy, data.secret, handlePressImportButton, handleSetSeedPhrase]);

  if (data.pinRequired) {
    return (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <ColumnWithMargins key={`key_${data.username}`}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <RowWithMargins>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Text size="lmedium">
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Bold>Key:</Bold> {` `}
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text color={colors.blueGreyDark50}>{data.username}</Text>
          </Text>
        </RowWithMargins>
      </ColumnWithMargins>
    );
  }

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ColumnWithMargins key={`key_${data.username}`}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <RowWithMargins>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Text size="lmedium">
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Bold>Type:</Bold> {` `}
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Text color={colors.blueGreyDark50}>{data.type}</Text>
        </Text>
      </RowWithMargins>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <RowWithMargins>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Text size="lmedium">
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Bold>Key:</Bold> {` `}
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Text color={colors.blueGreyDark50}>{data.username}</Text>
        </Text>
      </RowWithMargins>
      {data.createdAt && (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <RowWithMargins>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Text size="lmedium">
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Bold>Created at:</Bold> {` `}
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text color={colors.blueGreyDark50}>{data.createdAt}</Text>
          </Text>
        </RowWithMargins>
      )}
      {data.label && (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <RowWithMargins>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Text size="lmedium">
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Bold>Label:</Bold> {` `}
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text color={colors.blueGreyDark50}>{data.label}</Text>
          </Text>
        </RowWithMargins>
      )}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <RowWithMargins>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Text size="lmedium">
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Bold>Address:</Bold> {` `}
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Text color={colors.blueGreyDark50}>{data.address}</Text>
        </Text>
      </RowWithMargins>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Text size="lmedium">
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Bold>Secret:</Bold> {` `}
      </Text>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <RowWithMargins>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <SecretInput color={colors.blueGreyDark} value={data.secret} />
      </RowWithMargins>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ButtonPressAnimation onPress={handlePressRestore}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <View
          // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
          backgroundColor={colors.dpiMid}
          borderRadius={15}
          style={{ paddingHorizontal: 15, paddingVertical: 10 }}
        >
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Text align="center" color={colors.whiteLabel} weight="bold">
            Restore
          </Text>
        </View>
      </ButtonPressAnimation>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Divider />
    </ColumnWithMargins>
  );
};

const WalletDiagnosticsSheet = () => {
  const { height: deviceHeight } = useDimensions();
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  const { navigate, goBack } = useNavigation();
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useState'.
  const [keys, setKeys] = useState();
  const { params } = useRoute();
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useState'.
  const [userPin, setUserPin] = useState(params?.userPin);
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useState'.
  const [pinRequired, setPinRequired] = useState(false);
  const walletsWithBalancesAndNames = useWalletsWithBalancesAndNames();
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useState'.
  const [uuid, setUuid] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const allKeys = await loadAllKeys();
        const processedKeys = await Promise.all(
          // @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
          allKeys
            .filter(key => {
              if (key?.username === 'analyticsUserIdentifier') {
                setUuid(key.password);
              }
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
                const {
                  address,
                  type,
                } = await ethereumUtils.deriveAccountFromWalletInput(secret);
                let createdAt = null;
                let label = null;
                Object.keys(walletsWithBalancesAndNames).some(k => {
                  const found = walletsWithBalancesAndNames[k].addresses.some(
                    (account: any) => {
                      if (toLower(account.address) === toLower(address)) {
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
      } catch (e) {
        logger.sentry('Error processing keys for wallet diagnostics', e);
        const customError = new Error('WalletDiagnostics init failed');
        captureException(customError);
      }
    };
    setTimeout(() => {
      init();
    }, 2000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useMemo'.
  const seeds = useMemo(
    () =>
      keys?.filter(
        (key: any) => key.username.indexOf(`_${seedPhraseKey}`) !== -1
      ),
    [keys]
  );

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useMemo'.
  const pkeys = useMemo(
    () =>
      keys?.filter(
        (key: any) => key.username.indexOf(`_${privateKeyKey}`) !== -1
      ),
    [keys]
  );

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useMemo'.
  const oldSeed = useMemo(
    () => keys?.filter((key: any) => key.username === seedPhraseKey) || [],
    [keys]
  );

  const handleClose = useCallback(() => {
    goBack();
  }, [goBack]);

  const handleAuthenticateWithPIN = useCallback(async () => {
    try {
      const pin = await authenticateWithPIN();
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <SlackSheet
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
      additionalTopPadding={android}
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
      {...(ios
        ? { height: '100%' }
        : { additionalTopPadding: true, contentHeight: deviceHeight - 40 })}
      scrollEnabled
    >
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
      {ios && <StatusBar barStyle="light-content" />}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ColumnWithMargins
        margin={15}
        style={{
          // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
          paddingBottom: ios ? 60 : 40 + getSoftMenuBarHeight(),
          paddingHorizontal: 19,
          paddingTop: 19,
          width: '100%',
        }}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <SheetTitle align="center" size="big" weight="heavy">
          Wallet Diagnostics
        </SheetTitle>
        {!keys && (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Centered flex={1} height={300}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <LoadingSpinner />
          </Centered>
        )}
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
        {android && keys && pinRequired && !userPin && (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <ColumnWithMargins>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text align="center">
              You need to authenticate with your PIN in order to access your
              Wallet secrets
            </Text>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <SheetActionButton
              color={colors.alpha(colors.green, 0.06)}
              isTransparent
              label="Authenticate with PIN"
              onPress={handleAuthenticateWithPIN}
              size="big"
              style={{ margin: 0, padding: 0 }}
              textColor={colors.green}
              weight="heavy"
            />
          </ColumnWithMargins>
        )}
        {uuid && (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Fragment>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <ColumnWithMargins>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <RowWithMargins>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Text size="lmedium">
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                  unless the '--jsx' flag is provided... Remove this comment to
                  see the full error message
                  <Bold>UUID:</Bold> {` `}
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                  unless the '--jsx' flag is provided... Remove this comment to
                  see the full error message
                  <Text color={colors.blueGreyDark50}>{uuid}</Text>
                </Text>
              </RowWithMargins>
            </ColumnWithMargins>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Divider />
          </Fragment>
        )}
        {seeds?.length > 0 && (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Fragment>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Column>
              {seeds.map((key: any) => (
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <ItemRow data={key} key={`row_${key.username}`} />
              ))}
            </Column>
          </Fragment>
        )}
        {pkeys?.length > 0 && (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Fragment>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Column>
              {pkeys?.map((key: any) => (
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <ItemRow data={key} key={`row_${key.username}`} />
              ))}
            </Column>
          </Fragment>
        )}
        {keys?.length > 0 && (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Fragment>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Column>
              {oldSeed?.map((key: any) => (
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <ItemRow data={key} key={`row_${key.username}`} />
              ))}
            </Column>
          </Fragment>
        )}
        {keys && (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <SheetActionButton
            color={colors.alpha(colors.appleBlue, 0.06)}
            isTransparent
            label="Got it"
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

import Clipboard from '@react-native-community/clipboard';
import { useRoute } from '@react-navigation/core';
import { captureException } from '@sentry/react-native';
import { toLower } from 'lodash';
import React, { Fragment, useCallback, useEffect } from 'react';
import { Alert, StatusBar, TextInput, View } from 'react-native';
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
import { loadAllKeys } from '../model/keychain';
import { useNavigation } from '../navigation/Navigation';
import { privateKeyKey, seedPhraseKey } from '../utils/keychainConstants';
import AesEncryptor from '@rainbow-me/handlers/aesEncryption';
import { authenticateWithPIN } from '@rainbow-me/handlers/authentication';
import {
  useDimensions,
  useImportingWallet,
  useWalletsWithBalancesAndNames,
} from '@rainbow-me/hooks';
import Routes from '@rainbow-me/routes';
import { ethereumUtils, haptics } from '@rainbow-me/utils';
import logger from 'logger';

export const WalletDiagnosticsSheetHeight = '100%';
const LoadingSpinner = android ? Spinner : ActivityIndicator;
const encryptor = new AesEncryptor();

const SecretInput = ({ value, color }) => {
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
          onPress: null,
          style: 'cancel',
          text: 'Cancel',
        },
      ]
    );
  }, [value]);
  return (
    <Row justify="space-between" width="100%">
      <TextInput
        color={color}
        disabled
        editable={false}
        secureTextEntry
        selectTextOnFocus
        style={{ width: '65%' }}
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
            Copy Secret
          </Text>
        </Row>
      </ButtonPressAnimation>
    </Row>
  );
};

const ItemRow = ({ data }) => {
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
          onPress: null,
          style: 'cancel',
          text: 'Cancel',
        },
      ]
    );
  }, [busy, data.secret, handlePressImportButton, handleSetSeedPhrase]);

  if (data.pinRequired) {
    return (
      <ColumnWithMargins key={`key_${data.username}`}>
        <RowWithMargins>
          <Text size="lmedium">
            <Bold>Key:</Bold> {` `}
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
          <Bold>Type:</Bold> {` `}
          <Text color={colors.blueGreyDark50}>{data.type}</Text>
        </Text>
      </RowWithMargins>
      <RowWithMargins>
        <Text size="lmedium">
          <Bold>Key:</Bold> {` `}
          <Text color={colors.blueGreyDark50}>{data.username}</Text>
        </Text>
      </RowWithMargins>
      {data.createdAt && (
        <RowWithMargins>
          <Text size="lmedium">
            <Bold>Created at:</Bold> {` `}
            <Text color={colors.blueGreyDark50}>{data.createdAt}</Text>
          </Text>
        </RowWithMargins>
      )}
      {data.label && (
        <RowWithMargins>
          <Text size="lmedium">
            <Bold>Label:</Bold> {` `}
            <Text color={colors.blueGreyDark50}>{data.label}</Text>
          </Text>
        </RowWithMargins>
      )}
      <RowWithMargins>
        <Text size="lmedium">
          <Bold>Address:</Bold> {` `}
          <Text color={colors.blueGreyDark50}>{data.address}</Text>
        </Text>
      </RowWithMargins>
      <Text size="lmedium">
        <Bold>Secret:</Bold> {` `}
      </Text>
      <RowWithMargins>
        <SecretInput color={colors.blueGreyDark} value={data.secret} />
      </RowWithMargins>
      <ButtonPressAnimation onPress={handlePressRestore}>
        <View
          backgroundColor={colors.dpiMid}
          borderRadius={15}
          style={{ paddingHorizontal: 15, paddingVertical: 10 }}
        >
          <Text align="center" color={colors.whiteLabel} weight="bold">
            Restore
          </Text>
        </View>
      </ButtonPressAnimation>
      <Divider />
    </ColumnWithMargins>
  );
};

const WalletDiagnosticsSheet = () => {
  const { height: deviceHeight, width: deviceWidth } = useDimensions();
  const { colors } = useTheme();
  const { navigate, goBack } = useNavigation();
  const [keys, setKeys] = useState();
  const { params } = useRoute();
  const [userPin, setUserPin] = useState(params?.userPin);
  const [pinRequired, setPinRequired] = useState(false);
  const walletsWithBalancesAndNames = useWalletsWithBalancesAndNames();

  useEffect(() => {
    const init = async () => {
      try {
        const allKeys = await loadAllKeys();
        const processedKeys = await Promise.all(
          allKeys
            .filter(
              key =>
                key?.username?.indexOf(seedPhraseKey) !== -1 ||
                key?.username?.indexOf(privateKeyKey) !== -1
            )
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
                    account => {
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
    <SlackSheet
      additionalTopPadding={android}
      {...(ios
        ? { height: '100%' }
        : { additionalTopPadding: true, contentHeight: deviceHeight - 40 })}
      scrollEnabled
    >
      {ios && <StatusBar barStyle="light-content" />}

      <ColumnWithMargins
        margin={15}
        style={{
          paddingBottom: ios ? 60 : 40 + getSoftMenuBarHeight(),
          paddingHorizontal: 19,
          paddingTop: 19,
          width: '100%',
        }}
      >
        <SheetTitle align="center" size="big" weight="heavy">
          Wallet Diagnostics
        </SheetTitle>

        {!keys && (
          <Centered flex={1} height={300}>
            <LoadingSpinner />
          </Centered>
        )}

        {android && keys && pinRequired && !userPin && (
          <ColumnWithMargins>
            <Text align="center">
              You need to authenticate with your PIN in order to access your
              Wallet secrets
            </Text>
            <SheetActionButton
              androidWidth={deviceWidth - 40}
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

        {seeds?.length > 0 && (
          <Fragment>
            <Column>
              {seeds.map(key => (
                <ItemRow data={key} key={`row_${key.username}`} />
              ))}
            </Column>
          </Fragment>
        )}

        {pkeys?.length > 0 && (
          <Fragment>
            <Column>
              {pkeys?.map(key => (
                <ItemRow data={key} key={`row_${key.username}`} />
              ))}
            </Column>
          </Fragment>
        )}

        {keys?.length > 0 && (
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
            androidWidth={deviceWidth - 40}
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

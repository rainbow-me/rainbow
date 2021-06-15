import Clipboard from '@react-native-community/clipboard';
import { captureException } from '@sentry/react-native';
import { toLower } from 'lodash';
import React, { Fragment, useCallback, useEffect } from 'react';
import { Alert, StatusBar, TextInput } from 'react-native';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components';
import ActivityIndicator from '../components/ActivityIndicator';
import Divider from '../components/Divider';
import Spinner from '../components/Spinner';
import { ButtonPressAnimation } from '../components/animations';
import {
  Centered,
  ColumnWithMargins,
  Row,
  RowWithMargins,
} from '../components/layout';
import { SheetActionButton, SheetTitle, SlackSheet } from '../components/sheet';
import { Bold, Text } from '../components/text';
import { loadAllKeys } from '../model/keychain';
import { useNavigation } from '../navigation/Navigation';
import { privateKeyKey, seedPhraseKey } from '../utils/keychainConstants';
import { useDimensions, useImportingWallet } from '@rainbow-me/hooks';
import { useWalletsWithBalancesAndNames } from '@rainbow-me/hooks/useWalletsWithBalancesAndNames';
import { position } from '@rainbow-me/styles';
import { ethereumUtils, haptics } from '@rainbow-me/utils';
import logger from 'logger';

export const WalletDiagnosticsSheetHeight = android ? 454 : 400;
const LoadingSpinner = android ? Spinner : ActivityIndicator;

const Container = styled(Centered).attrs({ direction: 'column' })`
  ${position.cover};
  ${({ deviceHeight, height }) =>
    height ? `height: ${height + deviceHeight}` : null};
`;

const SecretInput = ({ value, color }) => {
  const { colors } = useTheme();
  const copy = useCallback(() => {
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
    <Row>
      <TextInput
        color={color}
        disabled
        secureTextEntry
        selectTextOnFocus
        style={{ width: '65%' }}
        value={value}
      />
      <ButtonPressAnimation
        backgroundColor={colors.appleBlue}
        borderRadius={15}
        onPress={copy}
        style={{ marginLeft: 5, paddingHorizontal: 15, paddingVertical: 10 }}
      >
        <Text weight="bold">Copy Secret</Text>
      </ButtonPressAnimation>
    </Row>
  );
};

const ItemRow = ({ data }) => {
  const { colors } = useTheme();
  const {
    handleSetSeedPhrase,
    handlePressImportButton,
    busy,
  } = useImportingWallet();

  const handlePressCopy = useCallback(() => {
    Clipboard.setString(data.address);
    haptics.notificationSuccess();
  }, [data.address]);

  const handlePressRestore = useCallback(async () => {
    if (busy) return;
    try {
      handleSetSeedPhrase(data.secret);
      await handlePressImportButton(null, data.secret);
    } catch (e) {
      logger.sentry('Error restoring from wallet diagnostics', e);
      const customError = new Error('WalletDiagnostics restore failed');
      captureException(customError);
    }
  }, [busy, data.secret, handlePressImportButton, handleSetSeedPhrase]);
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
      <ButtonPressAnimation
        backgroundColor={colors.green}
        borderRadius={15}
        onPress={handlePressCopy}
        style={{ paddingHorizontal: 15, paddingVertical: 10 }}
      >
        <Text align="center" weight="bold">
          Copy Address
        </Text>
      </ButtonPressAnimation>
      <ButtonPressAnimation
        backgroundColor={colors.dpiMid}
        borderRadius={15}
        onPress={handlePressRestore}
        style={{ paddingHorizontal: 15, paddingVertical: 10 }}
      >
        {busy ? (
          <Centered>
            <LoadingSpinner />
          </Centered>
        ) : (
          <Text align="center" weight="bold">
            Restore
          </Text>
        )}
      </ButtonPressAnimation>
      <Divider />
    </ColumnWithMargins>
  );
};

const WalletDiagnosticsSheet = () => {
  const { height: deviceHeight, width: deviceWidth } = useDimensions();
  const insets = useSafeArea();
  const { colors } = useTheme();
  const { goBack } = useNavigation();
  const [keys, setKeys] = useState();

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
              const secret = secretObj.seedphrase || secretObj.privateKey;
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
            })
        );
        setKeys(processedKeys);
      } catch (e) {
        logger.sentry('Error processing keys for wallet diagnostics', e);
        const customError = new Error('WalletDiagnostics init failed');
        captureException(customError);
      }
    };
    init();
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

  return (
    <Container
      deviceHeight={deviceHeight}
      height={WalletDiagnosticsSheetHeight}
      insets={insets}
    >
      {ios && <StatusBar barStyle="light-content" />}

      <SlackSheet
        additionalTopPadding={android}
        contentHeight={WalletDiagnosticsSheetHeight}
        scrollEnabled
      >
        <Centered
          direction="column"
          height={WalletDiagnosticsSheetHeight}
          testID="add-token-sheet"
          width="100%"
        >
          <ColumnWithMargins
            margin={15}
            style={{
              height: WalletDiagnosticsSheetHeight,
              paddingHorizontal: 19,
              paddingTop: 19,
              width: '100%',
            }}
          >
            <SheetTitle align="center" size="big" weight="heavy">
              Wallet Diagnostics
            </SheetTitle>

            {!keys && (
              <Centered flex={1}>
                <LoadingSpinner />
              </Centered>
            )}

            {seeds?.length && (
              <Fragment>
                <Row>
                  {seeds.map(key => (
                    <ItemRow data={key} key={`row_${key.username}`} />
                  ))}
                </Row>
              </Fragment>
            )}
            {pkeys?.length && (
              <Fragment>
                <Row>
                  {pkeys.map(key => (
                    <ItemRow data={key} key={`row_${key.username}`} />
                  ))}
                </Row>
              </Fragment>
            )}

            {oldSeed?.length > 0 && (
              <Fragment>
                <Row>
                  {oldSeed?.map(key => (
                    <ItemRow data={key} key={`row_${key.username}`} />
                  ))}
                </Row>
              </Fragment>
            )}

            {keys && (
              <SheetActionButton
                androidWidth={deviceWidth - 60}
                color={colors.alpha(colors.appleBlue, 0.06)}
                isTransparent
                label="Got it"
                onPress={handleClose}
                size="big"
                textColor={colors.appleBlue}
                weight="heavy"
              />
            )}
          </ColumnWithMargins>
        </Centered>
      </SlackSheet>
    </Container>
  );
};

export default WalletDiagnosticsSheet;

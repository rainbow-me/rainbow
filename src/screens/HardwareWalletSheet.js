import TransportBLE from '@ledgerhq/react-native-hw-transport-ble';
// import lang from 'i18n-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import Animated, { useSharedValue, withSpring } from 'react-native-reanimated';
import Divider from '../components/Divider';
import { Centered, Column } from '../components/layout';
import {
  SheetActionButton,
  SheetActionButtonRow,
  SheetHandleFixedToTop,
  SheetKeyboardAnimation,
  SlackSheet,
} from '../components/sheet';
import { Emoji, Text } from '../components/text';
import { useDimensions, useImportingWallet } from '@/hooks';

import styled from '@rainbow-me/styled-components';
import { position } from '@rainbow-me/styles';
import { safeAreaInsetValues } from '@rainbow-me/utils';

import logger from 'logger';

const springConfig = {
  damping: 500,
  mass: 3,
  stiffness: 1000,
};

const Container = styled(Centered).attrs({
  direction: 'column',
})(({ deviceHeight, height }) => ({
  ...(height && {
    height: height + deviceHeight,
  }),
  ...position.coverAsObject,
}));

const CenteredSheet = styled(Centered)({
  borderTopLeftRadius: 39,
  borderTopRightRadius: 39,
});

const ExtendedSheetBackground = styled.View({
  backgroundColor: ({ theme: { colors } }) => colors.white,
  bottom: -800,
  height: 1000,
  position: 'absolute',
  width: '100%',
});

// const LoadingSpinner = styled(android ? Spinner : ActivityIndicator).attrs(
//   ({ theme: { colors } }) => ({
//     color: colors.alpha(colors.blueGreyDark, 0.3),
//     size: 'large',
//   })
// )({});

const AnimatedContainer = Animated.createAnimatedComponent(Container);
const AnimatedSheet = Animated.createAnimatedComponent(CenteredSheet);

const HW_WALLET_KEY = 'hw_wallets';

export default function HardwareWalletSheet() {
  // const { goBack } = useNavigation();
  const { height: deviceHeight } = useDimensions();
  const [status, setStatus] = useState('');
  const [hw, setHw] = useState([]);
  const [observeSubscription, setObserveSubscription] = useState(null);
  const [listenSubscription, setListenSubscription] = useState(null);

  // Reset conn for testing purposes
  useEffect(() => {
    return () => {
      observeSubscription?.unsubscribe();
      listenSubscription?.unsubscribe();
    };
  }, [listenSubscription, observeSubscription]);

  // const {
  //   params: { type },
  // } = useRoute();

  useEffect(() => {
    const loadHardwareWallets = async () => {
      let data = [];
      try {
        const dataStr = await AsyncStorage.getItem(HW_WALLET_KEY);
        data = JSON.parse(dataStr);
        logger.debug('HW WALLETS FOUND', data);
      } catch (e) {
        logger.debug('hw_wallets not found');
      }
      if (data.length > 0) {
        setHw(data);
      }
    };
    loadHardwareWallets();
  }, []);

  const resetConn = useCallback(async () => {
    try {
      logger.debug('disconnecting', hw[0]);
      await TransportBLE.disconnect(hw[0]);
      logger.debug('Disconnected succesfully');
    } catch (e) {
      logger.debug('error disconnecting', e);
    } finally {
      setHw([]);
      AsyncStorage.setItem(HW_WALLET_KEY, JSON.stringify([]));
    }
  }, [hw]);

  const offset = useSharedValue(0);

  useEffect(() => {
    offset.value = withSpring(0, springConfig);
  }, [offset]);

  const sheetHeight = ios
    ? 442 + safeAreaInsetValues.bottom
    : 850 + safeAreaInsetValues.bottom;

  const marginTop = android ? deviceHeight - sheetHeight + 340 : null;

  const { colors } = useTheme();
  const { handleSetSeedPhrase, handlePressImportButton } = useImportingWallet();

  const importHardwareWallet = useCallback(
    async deviceId => {
      // logger.debug('transport', transport);
      try {
        // const eth = new AppEth(transport);
        // const path = "44'/60'/0'/0/0"; // HD derivation path
        // const { address } = await eth.getAddress(path, false);
        // logger.debug('Got address', address);
        handleSetSeedPhrase(deviceId);
        handlePressImportButton(null, deviceId);
      } catch (error) {
        logger.debug('error', error);
        Alert.alert(
          'Failed to connect',
          'Make sure your Ledger is unlocked and your Ethereum app is running.'
        );
        setStatus(error.message);
      }
    },
    [handlePressImportButton, handleSetSeedPhrase]
  );

  const handlePair = useCallback(() => {
    setStatus('Looking for devices...');
    setObserveSubscription(
      TransportBLE.observeState({
        complete: () => {
          logger.debug('BT OBSERVE COMPLETE');
        },
        error: () => {
          logger.debug('BT OBSERVE ERROR');
        },
        next: e => {
          logger.debug('BT OBSERVE NEXT', e);

          if (e.available) {
            setListenSubscription(
              TransportBLE.listen({
                complete: () => {},
                error: error => {
                  setStatus(error);
                },
                next: async e => {
                  if (e.type === 'add') {
                    const device = e.descriptor;

                    Alert.alert(
                      'Device found!',
                      `Do you want to connect to ${device.name} \n
                  (ID: ${device.id})?`,
                      [
                        {
                          onPress: () => null,
                          style: 'cancel',
                          text: 'NO',
                        },
                        {
                          onPress: async () => {
                            setStatus('Connecting...');

                            logger.debug(
                              'device ready to add',
                              JSON.stringify(device, null, 2)
                            );
                            const newList = [...hw, device.id];
                            setHw(newList);
                            AsyncStorage.setItem(
                              HW_WALLET_KEY,
                              JSON.stringify(newList)
                            );
                            importHardwareWallet(device.id);
                          },
                          text: 'YES',
                        },
                      ]
                    );
                  } else {
                    Alert.alert('error connecting', JSON.stringify(e, null, 2));
                  }
                },
              })
            );
          } else {
            setStatus(e.type);
          }
        },
      })
    );
  }, [hw, importHardwareWallet]);

  return (
    <SheetKeyboardAnimation
      as={AnimatedContainer}
      isKeyboardVisible={false}
      translateY={offset}
    >
      <ExtendedSheetBackground />
      <SlackSheet
        backgroundColor={colors.transparent}
        borderRadius={0}
        height={sheetHeight}
        hideHandle
        scrollEnabled={false}
      >
        <Column>
          <AnimatedSheet
            backgroundColor={colors.white}
            borderRadius={39}
            direction="column"
            marginTop={marginTop}
            paddingBottom={android ? 30 : 0}
          >
            <SheetHandleFixedToTop showBlur={false} />
            <Centered direction="column">
              {/* {!ready && (
                <Column
                  align="center"
                  backgroundColor={colors.white}
                  height={300}
                  justify="center"
                  marginBottom={12}
                  marginTop={30}
                >
                  <LoadingSpinner />
                </Column>
              )} */}
              <Fragment>
                <Column marginBottom={12} marginTop={30}>
                  <Emoji name="shield" size="biggest" />
                </Column>
                <Column marginBottom={12}>
                  <Text
                    align="center"
                    color={colors.dark}
                    size="big"
                    weight="heavy"
                  >
                    Connect your hardware wallet
                  </Text>
                </Column>
                <Column marginBottom={30} maxWidth={375} paddingHorizontal={42}>
                  <Text
                    align="center"
                    color={colors.alpha(colors.blueGreyDark, 0.5)}
                    lineHeight="looser"
                    size="large"
                    weight="regular"
                  >
                    {status ||
                      'Turn on your Ledger Nano X wallet and tap "Pair".'}
                  </Text>
                </Column>
                <Centered marginBottom={24}>
                  <Divider
                    color={colors.rowDividerExtraLight}
                    inset={[0, 143.5]}
                  />
                </Centered>
                <Column marginBottom={android && 15}>
                  <SheetActionButtonRow
                    ignorePaddingBottom
                    ignorePaddingTop={ios}
                  >
                    <SheetActionButton
                      color={colors.red}
                      label="Pair a new device"
                      onPress={handlePair}
                      size="big"
                      weight="bold"
                    />
                  </SheetActionButtonRow>
                  {hw?.length > 0 && (
                    <SheetActionButtonRow ignorePaddingBottom>
                      <SheetActionButton
                        color={colors.white}
                        label="Disconnect"
                        onPress={resetConn}
                        size="big"
                        textColor={colors.alpha(colors.blueGreyDark, 0.8)}
                        weight="bold"
                      />
                    </SheetActionButtonRow>
                  )}
                </Column>
              </Fragment>
            </Centered>
          </AnimatedSheet>
        </Column>
      </SlackSheet>
    </SheetKeyboardAnimation>
  );
}

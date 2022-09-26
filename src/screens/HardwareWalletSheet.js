import TransportBLE from '@ledgerhq/react-native-hw-transport-ble';
import lang from 'i18n-js';
import { uniq } from 'lodash';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { Alert, PermissionsAndroid } from 'react-native';
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

const AnimatedContainer = Animated.createAnimatedComponent(Container);
const AnimatedSheet = Animated.createAnimatedComponent(CenteredSheet);
let permissionsRequested = 0;
let deviceFound = false;

export default function HardwareWalletSheet() {
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

  const offset = useSharedValue(0);

  useEffect(() => {
    offset.value = withSpring(0, springConfig);
  }, [offset]);

  const sheetHeight = ios
    ? 332 + safeAreaInsetValues.bottom
    : 760 + safeAreaInsetValues.bottom;

  const marginTop = android ? deviceHeight - sheetHeight + 340 : null;

  const { colors } = useTheme();
  const { handleSetSeedPhrase, handlePressImportButton } = useImportingWallet();

  const importHardwareWallet = useCallback(
    async deviceId => {
      try {
        handleSetSeedPhrase(deviceId);
        handlePressImportButton(null, deviceId);
      } catch (error) {
        Alert.alert(
          lang.t('hw_wallet.failed_to_connect'),
          lang.t('hw_wallet.make_sure_ledger_unlocked')
        );
        logger.log('error importing hw wallet', error);
        setStatus(error.message);
      }
    },
    [handlePressImportButton, handleSetSeedPhrase]
  );

  const requestBLEPermissions = async () => {
    permissionsRequested++;
    try {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);
      handlePair();
    } catch (e) {
      logger.log('error asking for permissions', e);
    }
  };

  const handlePair = useCallback(() => {
    setStatus(lang.t('hw_wallet.looking_for_devices'));
    setObserveSubscription(
      TransportBLE.observeState({
        complete: () => null,
        error: () => null,
        next: e => {
          if (e.available) {
            setListenSubscription(
              TransportBLE.listen({
                complete: () => {},
                error: error => {
                  logger.log('error listening', error);
                  setStatus(error?.toString() || '');
                  if (android && permissionsRequested < 2) {
                    requestBLEPermissions();
                  }
                },
                next: async e => {
                  if (!deviceFound) {
                    if (e.type === 'add') {
                      deviceFound = true;
                      const device = e.descriptor;
                      Alert.alert(
                        lang.t('hw_wallet.device_found'),
                        lang.t('hw_wallet.do_u_wanna_connect', {
                          deviceId: device.id,
                          deviceName: device.name,
                        }),
                        [
                          {
                            onPress: () => {
                              deviceFound = false;
                            },
                            style: 'cancel',
                            text: lang.t('hw_wallet.no'),
                          },
                          {
                            onPress: async () => {
                              setStatus(lang.t('hw_wallet.connecting'));
                              const newList = uniq([...hw, device.id]);
                              setHw(newList);
                              logger.log('new list', newList);
                              importHardwareWallet(device.id);
                            },
                            text: lang.t('hw_wallet.yes'),
                          },
                        ]
                      );
                    } else {
                      Alert.alert(
                        lang.t('hw_wallet.error_connecting'),
                        JSON.stringify(e, null, 2)
                      );
                    }
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
                    {lang.t('hw_wallet.connect_your_hardware_wallet')}
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
                    {status || lang.t('hw_wallet.turn_on_ledger_and_open_app')}
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
                      label={lang.t('hw_wallet.pair_new_device')}
                      onPress={handlePair}
                      size="big"
                      weight="bold"
                    />
                  </SheetActionButtonRow>
                </Column>
              </Fragment>
            </Centered>
          </AnimatedSheet>
        </Column>
      </SlackSheet>
    </SheetKeyboardAnimation>
  );
}

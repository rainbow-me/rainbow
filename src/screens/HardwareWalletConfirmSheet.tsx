import AppEth from '@ledgerhq/hw-app-eth';
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble';
import { useRoute } from '@react-navigation/core';
import lang from 'i18n-js';

import { forEach } from 'lodash';
import React, { Fragment, useCallback, useEffect, useState } from 'react';

import Animated, { useSharedValue, withSpring } from 'react-native-reanimated';
import Divider from '../components/Divider';
import { Centered, Column } from '../components/layout';
import {
  SheetActionButtonRow,
  SheetHandleFixedToTop,
  SheetKeyboardAnimation,
  SlackSheet,
} from '../components/sheet';
import { Emoji, Text } from '../components/text';
import { HoldToAuthorizeButton } from '@/components/buttons';
import { useAccountSettings, useDimensions } from '@/hooks';
import { LEDGER_CONNECTION_STATUS, useLedgerStatusCheck } from '@/hooks/useLedgerConnect';
import styled from '@rainbow-me/styled-components';
import { position } from '@rainbow-me/styles';
import { safeAreaInsetValues } from '@rainbow-me/utils';
import { useTheme } from '@/theme';
import { View } from 'react-native';

const springConfig = {
  damping: 500,
  mass: 3,
  stiffness: 1000,
};

const Container = styled(Centered)(({ deviceHeight, height }: {deviceHeight: number, height: number}) =>
({
    ...(height && {
      height: height + deviceHeight,
    }),
    ...position.coverAsObject,
  }));

const CenteredSheet = styled(Centered)({
  borderTopLeftRadius: 39,
  borderTopRightRadius: 39,
});



const ExtendedSheetBackground = styled(View)(({ backgroundColor }: {backgroundColor: string}) =>
  ({
    backgroundColor,
    bottom: -800,
    height: 1000,
    position: 'absolute',
    width: '100%',
  })
);

const AnimatedContainer = Animated.createAnimatedComponent(Container);
const AnimatedSheet = Animated.createAnimatedComponent(CenteredSheet);

export default function HardwareWalletConfirmSheet() {
  const { height: deviceHeight } = useDimensions();
  const { accountAddress: currentAddress } = useAccountSettings();


  const offset = useSharedValue(0);

  useEffect(() => {
    offset.value = withSpring(0, springConfig);
  }, [offset]);

  const sheetHeight = ios
    ? 332 + safeAreaInsetValues.bottom
    : 735 + safeAreaInsetValues.bottom;

  const marginTop = android ? deviceHeight - sheetHeight + 340 : null;

  const { colors } = useTheme();

  const {
    params: { callback, colorForAsset },
  } = useRoute<any>();

  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const runIt = useCallback(async () => {
    setIsAuthorizing(true);
    try {
      await callback();
      setIsAuthorizing(false);
    } catch {
      setIsAuthorizing(false);
    }
  },[callback, setIsAuthorizing]);

  const { errorMessage, connectionStatus } = useLedgerStatusCheck({address: currentAddress});

  return (
    <SheetKeyboardAnimation
      as={AnimatedContainer}
      isKeyboardVisible={false}
      translateY={offset}
    >
      <ExtendedSheetBackground backgroundColor={colors.white} />
      {// @ts-ignore slackSheet bs}
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
                    Confirm transaction
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
                    {lang.t('hw_wallet.turn_on_ledger_and_open_app')}
                  </Text>
                  {connectionStatus === LEDGER_CONNECTION_STATUS.ERROR && (
                    <Text
                      align="center"
                      color={colors.alpha(colors.red, 0.5)}
                      lineHeight="looser"
                      size="large"
                      weight="regular"
                    >
                      {errorMessage}
                    </Text>
                  )}
                    {connectionStatus === LEDGER_CONNECTION_STATUS.READY && (
                    <Text
                      align="center"
                      color={colors.alpha(colors.green, 0.5)}
                      lineHeight="looser"
                      size="large"
                      weight="regular"
                    >
                      {'device is ready'}
                    </Text>
                  )}
                </Column>
                <Centered marginBottom={24}>
                {/* @ts-expect-error JavaScript component */}
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
                    {/* @ts-expect-error JavaScript component */}
                    <HoldToAuthorizeButton
                      backgroundColor={colorForAsset}
                      disabled={false}
                      disabledBackgroundColor={colorForAsset}
                      hideInnerBorder
                      isAuthorizing={isAuthorizing}
                      label="Confirm on Ledger"
                      ledger
                      onLongPress={runIt}
                      parentHorizontalPadding={19}
                      showBiometryIcon={false}
                      testID="testID"
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
/*
    const key = `${currentAddress}_${privateKeyKey}`;
    const data = await JSON.parse(hardwareStorage.getString(key));
    const deviceId = data?.privateKey?.split('/')[0];
*/
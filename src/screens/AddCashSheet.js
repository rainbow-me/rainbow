import lang from 'i18n-js';
import React, { useCallback, useMemo, useState } from 'react';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { AddCashForm, AddCashStatus } from '../components/add-cash';
import { Column, ColumnWithMargins, FlexItem } from '../components/layout';
import {
  SheetHandle,
  SheetSubtitleCycler,
  SheetTitle,
} from '../components/sheet';
import { deviceUtils } from '../utils';
import {
  useAddCashLimits,
  useDimensions,
  useShakeAnimation,
  useTimeout,
  useWyreApplePay,
} from '@/hooks';
import styled from '@/styled-thing';
import { borders } from '@/styles';
import { useTheme } from '@/theme';
import { IS_IOS } from '@/env';
import { logger as loggr, RainbowError } from '@/logger';
import { SlackSheet } from '@/components/sheet';

const deviceHeight = deviceUtils.dimensions.height;
const statusBarHeight = getStatusBarHeight(true);
const sheetHeight =
  deviceHeight -
  statusBarHeight -
  (IS_IOS ? (deviceHeight >= 812 ? 10 : 20) : 0);

const subtitleInterval = 3000;

const SheetContainer = styled(Column)({
  ...borders.buildRadiusAsObject('top', IS_IOS ? 0 : 16),
  backgroundColor: ({ colors }) => colors.white,
  height: IS_IOS ? deviceHeight : sheetHeight,
  top: IS_IOS ? 0 : statusBarHeight,
  width: '100%',
  zIndex: 0,
});

export default function AddCashSheet() {
  const { colors } = useTheme();
  const { isNarrowPhone, height: deviceHeight } = useDimensions();
  const insets = useSafeAreaInsets();

  /**
   * Used to determine if the webview is dismissed by a user or if the Wyre 3DS
   * auth is simply in the the process of completing
   */
  const isAuthenticationCompleting = React.useRef(false);

  const [errorAnimation, onShake] = useShakeAnimation();
  const [startErrorTimeout, stopErrorTimeout] = useTimeout();

  const [errorIndex, setErrorIndex] = useState(null);
  const onClearError = useCallback(() => setErrorIndex(null), []);

  const { weeklyRemainingLimit, yearlyRemainingLimit } = useAddCashLimits();

  const cashLimits = useMemo(
    () => ({
      weekly:
        weeklyRemainingLimit > 0
          ? lang.t('add_funds.limit_left_this_week', {
              remainingLimit: weeklyRemainingLimit,
            })
          : lang.t('add_funds.weekly_limit_reached'),
      yearly:
        yearlyRemainingLimit > 0
          ? lang.t('add_funds.limit_left_this_year', {
              remainingLimit: yearlyRemainingLimit,
            })
          : lang.t('add_funds.yearly_limit_reached'),
    }),
    [weeklyRemainingLimit, yearlyRemainingLimit]
  );

  const {
    error,
    isPaymentComplete,
    onPurchase,
    orderCurrency,
    orderId,
    orderStatus,
    resetAddCashForm,
    transferStatus,
    wyreAuthenticationFlowCallback,
    wyreAuthenticationFlowFailureCallback,
    wyreAuthenticationUrl,
  } = useWyreApplePay();

  const onLimitExceeded = useCallback(
    limit => {
      stopErrorTimeout();
      setErrorIndex(Object.keys(cashLimits).indexOf(limit));
      startErrorTimeout(() => onClearError(), subtitleInterval);
    },
    [stopErrorTimeout, cashLimits, startErrorTimeout, onClearError]
  );

  loggr.debug(`should show WebView`, {
    wyreAuthenticationUrl,
    isPaymentComplete,
  });

  return (
    <>
      <SheetContainer colors={colors}>
        <Column
          align="center"
          height={IS_IOS ? sheetHeight : '100%'}
          paddingBottom={isNarrowPhone ? 15 : insets.bottom + 11}
        >
          <Column align="center" paddingVertical={6}>
            <SheetHandle />
            <ColumnWithMargins
              align="center"
              margin={4}
              paddingTop={IS_IOS ? 7 : 5}
            >
              <SheetTitle>{lang.t('button.add_cash')}</SheetTitle>
              <SheetSubtitleCycler
                errorIndex={errorIndex}
                interval={subtitleInterval}
                isPaymentComplete={isPaymentComplete}
                items={Object.values(cashLimits)}
                sharedValue={errorAnimation}
              />
            </ColumnWithMargins>
          </Column>
          <FlexItem width="100%">
            {isPaymentComplete ? (
              <AddCashStatus
                error={error}
                orderCurrency={orderCurrency}
                orderId={orderId}
                orderStatus={orderStatus}
                resetAddCashForm={resetAddCashForm}
                transferStatus={transferStatus}
              />
            ) : (
              <AddCashForm
                limitWeekly={weeklyRemainingLimit}
                onClearError={onClearError}
                onLimitExceeded={onLimitExceeded}
                onPurchase={onPurchase}
                onShake={onShake}
                shakeAnim={errorAnimation}
              />
            )}
          </FlexItem>
        </Column>
      </SheetContainer>

      {wyreAuthenticationUrl && !isPaymentComplete ? (
        <SlackSheet
          height="100%"
          contentHeight={deviceHeight}
          removeTopPadding
          onDismiss={() => {
            // If in process of completing the auth flow, ignore
            if (!isAuthenticationCompleting.current) {
              loggr.debug(
                `AddCashSheet: dismissing wyreAuthenticationUrl webview`
              );
              wyreAuthenticationFlowFailureCallback();
            }
          }}
        >
          <WebView
            source={{ uri: wyreAuthenticationUrl }}
            style={{
              width: '100%',
              height: deviceHeight,
            }}
            onLoad={() => {
              loggr.info(`AddsCashSheet: loaded wyreAuthenticationUrl`);
            }}
            onError={error => {
              loggr.error(
                `AddsCashSheet: error loading wyreAuthenticationUrl`,
                { error }
              );
            }}
            /**
             * Handling based on Wyre docs
             * @see https://docs.sendwyre.com/docs/authentication-widget-whitelabel-api#remove-webview
             */
            injectedJavaScript={`
              ;(function () {
                window.ReactNativeWebView.postMessage(JSON.stringify({ rainbow: false, data: {} }));
                window.addEventListener("message", function (event) {
                  if (event.origin && (event.origin.includes("sendwyre") || event.origin.includes("testwyre"))) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ rainbow: true, data: event.data, type: typeof event.data }));
                  }
                }, false);
              })();
            `}
            onMessage={event => {
              loggr.debug(`AddCashSheet: onMessage`, event.nativeEvent.data);
              const { rainbow, data, type } = JSON.parse(
                event.nativeEvent.data
              );

              // just an additional check to ensure this is an event we are expecting
              if (!rainbow) return;

              loggr.info(
                `AddCashSheet: wyreAuthenticationUrl webview received postMessage event`,
                { data }
              );

              try {
                const result = JSON.parse(data);

                if (
                  result.type === 'authentication' &&
                  result.status === 'completed'
                ) {
                  isAuthenticationCompleting.current = true;
                  wyreAuthenticationFlowCallback();
                }
              } catch (e) {
                loggr.error(
                  new RainbowError(
                    `AddCashSheet: wyreAuthenticationUrl webview received an invalid postMessage event`
                  ),
                  {
                    error: e.message,
                  }
                );
              }
            }}
          />
        </SlackSheet>
      ) : null}
    </>
  );
}

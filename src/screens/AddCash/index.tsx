import React from 'react';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { ScrollView } from 'react-native';

import { SheetHandle } from '@/components/sheet';
import { deviceUtils } from '@/utils';
import { useDimensions } from '@/hooks';
import { borders } from '@/styles';
import { IS_IOS } from '@/env';
import { Box, Text, Separator, useForegroundColor } from '@/design-system';
import { AppState } from '@/redux/store';
import config from '@/model/config';

import { Ratio } from '@/screens/AddCash/providers/Ratio';
import { Ramp } from '@/screens/AddCash/providers/Ramp';
import { Coinbase } from '@/screens/AddCash/providers/Coinbase';
import { Moonpay } from '@/screens/AddCash/providers/Moonpay';
import { ScreenCornerRadius } from 'react-native-screen-corner-radius';
import * as lang from '@/languages';

const deviceHeight = deviceUtils.dimensions.height;
const statusBarHeight = getStatusBarHeight(true);

export function AddCashSheet() {
  const isRatioEnabled = config.f2c_ratio_enabled;
  const { isNarrowPhone } = useDimensions();
  const insets = useSafeAreaInsets();
  const { accountAddress } = useSelector(({ settings }: AppState) => ({
    accountAddress: settings.accountAddress,
  }));
  const borderColor = useForegroundColor('separatorTertiary');
  const sheetHeight = IS_IOS
    ? deviceHeight - insets.top
    : deviceHeight - statusBarHeight;

  return (
    <Box
      background="surfaceSecondary"
      height={{ custom: sheetHeight }}
      top={{ custom: IS_IOS ? insets.top : statusBarHeight }}
      width="full"
      alignItems="center"
      overflow="hidden"
      style={{
        ...borders.buildRadiusAsObject('top', ScreenCornerRadius || 30),
      }}
    >
      <Box
        position="absolute"
        flexDirection="row"
        justifyContent="center"
        left={{ custom: 0 }}
        right={{ custom: 0 }}
        top={{ custom: 9 }}
        height={{ custom: 80 }}
        style={{ zIndex: 1 }}
      >
        <SheetHandle showBlur={undefined} />
      </Box>

      <ScrollView
        style={{
          width: '100%',
          ...borders.buildRadiusAsObject('top', ScreenCornerRadius || 30),
        }}
      >
        <Box
          width="full"
          paddingTop="52px"
          paddingHorizontal="20px"
          paddingBottom={{ custom: isNarrowPhone ? 15 : insets.bottom + 11 }}
        >
          <Box paddingHorizontal="20px">
            <Text size="26pt" weight="heavy" color="label" align="center">
              Choose a payment option to buy crypto
            </Text>
          </Box>

          <Box paddingVertical="44px" width="full">
            <Separator color="separatorTertiary" />

            <Box paddingTop="20px">
              <Moonpay accountAddress={accountAddress} />
            </Box>

            {isRatioEnabled && (
              <Box paddingTop="20px">
                <Ratio accountAddress={accountAddress} />
              </Box>
            )}

            <Box paddingTop="20px">
              <Ramp accountAddress={accountAddress} />
            </Box>

            <Box paddingTop="20px">
              <Coinbase accountAddress={accountAddress} />
            </Box>

            <Box paddingTop="20px">
              <Box
                padding="20px"
                borderRadius={20}
                style={{
                  borderWidth: 1,
                  borderColor,
                }}
              >
                <Box paddingBottom="12px">
                  <Text size="17pt" weight="bold" color="labelTertiary">
                    􀵲{' '}
                    {lang.t(lang.l.wallet.add_cash_v2.sheet_empty_state.title)}
                  </Text>
                </Box>

                <Text size="15pt" weight="semibold" color="labelQuaternary">
                  {lang.t(
                    lang.l.wallet.add_cash_v2.sheet_empty_state.description
                  )}
                </Text>
              </Box>
            </Box>
          </Box>
        </Box>
      </ScrollView>
    </Box>
  );
}

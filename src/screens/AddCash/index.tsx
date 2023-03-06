import React from 'react';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import { SheetHandle } from '@/components/sheet';
import { deviceUtils } from '@/utils';
import { useDimensions } from '@/hooks';
import { borders } from '@/styles';
import { IS_IOS } from '@/env';
import { Box, Text, Separator, useForegroundColor } from '@/design-system';
import { AppState } from '@/redux/store';

import { Ramp } from '@/screens/AddCash/providers/Ramp';
import { ScreenCornerRadius } from 'react-native-screen-corner-radius';

const deviceHeight = deviceUtils.dimensions.height;
const statusBarHeight = getStatusBarHeight(true);
const sheetHeight =
  deviceHeight -
  statusBarHeight -
  (IS_IOS ? (deviceHeight >= 812 ? 10 : 20) : 0);

export function AddCashSheet() {
  const { isNarrowPhone } = useDimensions();
  const insets = useSafeAreaInsets();
  const { accountAddress } = useSelector(({ settings }: AppState) => ({
    accountAddress: settings.accountAddress,
  }));
  const borderColor = useForegroundColor('separatorTertiary');

  return (
    <Box
      background="surfaceSecondary"
      height={{ custom: IS_IOS ? deviceHeight : sheetHeight }}
      top={{ custom: insets.top + (IS_IOS ? 0 : statusBarHeight) }}
      width="full"
      style={{
        ...borders.buildRadiusAsObject(
          'top',
          IS_IOS ? ScreenCornerRadius || 30 : 16
        ),
      }}
    >
      <Box
        height="full"
        paddingBottom={{ custom: isNarrowPhone ? 15 : insets.bottom + 11 }}
        paddingHorizontal="20px"
        alignItems="center"
      >
        <Box paddingTop="8px" paddingBottom="44px">
          <SheetHandle showBlur={undefined} />
        </Box>

        <Box paddingHorizontal="20px">
          <Text size="26pt" weight="heavy" color="label" align="center">
            Choose a payment option to buy crypto
          </Text>
        </Box>

        <Box paddingVertical="44px" width="full">
          <Separator color="separatorTertiary" />

          <Box paddingVertical="20px">
            <Ramp accountAddress={accountAddress} />
          </Box>

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
                􀵲 {`Can't find your preferred provider?`}
              </Text>
            </Box>

            <Text size="15pt" weight="semibold" color="labelQuaternary">
              Check back soon for more options
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

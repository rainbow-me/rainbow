import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { ScrollView, StatusBar } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import wait from 'w2t';

import { SheetHandle } from '@/components/sheet';
import { deviceUtils } from '@/utils';
import { useDimensions } from '@/hooks';
import { borders } from '@/styles';
import { IS_IOS } from '@/env';
import { Box, Text, Separator, useForegroundColor, useBackgroundColor } from '@/design-system';
import { AppState } from '@/redux/store';
import { getProviders } from '@/resources/f2c';
import Skeleton from '@/components/skeleton/Skeleton';
import Navigation from '@/navigation/Navigation';
import { WrappedAlert } from '@/helpers/alert';
import { logger, RainbowError } from '@/logger';

import { Ramp } from '@/screens/AddCash/providers/Ramp';
import { Coinbase } from '@/screens/AddCash/providers/Coinbase';
import { Moonpay } from '@/screens/AddCash/providers/Moonpay';
import { FiatProviderName } from '@/entities/f2c';
import * as lang from '@/languages';

const deviceHeight = deviceUtils.dimensions.height;
const statusBarHeight = StatusBar.currentHeight || 0;

const providerComponents = {
  [FiatProviderName.Ramp]: Ramp,
  [FiatProviderName.Coinbase]: Coinbase,
  [FiatProviderName.Moonpay]: Moonpay,
};

export function AddCashSheet() {
  const { isNarrowPhone } = useDimensions();
  const insets = useSafeAreaInsets();
  const { accountAddress } = useSelector(({ settings }: AppState) => ({
    accountAddress: settings.accountAddress,
  }));
  const borderColor = useForegroundColor('separatorTertiary');
  const skeletonColor = useBackgroundColor('surfaceSecondaryElevated');
  const sheetHeight = IS_IOS ? deviceHeight - insets.top : deviceHeight + statusBarHeight;

  const {
    isLoading,
    data: providers,
    error,
  } = useQuery(
    ['f2c', 'providers'],
    async () => {
      const [{ data, error }] = await wait(1000, [await getProviders()]);

      if (!data || error) {
        const e = new RainbowError('F2C: failed to fetch providers');

        logger.error(e);

        // throw to useEffect
        throw new Error(e.message);
      }

      return data.providers;
    },
    {
      staleTime: 1000 * 60, // one min
    }
  );

  React.useEffect(() => {
    if (error) {
      Navigation.goBack();

      WrappedAlert.alert(lang.t(lang.l.wallet.add_cash_v2.generic_error.title), lang.t(lang.l.wallet.add_cash_v2.generic_error.message), [
        {
          text: lang.t(lang.l.wallet.add_cash_v2.generic_error.button),
        },
      ]);
    }
  }, [providers, error]);

  return (
    <Box
      background="surfaceSecondary"
      height={{ custom: sheetHeight }}
      top={{ custom: IS_IOS ? insets.top : statusBarHeight }}
      width="full"
      alignItems="center"
      overflow="hidden"
      style={{
        ...borders.buildRadiusAsObject('top', 30),
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
          ...borders.buildRadiusAsObject('top', 30),
        }}
      >
        <Box width="full" paddingTop="52px" paddingHorizontal="20px" paddingBottom={{ custom: isNarrowPhone ? 15 : insets.bottom + 11 }}>
          <Box paddingHorizontal="20px">
            <Text size="26pt" weight="heavy" color="label" align="center">
              {lang.t(lang.l.wallet.add_cash_v2.sheet_title)}
            </Text>
          </Box>

          <Box paddingVertical="44px" width="full">
            <Separator color="separatorTertiary" />

            {!isLoading && providers?.length ? (
              <>
                {providers.map((provider, index) => {
                  const Comp = providerComponents[provider.id];
                  return (
                    <Box key={provider.id} paddingTop="20px">
                      <Comp accountAddress={accountAddress} config={provider} />
                    </Box>
                  );
                })}
              </>
            ) : (
              <>
                {Array(4)
                  .fill(0)
                  .map((_, index) => {
                    const height = 140;
                    return (
                      <Box key={index} paddingTop="20px" height={{ custom: height + 20 }}>
                        <Skeleton skeletonColor={skeletonColor}>
                          <Box background="surfacePrimaryElevated" borderRadius={30} height={{ custom: height }} width="full" />
                        </Skeleton>
                      </Box>
                    );
                  })}
              </>
            )}

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
                    􀵲 {lang.t(lang.l.wallet.add_cash_v2.sheet_empty_state.title)}
                  </Text>
                </Box>

                <Text size="15pt" weight="semibold" color="labelQuaternary">
                  {lang.t(lang.l.wallet.add_cash_v2.sheet_empty_state.description)}
                </Text>
              </Box>
            </Box>
          </Box>
        </Box>
      </ScrollView>
    </Box>
  );
}

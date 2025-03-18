import React, { useEffect, useMemo } from 'react';
import { Image } from 'react-native';
import Animated, { Easing, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import CaretImageSource from '@/assets/family-dropdown-arrow.png';
import { AnimatedText, Box, Inline, Text, useForegroundColor } from '@/design-system';
import * as i18n from '@/languages';
import { useAccountSettings } from '@/hooks';
import { useClaimables } from '@/resources/addys/claimables/query';
import { usePoints } from '@/resources/points';
import { useNativeAsset } from '@/utils/ethereumUtils';
import { ChainId } from '@/state/backendNetworks/types';
import {
  add,
  convertAmountAndPriceToNativeDisplay,
  convertAmountToNativeDisplay,
  convertRawAmountToBalance,
  isZero,
} from '@/helpers/utilities';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { deviceUtils, time } from '@/utils';
import { IS_TEST } from '@/env';
import { DEFI_POSITIONS, ETH_REWARDS, getExperimetalFlag } from '@/config';
import { useRemoteConfig } from '@/model/remoteConfig';
import { usePositionsContext } from './PositionsContext';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { getPositions, usePositions } from '@/resources/defi/PositionsQuery';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { AddysPositionsResponse, PositionsArgs, RainbowPositions } from '@/resources/defi/types';
import { NativeCurrencyKey } from '@/entities';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { Address } from 'viem';
import { logger, RainbowError } from '@/logger';
import { parsePositions } from '@/resources/defi/utils';

const AnimatedImgixImage = Animated.createAnimatedComponent(Image);

const TokenFamilyHeaderAnimationDuration = 200;
const TokenFamilyHeaderHeight = 40;

type PositionsStoreParams = {
  address: Address | string | null;
  currency: NativeCurrencyKey;
};

const STABLE_OBJECT: RainbowPositions = {
  totals: {
    totals: { amount: '0', display: '0' },
    totalLocked: '0',
    borrows: { amount: '0', display: '0' },
    claimables: { amount: '0', display: '0' },
    deposits: { amount: '0', display: '0' },
    stakes: { amount: '0', display: '0' },
    total: { amount: '0', display: '0' },
  },
  positionTokens: [],
  positions: [],
};

export const positionsStore = createQueryStore<RainbowPositions, PositionsStoreParams>({
  fetcher: async ({ address, currency }, abortController) => {
    try {
      if (!address) {
        abortController?.abort();
        return STABLE_OBJECT;
      }
      const response = await getPositions(address, currency, abortController);
      return parsePositions(response, currency);
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return STABLE_OBJECT;
      logger.error(new RainbowError('[positionsStore]: Failed to fetch positions'), { e });
      return STABLE_OBJECT;
    }
  },
  params: {
    address: $ => $(userAssetsStoreManager).address,
    currency: $ => $(userAssetsStoreManager).currency,
  },
  keepPreviousData: true,
  enabled: $ => $(userAssetsStoreManager, state => !!state.address),
  staleTime: time.hours(1),
});

function PositionsBalance() {
  const { isExpanded } = usePositionsContext();
  const positions = positionsStore(state => state.getData());
  const balanceStyles = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isExpanded.value ? 0 : 1, TIMING_CONFIGS.fadeConfig),
    };
  });

  if (!positions) return null;

  return (
    <AnimatedText style={[balanceStyles, { paddingRight: 4 }]} size="20pt" color="label" weight="regular">
      {positions.totals.total.display}
    </AnimatedText>
  );
}

export function PositionsHeader() {
  const caretColor = useForegroundColor('label');
  const { positions_enabled } = useRemoteConfig();
  const positionsEnabled = (positions_enabled || getExperimetalFlag(DEFI_POSITIONS)) && !IS_TEST;
  const { nativeCurrencySymbol } = useAccountSettings();
  const { isExpanded, toggleExpanded } = usePositionsContext();

  const totalValue = positionsStore(state => state.getData()?.totals.total.display);

  const caretStyles = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: withTiming(isExpanded.value ? '90deg' : '0deg', {
            duration: TokenFamilyHeaderAnimationDuration,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          }),
        },
      ],
    };
  });

  if (!positionsEnabled || !totalValue || isZero(totalValue.replace(nativeCurrencySymbol, ''))) return null;

  return (
    <GestureHandlerButton onPressWorklet={toggleExpanded} scaleTo={1.05} testID={`claimables-list-header`}>
      <Box
        width={deviceUtils.dimensions.width}
        height={{ custom: TokenFamilyHeaderHeight }}
        paddingHorizontal="20px"
        justifyContent="space-between"
      >
        <Inline alignHorizontal="justify" alignVertical="center">
          <Text size="22pt" color={'label'} weight="heavy">
            {i18n.t(i18n.l.account.tab_positions)}
          </Text>
          <Inline horizontalSpace={'8px'} alignVertical="center">
            <PositionsBalance />
            <AnimatedImgixImage
              source={CaretImageSource}
              tintColor={caretColor}
              style={[
                caretStyles,
                {
                  height: 18,
                  marginBottom: 1,
                  right: 5,
                  width: 8,
                },
              ]}
            />
          </Inline>
        </Inline>
      </Box>
    </GestureHandlerButton>
  );
}

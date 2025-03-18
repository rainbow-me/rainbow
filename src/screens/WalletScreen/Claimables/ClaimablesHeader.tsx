import React, { useMemo } from 'react';
import { Image } from 'react-native';
import Animated, { Easing, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import CaretImageSource from '@/assets/family-dropdown-arrow.png';
import { AnimatedText, Box, Inline, Text, useForegroundColor } from '@/design-system';
import * as i18n from '@/languages';
import { useAccountSettings } from '@/hooks';
import { getClaimables } from '@/resources/addys/claimables/query';
import { getNativeAssetForNetwork } from '@/utils/ethereumUtils';
import { ChainId } from '@/state/backendNetworks/types';
import {
  add,
  convertAmountAndPriceToNativeDisplay,
  convertAmountToNativeDisplay,
  convertRawAmountToBalance,
  greaterThan,
  isZero,
} from '@/helpers/utilities';
import { deviceUtils, time } from '@/utils';
import { useClaimablesContext } from './ClaimablesContext';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { NativeCurrencyKey } from '@/entities';
import { Address } from 'viem';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { logger, RainbowError } from '@/logger';
import { metadataPOSTClient } from '@/graphql';
import { Claimable } from '@/resources/addys/claimables/types';

const AnimatedImgixImage = Animated.createAnimatedComponent(Image);

const TokenFamilyHeaderAnimationDuration = 200;
const TokenFamilyHeaderHeight = 40;

export type ClaimablesArgs = {
  address: Address | string | null;
  currency: NativeCurrencyKey;
};

export type ClaimablesStore = {
  claimables: Claimable[];
  totalValue: string;
};

const STABLE_OBJECT: ClaimablesStore = {
  claimables: [],
  totalValue: '0',
};

export const claimablesStore = createQueryStore<ClaimablesStore, ClaimablesArgs>({
  fetcher: async ({ address, currency }, abortController) => {
    try {
      if (!address) {
        abortController?.abort();
        return STABLE_OBJECT;
      }

      // Since we expose ETH Rewards as a claimable, we also need to fetch the points data from metadata client
      const points = await metadataPOSTClient.getPointsDataForWallet({ address });
      const claimables = (await getClaimables({ address, currency, abortController })).sort((a, b) =>
        greaterThan(a.value.nativeAsset.amount || '0', b.value.nativeAsset.amount || '0') ? -1 : 1
      );

      if (points?.points?.user?.rewards?.claimable) {
        const ethNativeAsset = await getNativeAssetForNetwork({ chainId: ChainId.mainnet });
        if (ethNativeAsset) {
          const claimableETH = convertRawAmountToBalance(points?.points?.user?.rewards?.claimable || '0', {
            decimals: 18,
            symbol: 'ETH',
          });
          const { amount } = convertAmountAndPriceToNativeDisplay(claimableETH.amount, ethNativeAsset.price?.value || 0, currency);
          if (!isZero(amount)) {
            const ethRewardsClaimable = {
              value: {
                nativeAsset: {
                  amount,
                },
              },
              uniqueId: 'rainbow-eth-rewards',
            } as Claimable;
            claimables.unshift(ethRewardsClaimable);
          }
        }
      }

      return {
        claimables,
        totalValue: claimables.reduce((acc, claimable) => add(acc, claimable.value.nativeAsset.amount || '0'), '0'),
        ethRewardsAmount: points?.points?.user?.rewards?.claimable || '0',
      };
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return STABLE_OBJECT;
      logger.error(new RainbowError('[claimablesStore]: Failed to fetch claimables'), { e });
      return STABLE_OBJECT;
    }
  },
  params: {
    address: $ => $(userAssetsStoreManager).address,
    currency: $ => $(userAssetsStoreManager).currency,
  },
  keepPreviousData: true,
  enabled: $ => $(userAssetsStoreManager, state => !!state.address),
  staleTime: time.minutes(2),
});

function ClaimablesBalance() {
  const { isExpanded } = useClaimablesContext();
  const totalValue = claimablesStore(state => state.getData())?.totalValue || '0';
  const { nativeCurrency } = useAccountSettings();

  const total = useMemo(() => {
    return convertAmountToNativeDisplay(totalValue, nativeCurrency);
  }, [nativeCurrency, totalValue]);

  const balanceStyles = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isExpanded.value ? 0 : 1, TIMING_CONFIGS.fadeConfig),
    };
  });

  return (
    <AnimatedText style={[balanceStyles, { paddingRight: 4 }]} size="20pt" color="label" weight="regular">
      {total}
    </AnimatedText>
  );
}

export function ClaimablesHeader() {
  const caretColor = useForegroundColor('label');
  const { nativeCurrencySymbol } = useAccountSettings();
  const { isExpanded, toggleExpanded } = useClaimablesContext();

  const totalValue = claimablesStore(state => state.getData())?.totalValue || '0';

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

  if (isZero(totalValue.replace(nativeCurrencySymbol, ''))) return null;

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
            {i18n.t(i18n.l.account.tab_claimables)}
          </Text>
          <Inline horizontalSpace={'8px'} alignVertical="center">
            <ClaimablesBalance />
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

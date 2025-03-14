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
import { deviceUtils } from '@/utils';
import { IS_TEST } from '@/env';
import { ETH_REWARDS, getExperimetalFlag } from '@/config';
import { useRemoteConfig } from '@/model/remoteConfig';
import { useClaimablesContext } from './ClaimablesContext';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';

const AnimatedImgixImage = Animated.createAnimatedComponent(Image);

const TokenFamilyHeaderAnimationDuration = 200;
const TokenFamilyHeaderHeight = 40;

type ClaimablesStore = {
  currentAddress: string;
  totalValue: string;
  ethRewardsAmount: string;
  addTotalValue: (totalValue: string) => void;
  setEthRewardsAmount: (ethRewardsAmount: string) => void;
  setCurrentAddress: (currentAddress: string) => void;
  reset: () => void;
};

export const claimablesStore = createRainbowStore<ClaimablesStore>(set => ({
  currentAddress: '',
  totalValue: '0',
  ethRewardsAmount: '0',
  addTotalValue: (totalValue: string) => set(state => ({ totalValue: add(state.totalValue, totalValue) })),
  setEthRewardsAmount: (ethRewardsAmount: string) => set({ ethRewardsAmount }),
  setCurrentAddress: (currentAddress: string) => set({ currentAddress }),
  reset: () => set({ totalValue: '0', ethRewardsAmount: '0' }),
}));

export function ClaimablesSync() {
  const { accountAddress, nativeCurrency } = useAccountSettings();
  const { data: claimables } = useClaimables({ address: accountAddress, currency: nativeCurrency });
  const { data: points } = usePoints({
    walletAddress: accountAddress,
  });

  const eth = useNativeAsset({ chainId: ChainId.mainnet });

  useEffect(() => {
    if (accountAddress !== claimablesStore.getState().currentAddress) {
      claimablesStore.getState().setCurrentAddress(accountAddress);
      claimablesStore.getState().reset();
    }

    if (!claimables?.length && !points?.points?.user?.rewards?.claimable) return;

    if (claimables?.length) {
      for (const claimable of claimables) {
        const amount = claimable.value.nativeAsset.amount ?? '0';
        claimablesStore.getState().addTotalValue(amount);
      }
    }

    if (points?.points?.user?.rewards?.claimable && eth?.price?.value) {
      const claimableETH = convertRawAmountToBalance(points?.points?.user?.rewards?.claimable || '0', {
        decimals: 18,
        symbol: 'ETH',
      });
      const { amount } = convertAmountAndPriceToNativeDisplay(claimableETH.amount, eth?.price?.value || 0, nativeCurrency);
      claimablesStore.getState().addTotalValue(amount);
      claimablesStore.getState().setEthRewardsAmount(amount);
    }
  }, [claimables, points?.points?.user?.rewards?.claimable, eth?.price?.value, accountAddress, nativeCurrency]);

  return null;
}

function ClaimablesBalance() {
  const { isExpanded } = useClaimablesContext();
  const totalValue = claimablesStore(state => state.totalValue);
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
  const { rewards_enabled } = useRemoteConfig();
  const ethRewardsEnabled = (rewards_enabled || getExperimetalFlag(ETH_REWARDS)) && !IS_TEST;
  const { nativeCurrencySymbol } = useAccountSettings();
  const { isExpanded, toggleExpanded } = useClaimablesContext();

  const totalValue = claimablesStore(state => state.totalValue);

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

  if (!ethRewardsEnabled || isZero(totalValue.replace(nativeCurrencySymbol, ''))) return null;

  return (
    <GestureHandlerButton onPressWorklet={toggleExpanded} scaleTo={1.05} testID={`claimables-list-header`}>
      <Box
        width={deviceUtils.dimensions.width}
        height={{ custom: TokenFamilyHeaderHeight }}
        paddingHorizontal={'19px (Deprecated)'}
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

import React from 'react';
import { useClaimables } from '@/resources/addys/claimables/query';
import { claimablesStore } from './ClaimablesHeader';
import { useAccountSettings } from '@/hooks';
import { greaterThan, isZero } from '@/helpers/utilities';
import { useRemoteConfig } from '@/model/remoteConfig';
import { ETH_REWARDS, getExperimetalFlag } from '@/config';
import { IS_TEST } from '@/env';
import { Claimable as ClaimableType } from '@/resources/addys/claimables/types';
import { Claimable, ClaimableHeight } from './Claimable';
import { deviceUtils } from '@/utils';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useClaimablesContext } from './ClaimablesContext';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';

export function Claimables() {
  const { isExpanded } = useClaimablesContext();
  const { rewards_enabled } = useRemoteConfig();
  const ethRewardsEnabled = (rewards_enabled || getExperimetalFlag(ETH_REWARDS)) && !IS_TEST;
  const { accountAddress, nativeCurrency, nativeCurrencySymbol } = useAccountSettings();
  const { totalValue, ethRewardsAmount } = claimablesStore(state => ({
    totalValue: state.totalValue,
    ethRewardsAmount: state.ethRewardsAmount,
  }));

  const { data: claimables = [] } = useClaimables(
    { address: accountAddress, currency: nativeCurrency },
    {
      enabled: !!accountAddress && ethRewardsEnabled,
    }
  );

  const ethRewardsClaimable = {
    value: { nativeAsset: { amount: ethRewardsAmount } },
    uniqueId: 'rainbow-eth-rewards',
  } as ClaimableType;

  const sortedClaimables = [
    ...(claimables ?? []),
    ...(ethRewardsEnabled && !isZero(ethRewardsAmount.replace(nativeCurrencySymbol, '')) ? [ethRewardsClaimable] : []),
  ]?.sort((a, b) => (greaterThan(a.value.nativeAsset.amount ?? '0', b.value.nativeAsset.amount ?? '0') ? -1 : 1));

  const claimablesContainerStyles = useAnimatedStyle(() => {
    const height = sortedClaimables.length * (ClaimableHeight + 20);
    return {
      height: withTiming(isExpanded.value ? height : 0, TIMING_CONFIGS.fadeConfig),
      opacity: withTiming(isExpanded.value ? 1 : 0, TIMING_CONFIGS.fadeConfig),
      pointerEvents: isExpanded.value ? 'auto' : 'none',
    };
  });

  if (!sortedClaimables.length || isZero(totalValue.replace(nativeCurrencySymbol, ''))) return null;

  return (
    <Animated.View style={[claimablesContainerStyles, { gap: 20, width: deviceUtils.dimensions.width }]}>
      {sortedClaimables.map(claimable => (
        <Claimable key={claimable.uniqueId} uniqueId={claimable.uniqueId} claimable={claimable} />
      ))}
    </Animated.View>
  );
}

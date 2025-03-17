import React from 'react';
import { claimablesStore } from './ClaimablesHeader';
import { useAccountSettings, withPerformanceTracking } from '@/hooks';
import { isZero } from '@/helpers/utilities';
import { Claimable as ClaimableType } from '@/resources/addys/claimables/types';
import { Claimable, ClaimableHeight } from './Claimable';
import { deviceUtils } from '@/utils';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useClaimablesContext } from './ClaimablesContext';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';

const STABLE_ARRAY: ClaimableType[] = [];

function ClaimablesComponent() {
  const { isExpanded } = useClaimablesContext();
  const { nativeCurrencySymbol } = useAccountSettings();

  const claimables = claimablesStore(state => state.getData())?.claimables || STABLE_ARRAY;
  const totalValue = claimablesStore(state => state.getData())?.totalValue || '0';

  const claimablesContainerStyles = useAnimatedStyle(() => {
    const height = claimables.length * (ClaimableHeight + 20);
    return {
      height: withTiming(isExpanded.value ? height : 0, TIMING_CONFIGS.fadeConfig),
      opacity: withTiming(isExpanded.value ? 1 : 0, TIMING_CONFIGS.fadeConfig),
      pointerEvents: isExpanded.value ? 'auto' : 'none',
    };
  });

  if (!claimables.length || isZero(totalValue.replace(nativeCurrencySymbol, ''))) return null;

  return (
    <Animated.View style={[claimablesContainerStyles, { gap: 20, width: deviceUtils.dimensions.width }]}>
      {claimables.map(claimable => (
        <Claimable key={claimable.uniqueId} uniqueId={claimable.uniqueId} claimable={claimable} />
      ))}
    </Animated.View>
  );
}

export const Claimables = withPerformanceTracking(ClaimablesComponent);

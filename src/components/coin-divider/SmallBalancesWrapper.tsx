import React, { useMemo } from 'react';
import { OpacityToggler } from '@/components/animations';
import { CoinRowHeight } from '@/components/coin-row';
import { useFrameDelayedValue } from '@/hooks';
import { StyleSheet } from 'react-native';
import { useOpenSmallBalances } from '@/state/wallets/smallBalancesStore';

const sx = StyleSheet.create({
  container: {
    marginTop: 13,
  },
});

type SmallBalancesWrapperProps = {
  assets: React.ReactNode[];
};

export default function SmallBalancesWrapper({ assets = [] }: SmallBalancesWrapperProps) {
  const { isSmallBalancesOpen } = useOpenSmallBalances();
  const delayedIsSmallBalancesOpen = useFrameDelayedValue(isSmallBalancesOpen) && isSmallBalancesOpen;
  const height = useMemo(() => assets.length * CoinRowHeight, [assets.length]);

  return (
    <OpacityToggler
      isVisible={!delayedIsSmallBalancesOpen}
      style={[sx.container, { height, pointerEvents: assets.length > 0 ? 'none' : 'auto' }]}
    >
      {assets}
    </OpacityToggler>
  );
}

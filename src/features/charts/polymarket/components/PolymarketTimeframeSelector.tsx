import React, { memo, useCallback } from 'react';
import { runOnJS, useSharedValue } from 'react-native-reanimated';
import { useStableValue } from '@/hooks/useStableValue';
import { TimeframeSelectorCore, TimeframeOption } from '../../components/TimeframeSelectorCore';
import { polymarketChartsActions, usePolymarketStore } from '../stores/polymarketStore';
import { PolymarketInterval } from '../types';

// ============ Constants ====================================================== //

const POLYMARKET_OPTIONS: ReadonlyArray<TimeframeOption> = [
  { label: '1H', value: '1h' },
  { label: '6H', value: '6h' },
  { label: '1D', value: '1d' },
  { label: '1W', value: '1w' },
  { label: '1M', value: '1m' },
  { label: 'Max', value: 'max' },
];

const INTERVAL_TO_INDEX: Record<PolymarketInterval, number> = {
  '1h': 0,
  '6h': 1,
  '1d': 2,
  '1w': 3,
  '1m': 4,
  'max': 5,
};

// ============ PolymarketTimeframeSelector ==================================== //

const { setChartInterval } = polymarketChartsActions;

export const PolymarketTimeframeSelector = memo(function PolymarketTimeframeSelector({
  backgroundColor,
  color,
}: {
  backgroundColor: string;
  color: string;
}) {
  const initialIndex = useStableValue(() => INTERVAL_TO_INDEX[usePolymarketStore.getState().chartInterval]);
  const selectedIndex = useSharedValue(initialIndex);

  const onSelectWorklet = useCallback(
    (value: string, index: number) => {
      'worklet';
      selectedIndex.value = index;
      runOnJS(setChartInterval)(value as PolymarketInterval);
    },
    [selectedIndex]
  );

  return (
    <TimeframeSelectorCore
      backgroundColor={backgroundColor}
      color={color}
      layout="fill"
      onSelectWorklet={onSelectWorklet}
      options={POLYMARKET_OPTIONS}
      selectedIndex={selectedIndex}
    />
  );
});

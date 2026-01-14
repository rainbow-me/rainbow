import React, { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { Text } from '@/design-system/components/Text/Text';
import { useColorMode } from '@/design-system/color/ColorMode';
import { INTERVAL_LABELS, PolymarketInterval } from '../types';
import { usePolymarketStore } from '../stores/polymarketStore';

// ============ Types ========================================================== //

type PolymarketIntervalSelectorProps = {
  /** Currently selected interval */
  selectedInterval?: PolymarketInterval;
  /** Callback when interval changes */
  onIntervalChange?: (interval: PolymarketInterval) => void;
};

// ============ Constants ====================================================== //

const INTERVALS: PolymarketInterval[] = ['1h', '6h', '1d', '1w', '1m', 'max'];

// ============ Component ====================================================== //

export const PolymarketIntervalSelector = memo(function PolymarketIntervalSelector({
  onIntervalChange,
  selectedInterval: controlledInterval,
}: PolymarketIntervalSelectorProps) {
  const { isDarkMode } = useColorMode();
  const storeInterval = usePolymarketStore(state => state.chartInterval);
  const setStoreInterval = usePolymarketStore(state => state.setChartInterval);

  const selectedInterval = controlledInterval ?? storeInterval;

  const handleIntervalPress = useCallback(
    (interval: PolymarketInterval) => {
      if (onIntervalChange) {
        onIntervalChange(interval);
      } else {
        setStoreInterval(interval);
      }
    },
    [onIntervalChange, setStoreInterval]
  );

  return (
    <View style={styles.container}>
      {INTERVALS.map(interval => {
        const isSelected = interval === selectedInterval;
        return (
          <ButtonPressAnimation
            key={interval}
            onPress={() => handleIntervalPress(interval)}
            scaleTo={0.92}
            style={[
              styles.button,
              isSelected && styles.buttonSelected,
              isSelected && (isDarkMode ? styles.buttonSelectedDark : styles.buttonSelectedLight),
            ]}
          >
            <Text align="center" color={isSelected ? 'label' : 'labelQuaternary'} size="13pt" weight={isSelected ? 'heavy' : 'bold'}>
              {INTERVAL_LABELS[interval]}
            </Text>
          </ButtonPressAnimation>
        );
      })}
    </View>
  );
});

// ============ Styles ========================================================= //

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 17,
    height: 34,
    justifyContent: 'center',
    minWidth: 44,
    paddingHorizontal: 14,
  },
  buttonSelected: {},
  buttonSelectedDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  buttonSelectedLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});

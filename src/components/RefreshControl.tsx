import { memo, useCallback, useMemo, useState } from 'react';
import { RefreshControl as NativeRefreshControl, type RefreshControlProps as NativeRefreshControlProps } from 'react-native';

import { triggerHaptics } from 'react-native-turbo-haptics';

import { useColorMode } from '@/design-system/color/ColorMode';
import { delay } from '@/utils/delay';

type RefreshControlProps = Pick<NativeRefreshControlProps, 'children' | 'style'> & {
  onRefresh: () => Promise<void>;
  /** Minimum refresh duration in milliseconds. Default `600`. */
  minDuration?: number;
};

/**
 * A themed pull-to-refresh control with a minimum refresh duration.
 */
export const RefreshControl = memo(function RefreshControl({ children, onRefresh, minDuration = 600, style }: RefreshControlProps) {
  const [refreshing, setRefreshing] = useState(false);
  const { foregroundColors, backgroundColors } = useColorMode();

  const colors = useMemo(() => [foregroundColors.label], [foregroundColors.label]);

  const handleRefresh = useCallback(async (): Promise<void> => {
    triggerHaptics('impactLight');
    setRefreshing(true);
    const minimumDelay = delay(minDuration);

    try {
      await onRefresh();
    } finally {
      await minimumDelay;
      setRefreshing(false);
    }
  }, [minDuration, onRefresh]);

  return (
    <NativeRefreshControl
      colors={colors}
      onRefresh={handleRefresh}
      progressBackgroundColor={backgroundColors.surfaceSecondaryElevated.color}
      refreshing={refreshing}
      style={style}
      tintColor={foregroundColors.label}
    >
      {children}
    </NativeRefreshControl>
  );
});

import { memo, useCallback, useMemo, useState, type ReactElement } from 'react';
import { RefreshControl as NativeRefreshControl, type RefreshControlProps as NativeRefreshControlProps } from 'react-native';

import { triggerHaptics } from 'react-native-turbo-haptics';

import { useColorMode } from '@/design-system/color/ColorMode';

type RefreshControlProps = Pick<NativeRefreshControlProps, 'children' | 'style'> & {
  onRefresh: () => Promise<void>;
};

export const RefreshControl = memo(function RefreshControl({ onRefresh, children, style }: RefreshControlProps): ReactElement {
  const [refreshing, setRefreshing] = useState(false);
  const { foregroundColors, backgroundColors } = useColorMode();

  const colors = useMemo(() => [foregroundColors.label], [foregroundColors.label]);

  const handleRefresh = useCallback(async (): Promise<void> => {
    triggerHaptics('impactLight');
    setRefreshing(true);

    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

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

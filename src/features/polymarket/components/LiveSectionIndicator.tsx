import { memo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useBackgroundColor, useForegroundColor } from '@/design-system';
import { opacity } from '@/framework/ui/utils/opacity';

const LIVE_INDICATOR_SIZE = 28;
const LIVE_INDICATOR_CUTOUT_SIZE = 16;
const LIVE_INDICATOR_DOT_SIZE = 8;

type LiveSectionIndicatorProps = {
  style?: StyleProp<ViewStyle>;
};

export const LiveSectionIndicator = memo(function LiveSectionIndicator({ style }: LiveSectionIndicatorProps) {
  const backgroundColor = useBackgroundColor('surfacePrimary');
  const liveIndicatorColor = useForegroundColor('red');

  return (
    <View style={[styles.outer, { backgroundColor: opacity(liveIndicatorColor, 0.34) }, style]}>
      <View style={[styles.cutout, { backgroundColor }]}>
        <View style={[styles.dot, { backgroundColor: liveIndicatorColor }]} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  cutout: {
    alignItems: 'center',
    borderRadius: LIVE_INDICATOR_CUTOUT_SIZE / 2,
    height: LIVE_INDICATOR_CUTOUT_SIZE,
    justifyContent: 'center',
    width: LIVE_INDICATOR_CUTOUT_SIZE,
  },
  dot: {
    borderRadius: LIVE_INDICATOR_DOT_SIZE / 2,
    height: LIVE_INDICATOR_DOT_SIZE,
    width: LIVE_INDICATOR_DOT_SIZE,
  },
  outer: {
    alignItems: 'center',
    borderRadius: LIVE_INDICATOR_SIZE / 2,
    height: LIVE_INDICATOR_SIZE,
    justifyContent: 'center',
    width: LIVE_INDICATOR_SIZE,
  },
});

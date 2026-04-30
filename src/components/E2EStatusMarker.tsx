import { StyleSheet, View } from 'react-native';

import { IS_TEST } from '@/env';

type E2EStatusMarkerProps = {
  id: string | null;
};

/**
 * Exposes an invisible test-only anchor for asynchronous setup state.
 */
export function E2EStatusMarker({ id }: E2EStatusMarkerProps) {
  if (!IS_TEST || !id) return null;

  return <View collapsable={false} pointerEvents="none" style={styles.marker} testID={id} />;
}

const styles = StyleSheet.create({
  marker: {
    backgroundColor: 'rgba(0, 0, 0, 0.01)',
    height: 2,
    position: 'absolute',
    right: 0,
    top: 72,
    width: 2,
  },
});

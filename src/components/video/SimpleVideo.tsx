import * as React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
// @ts-ignore
import Video from 'react-native-video';
import logger from 'logger';

export type SimpleVideoProps = {
  readonly style?: ViewStyle;
  readonly uri: string;
  readonly posterUri?: string;
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
});

export default function SimpleVideo({
  style,
  uri,
  posterUri,
}: SimpleVideoProps): JSX.Element {
  const ref = React.useRef<Video>();
  const source = React.useMemo(() => ({ uri }), [uri]);

  // XXX: Force the player to quit when unmounted. (iOS)
  React.useEffect(() => {
    const { current } = ref;
    return () => {
      try {
        !!current &&
          (() => {
            current.setNativeProps({ paused: true });
          })();
      } catch (e) {
        logger.error(e);
      }
    };
  }, [ref]);
  return (
    <View style={[styles.flex, StyleSheet.flatten(style)]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'black' }]} />
      <Video
        controls
        paused
        poster={false && posterUri}
        ref={ref}
        source={source}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

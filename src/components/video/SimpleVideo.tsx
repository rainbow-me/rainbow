import * as React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
// @ts-ignore
import Sound from 'react-native-sound';
import Video from 'react-native-video';
import { useAudio } from '@rainbow-me/hooks';
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
  const { currentSound, isPlayingAsset, fadeTo } = useAudio();

  const [soundOnMount] = React.useState<Sound | null>(
    isPlayingAsset && currentSound ? currentSound : null
  );

  // XXX: Force the player to quit when unmounted. (iOS)
  React.useEffect(() => {
    const { current } = ref;
    !!soundOnMount &&
      (async () => {
        // @ts-ignore
        fadeTo(soundOnMount, 0).then(() => soundOnMount.pause());
      })();
    return () => {
      try {
        !!current &&
          (() => {
            current.setNativeProps({ paused: true });
          })();
        !!soundOnMount &&
          requestAnimationFrame(() => {
            soundOnMount.play();
            // @ts-ignore
            fadeTo(soundOnMount, 1);
          });
      } catch (e) {
        logger.error(e);
      }
    };
  }, [ref, soundOnMount, fadeTo]);
  return (
    <View style={[styles.flex, StyleSheet.flatten(style)]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'black' }]} />
      <Video
        controls={false}
        poster={false && posterUri}
        ref={ref}
        repeat
        resizeMode="cover"
        source={source}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

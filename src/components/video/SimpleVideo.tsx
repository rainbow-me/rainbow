import * as React from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
// @ts-ignore
import Sound from 'react-native-sound';
// @ts-ignore
import Video from 'react-native-video';
import convertToProxyURL from 'react-native-video-cache';
import { useTheme } from '../../context/ThemeContext';
import { useAudio } from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import logger from 'logger';

export type SimpleVideoProps = {
  readonly style?: ViewStyle;
  readonly uri: string;
  readonly posterUri?: string;
  readonly loading: boolean;
  readonly setLoading: (isLoading: boolean) => void;
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
});

export default function SimpleVideo({
  style,
  uri,
  posterUri,
  loading,
  setLoading,
}: SimpleVideoProps): JSX.Element {
  const { colors } = useTheme();
  const { white } = colors;
  const ref = React.useRef<Video>();
  const source = React.useMemo(
    () => ({
      uri: convertToProxyURL(uri),
    }),
    [uri]
  );
  const { currentSound, isPlayingAsset, fadeTo } = useAudio();
  const [opacity] = React.useState<Animated.Value>(
    () => new Animated.Value(loading ? 1 : 0)
  );

  const [soundOnMount] = React.useState<Sound | null>(
    isPlayingAsset && currentSound ? currentSound : null
  );

  React.useEffect(() => {
    Animated.timing(opacity, {
      duration: 1000,
      toValue: loading ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [opacity, loading]);

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
  const onLoad = React.useCallback(() => setLoading(false), [setLoading]);
  return (
    <View style={[styles.flex, StyleSheet.flatten(style)]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: white }]} />
      <Video
        controls
        onLoad={onLoad}
        ref={ref}
        repeat
        resizeMode="cover"
        source={source}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        pointerEvents={loading ? 'auto' : 'none'}
        style={[StyleSheet.absoluteFill, { opacity }]}
      >
        <ImgixImage
          source={{ uri: posterUri }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

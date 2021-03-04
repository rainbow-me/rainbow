import * as React from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
// @ts-ignore
import Sound from 'react-native-sound';
// @ts-ignore
import Video from 'react-native-video';
import convertToProxyURL from 'react-native-video-cache';
import styled from 'styled-components';
import { useAudio } from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import { position } from '@rainbow-me/styles';
import logger from 'logger';

export type SimpleVideoProps = {
  readonly style?: ViewStyle;
  readonly uri: string;
  readonly posterUri?: string;
  readonly loading: boolean;
  readonly setLoading: (isLoading: boolean) => void;
};

const absoluteFill = `
  position: absolute;
  ${position.size('100%')}
`;

const StyledBackground = styled(View)`
  ${absoluteFill}
  background-color: ${({ theme: { colors } }) => colors.white};
`;

const StyledVideo = styled(Video)`
  ${absoluteFill}
`;

const StyledPosterContainer = styled(Animated.View)`
  ${absoluteFill}
`;

const StyledImgixImage = styled(ImgixImage)`
  ${position.size('100%')}
`;

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
    if (soundOnMount) {
      // @ts-ignore
      fadeTo(soundOnMount, 0).then(() => soundOnMount.pause());
    }
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
      <StyledBackground />
      <StyledVideo
        controls
        onLoad={() => setLoading(false)}
        ref={ref}
        repeat
        resizeMode="cover"
        source={source}
      />
      <StyledPosterContainer
        pointerEvents={loading ? 'auto' : 'none'}
        style={{ opacity }}
      >
        <StyledImgixImage source={{ uri: posterUri }} />
      </StyledPosterContainer>
    </View>
  );
}

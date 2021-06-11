import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
// @ts-ignore
import Video from 'react-native-video';
import convertToProxyURL from 'react-native-video-cache';
import styled from 'styled-components';
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
  const ref = useRef<Video>();
  const source = useMemo(
    () => ({
      uri: convertToProxyURL(uri),
    }),
    [uri]
  );
  const [opacity] = useState<Animated.Value>(
    () => new Animated.Value(loading ? 1 : 0)
  );

  useEffect(() => {
    Animated.timing(opacity, {
      duration: 1000,
      toValue: loading ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [opacity, loading]);

  // HACK: Force the player to quit when unmounted. (iOS)
  useEffect(() => {
    const { current } = ref;
    return () => {
      try {
        current?.setNativeProps({ paused: true });
      } catch (e) {
        logger.error(e);
      }
    };
  }, [ref]);
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

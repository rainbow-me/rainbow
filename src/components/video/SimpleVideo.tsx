import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import Video, { VideoRef } from 'react-native-video';
import { ImgixImage } from '@/components/images';
import styled from '@/styled-thing';
import { position } from '@/styles';
import logger from '@/utils/logger';

export type SimpleVideoProps = {
  readonly style?: ViewStyle;
  readonly uri: string;
  readonly posterUri?: string;
  readonly loading: boolean;
  readonly setLoading: (isLoading: boolean) => void;
};

const absoluteFill = {
  position: 'absolute',
  ...position.sizeAsObject('100%'),
};

const StyledBackground = styled(View)({
  ...absoluteFill,
  // @ts-expect-error colors has any type
  backgroundColor: ({ theme: { colors } }) => colors.white,
});

const StyledVideo = styled(Video)(absoluteFill);

const StyledPosterContainer = styled(Animated.View)(absoluteFill);

const StyledImgixImage = styled(ImgixImage)(position.sizeAsObject('100%'));

const styles = StyleSheet.create({
  flex: { flex: 1 },
});

export default function SimpleVideo({ style, uri, posterUri, loading, setLoading }: SimpleVideoProps): JSX.Element {
  const ref = useRef<VideoRef>();
  const [opacity] = useState<Animated.Value>(() => new Animated.Value(loading ? 1 : 0));

  useEffect(() => {
    Animated.timing(opacity, {
      duration: 225,
      toValue: loading ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [opacity, loading]);

  // HACK: Force the player to quit when unmounted. (iOS)
  useLayoutEffect(() => {
    const current = ref?.current;
    return () => {
      try {
        current?.pause();
      } catch (e) {
        logger.error(e);
      }
    };
  }, [ref]);
  return (
    <View style={[styles.flex, StyleSheet.flatten(style)]}>
      <StyledBackground />
      <StyledVideo ignoreSilentSwitch="obey" onLoad={() => setLoading(false)} ref={ref} repeat resizeMode="cover" source={{ uri }} />
      <StyledPosterContainer pointerEvents={loading ? 'auto' : 'none'} style={{ opacity }}>
        <StyledImgixImage source={{ uri: posterUri }} />
      </StyledPosterContainer>
    </View>
  );
}

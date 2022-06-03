import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native';
// @ts-ignore
import Video from 'react-native-video';
import convertToProxyURL from 'react-native-video-cache';
import { ImgixImage } from '@rainbow-me/images';
import styled from '@rainbow-me/styled-components';
import { position } from '@rainbow-me/styles';
import logger from 'logger';

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
  // @ts-ignore
  backgroundColor: ({ theme: { colors } }) => colors.white,
});

const StyledVideo = styled(Video)(absoluteFill);

const StyledPosterContainer = styled(Animated.View)(absoluteFill);

const StyledImgixImage = styled(ImgixImage)(position.sizeAsObject('100%'));

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
  const [controlsEnabled, setControlsEnabled] = useState(false);
  const [opacity] = useState<Animated.Value>(
    () => new Animated.Value(loading ? 1 : 0)
  );

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
        current?.setNativeProps?.({ paused: true });
      } catch (e) {
        logger.error(e);
      }
    };
  }, [ref]);
  return (
    <TouchableWithoutFeedback
      onPress={() => !controlsEnabled && setControlsEnabled(true)}
    >
      <View style={[styles.flex, StyleSheet.flatten(style)]}>
        <StyledBackground />
        <StyledVideo
          controls={controlsEnabled}
          ignoreSilentSwitch="obey"
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
    </TouchableWithoutFeedback>
  );
}

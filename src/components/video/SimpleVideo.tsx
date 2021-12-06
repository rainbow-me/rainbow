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
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import Video from 'react-native-video';
import convertToProxyURL from 'react-native-video-cache';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/images' or its cor... Remove this comment to see the full error message
import { ImgixImage } from '@rainbow-me/images';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'logger' or its corresponding t... Remove this comment to see the full error message
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <TouchableWithoutFeedback
      onPress={() => !controlsEnabled && setControlsEnabled(true)}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <View style={[styles.flex, StyleSheet.flatten(style)]}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <StyledBackground />
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <StyledVideo
          controls={controlsEnabled}
          onLoad={() => setLoading(false)}
          ref={ref}
          repeat
          resizeMode="cover"
          source={source}
        />
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <StyledPosterContainer
          pointerEvents={loading ? 'auto' : 'none'}
          style={{ opacity }}
        >
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <StyledImgixImage source={{ uri: posterUri }} />
        </StyledPosterContainer>
      </View>
    </TouchableWithoutFeedback>
  );
}

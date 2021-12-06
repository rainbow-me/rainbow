import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { WebView } from 'react-native-webview';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/images' or its cor... Remove this comment to see the full error message
import { ImgixImage } from '@rainbow-me/images';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding, position } from '@rainbow-me/styles';

export type ModelViewerProps = {
  readonly setLoading: (loading: boolean) => void;
  readonly loading: boolean;
  readonly style?: ViewStyle;
  readonly uri: string;
  readonly alt?: string;
  readonly fallbackUri?: string;
};

const StyledWebView = styled(WebView)`
  ${position.size('100%')};
`;

const ProgressIndicatorContainer = styled(Animated.View)`
  ${position.size('100%')};
  position: absolute;
  align-items: flex-end;
  justify-content: flex-end;
  ${padding(10)};
`;

const getSource = ({ alt, uri }: { alt?: string; uri: string }) =>
  `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <script type="module" src="https://unpkg.com/@google/model-viewer@0.6.0/dist/model-viewer.js"></script>
  <script nomodule src="https://unpkg.com/@google/model-viewer@0.6.0/dist/model-viewer-legacy.js"></script>
  <title>GLBModelViewer</title>
  <style>
    * { margin:0; padding:0; }
    html { height: 100%; width: 100%; }
    body { height: 100%; width: 100%; }
    model-viewer { width: 100%; height: 100% }
  </style>
</head>
<body>
  <model-viewer src=${JSON.stringify(uri)} alt=${JSON.stringify(
    typeof alt === 'string' ? alt : ''
  )} auto-rotate camera-controls autoplay shadow-intensity="1">
    <div slot="progress-bar"></div>
  </model-viewer>
  <script type="text/javascript">
    function shouldPostMessage(type, payload) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: type,
        payload: payload,
      }));
    }
    var modelViewer = document.querySelector("model-viewer");
    modelViewer.addEventListener("progress", function (e) {
      shouldPostMessage("progress", e.detail.totalProgress);
    });
    modelViewer.addEventListener("model-visibility", function (e) {
      shouldPostMessage("model-visibility", !!e.detail.visible);
    });
  </script>
</body>
</html>
`.trim();

export default function ModelViewer({
  loading,
  setLoading,
  style,
  uri,
  alt,
  fallbackUri,
}: ModelViewerProps): JSX.Element {
  const opacity = useMemo(() => new Animated.Value(1), []);
  const [visibility, setVisibility] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const originWhiteList = useMemo(() => ['*'], []);
  const onMessage = useCallback(
    ({ nativeEvent: { data } }) => {
      const { type, payload } = JSON.parse(data);
      if (type === 'progress') {
        setProgress(payload as number);
      } else if (type === 'model-visibility') {
        setVisibility(payload as boolean);
      }
    },
    [setProgress, setVisibility]
  );
  const source = useMemo(() => ({ html: getSource({ alt, uri }) }), [alt, uri]);

  const didLoadModel = !!visibility && progress === 1;
  useEffect(() => {
    setLoading(!didLoadModel);
  }, [didLoadModel, setLoading]);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, {
        duration: 120,
        toValue: loading ? 1 : 0,
        useNativeDriver: true,
      }),
    ]).start();
  }, [loading, opacity]);
  const { panHandlers } = useMemo(
    () =>
      PanResponder.create({
        onPanResponderTerminationRequest: () => loading,
        onStartShouldSetPanResponderCapture: () => !loading,
      }),
    [loading]
  );
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <View style={style} {...panHandlers}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <StyledWebView
        cacheEnabled
        onMessage={onMessage}
        originWhitelist={originWhiteList}
        source={source}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ProgressIndicatorContainer
        pointerEvents={loading ? 'auto' : 'none'}
        style={{ opacity }}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <ImgixImage
          source={{ uri: fallbackUri }}
          style={StyleSheet.absoluteFill}
        />
      </ProgressIndicatorContainer>
    </View>
  );
}

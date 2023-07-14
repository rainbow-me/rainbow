import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { ImgixImage } from '@/components/images';
import styled from '@/styled-thing';
import { padding, position } from '@/styles';
import { FULL_NFT_IMAGE_SIZE } from '@/utils/handleNFTImages';

export type ModelViewerProps = {
  readonly setLoading: (loading: boolean) => void;
  readonly loading: boolean;
  readonly size: number;
  readonly style?: ViewStyle;
  readonly uri: string;
  readonly alt?: string;
  readonly fallbackUri?: string;
};

const StyledWebView = styled(WebView)({
  ...position.sizeAsObject('100%'),
});

const ProgressIndicatorContainer = styled(Animated.View)({
  ...position.sizeAsObject('100%'),
  alignItems: 'flex-end',
  justifyContent: 'flex-end',
  position: 'absolute',
  ...padding.object(10),
});

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
    ({ nativeEvent: { data } }: WebViewMessageEvent) => {
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
    <View style={style} {...panHandlers}>
      <StyledWebView
        cacheEnabled
        onMessage={onMessage}
        originWhitelist={originWhiteList}
        source={source}
      />
      <ProgressIndicatorContainer
        pointerEvents={loading ? 'auto' : 'none'}
        style={{ opacity }}
      >
        <ImgixImage
          source={{ uri: fallbackUri }}
          style={StyleSheet.absoluteFill}
          size={FULL_NFT_IMAGE_SIZE}
        />
      </ProgressIndicatorContainer>
    </View>
  );
}

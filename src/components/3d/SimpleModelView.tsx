import * as React from 'react';
import {
  ActivityIndicator,
  Animated,
  PanResponder,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { ImgixImage } from '@rainbow-me/images';

export type ModelViewerProps = {
  readonly style?: ViewStyle;
  readonly uri?: string;
  readonly alt?: string;
  readonly fallbackUri?: string;
};

const styles = StyleSheet.create({
  bottomRight: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    padding: 10,
  },
  flex: { flex: 1 },
});

export default function ModelViewer({
  style,
  uri,
  alt,
  fallbackUri,
}: ModelViewerProps): JSX.Element {
  const opacity = React.useMemo(() => new Animated.Value(1), []);
  const [visibility, setVisibility] = React.useState<boolean>(false);
  const [progress, setProgress] = React.useState<number>(0);
  const originWhiteList = React.useMemo(() => ['*'], []);
  const onMessage = React.useCallback(
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
  const fallbackSource = React.useMemo(
    () => ({
      uri: fallbackUri,
    }),
    [fallbackUri]
  );
  const source = React.useMemo(
    () => ({
      html: `
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
    `.trim(),
    }),
    [alt, uri]
  );
  const loaded = React.useMemo(() => !!visibility && progress === 1, [
    progress,
    visibility,
  ]);
  React.useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, {
        duration: 120,
        toValue: loaded ? 0 : 1,
        useNativeDriver: true,
      }),
    ]).start();
  }, [loaded, opacity]);
  const { panHandlers } = React.useMemo(
    () =>
      PanResponder.create({
        onPanResponderTerminationRequest: () => !loaded,
        onStartShouldSetPanResponderCapture: () => loaded,
      }),
    [loaded]
  );
  return (
    <View style={style} {...panHandlers}>
      <WebView
        cacheEnabled
        onMessage={onMessage}
        originWhitelist={originWhiteList}
        source={source}
        style={styles.flex}
      />
      <Animated.View
        pointerEvents={loaded ? 'none' : 'auto'}
        style={[StyleSheet.absoluteFill, styles.bottomRight, { opacity }]}
      >
        <ImgixImage source={fallbackSource} style={StyleSheet.absoluteFill} />
        <ActivityIndicator />
      </Animated.View>
    </View>
  );
}

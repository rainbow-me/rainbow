import * as React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';

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
  const source = React.useMemo(
    () => ({
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="x-ua-compatible" content="ie=edge, chrome=1" />
  <title>Render a Video Inline</title>
  <style>
    * { margin:0; padding:0; }
    html { height: 100%; width: 100%; }
    body { height: 100%; width: 100%; }
    video { height: 100%; width: 100%; outline: none !important; }
  </style>
</head>
<body>
<video controls preload="auto" poster=${JSON.stringify(
        typeof posterUri === 'string' ? posterUri : ''
      )}>
  <source src=${JSON.stringify(uri)} type="video/mp4">
</video>
</body>
</html>
    `.trim(),
    }),
    [uri, posterUri]
  );
  const originWhiteList = React.useMemo(() => ['*'], []);
  return (
    <View style={style}>
      <WebView
        cacheEnabled
        originWhitelist={originWhiteList}
        source={source}
        style={[styles.flex]}
      />
    </View>
  );
}

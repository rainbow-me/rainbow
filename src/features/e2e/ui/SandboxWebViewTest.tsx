import { type WebViewTest } from '../core/sandboxSecurityTest';
import { StyleSheet } from 'react-native';
import WebView from 'react-native-webview';

export function SandboxWebViewTest({ onError, onHttpError }: WebViewTest) {
  return <WebView source={{ uri: 'https://example.com' }} sandbox style={sx.hidden} onError={onError} onHttpError={onHttpError} />;
}

const sx = StyleSheet.create({
  hidden: {
    height: 0,
    position: 'absolute',
    width: 0,
  },
});

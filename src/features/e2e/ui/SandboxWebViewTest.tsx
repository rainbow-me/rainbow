import { type WebViewTests } from '../core/sandboxSecurityTest';
import { StyleSheet, View } from 'react-native';
import WebView from 'react-native-webview';

// Navigates to a blocked domain after the allowed page loads
const NAVIGATE_JS = `
  setTimeout(function() {
    window.location.href = 'https://example.com';
  }, 2000);
  setTimeout(function() {
    window.ReactNativeWebView.postMessage(window.location.href);
  }, 4000);
  true;
`;

export function SandboxWebViewTest({ initialLoad, jsNavigation }: WebViewTests) {
  return (
    <View style={sx.container}>
      <WebView source={{ uri: 'https://example.com' }} sandbox style={sx.webview} onError={initialLoad.onError} />
      <WebView
        source={{ uri: 'https://rainbow.me' }}
        sandbox
        style={sx.webview}
        injectedJavaScript={NAVIGATE_JS}
        onMessage={jsNavigation.onMessage}
      />
    </View>
  );
}

const sx = StyleSheet.create({
  container: {
    flexDirection: 'row',
    left: 20,
    position: 'absolute',
    right: 20,
    top: 300,
  },
  webview: {
    borderColor: 'red',
    borderWidth: 2,
    flex: 1,
    height: 200,
  },
});

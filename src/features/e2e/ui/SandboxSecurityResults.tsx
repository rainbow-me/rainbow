import { type SandboxTestResult, type WebViewTest } from '../core/sandboxSecurityTest';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import WebView from 'react-native-webview';

interface Props {
  results: SandboxTestResult[];
  webViewTest?: WebViewTest;
}

export function SandboxSecurityResults({ results, webViewTest }: Props) {
  const [webViewResult, setWebViewResult] = useState<SandboxTestResult | null>(null);

  useEffect(() => {
    if (webViewTest) {
      webViewTest.promise.then(setWebViewResult);
    }
  }, [webViewTest]);

  const allResults = webViewResult ? [...results, webViewResult] : results;
  const allDone = !webViewTest || webViewResult !== null;
  const allPassed = allDone && allResults.every(r => r.passed);

  return (
    <View style={sx.overlay} testID={allDone ? 'sandbox-test-results' : undefined}>
      <Text style={sx.status} testID="sandbox-test-status">
        {!allDone ? 'SANDBOX_TEST_RUNNING' : allPassed ? 'SANDBOX_TEST_PASSED' : 'SANDBOX_TEST_FAILED'}
      </Text>
      {allResults.map(r => (
        <Text key={r.name} style={sx.result} testID={`sandbox-${r.name}`}>
          {`${r.name}: ${r.passed ? 'PASS' : 'FAIL'} - ${r.detail}`}
        </Text>
      ))}
      {webViewTest && (
        <WebView
          source={{ uri: 'https://example.com' }}
          sandbox
          style={sx.hiddenWebView}
          onError={webViewTest.onError}
          onHttpError={webViewTest.onHttpError}
        />
      )}
    </View>
  );
}

const sx = StyleSheet.create({
  hiddenWebView: {
    height: 0,
    position: 'absolute',
    width: 0,
  },
  overlay: {
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 9999,
    left: 20,
    padding: 16,
    position: 'absolute',
    right: 20,
    top: 120,
    zIndex: 9999,
  },
  result: {
    color: '#333',
    fontSize: 13,
    marginTop: 6,
  },
  status: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

import { useEffect } from 'react';
import { StyleSheet } from 'react-native';

import WebView from 'react-native-webview';

import { ALLOWED_URL } from '../../core/models/hosts';
import { classifyWebViewAllowed } from '../../core/services/classifier';
import { useReportOnce } from '../hooks/useReportOnce';

// Depends on real network reachability, so it gets a long window.
const ALLOWED_TIMEOUT_MS = 12000;

/**
 * Verifies the allow-listed page loads in a WebView. The overlay mounts this only
 * while the case is running, so each run gets a fresh instance. Pass on `onLoad`;
 * fail on `onError` or no load within the window.
 */
export function WebViewAllowedProbe() {
  const report = useReportOnce('webview_allowed');

  useEffect(() => {
    const timeout = setTimeout(() => report(classifyWebViewAllowed(false)), ALLOWED_TIMEOUT_MS);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <WebView
      source={{ uri: ALLOWED_URL }}
      sandbox
      style={styles.webview}
      onLoad={() => report(classifyWebViewAllowed(true))}
      onError={() => report(classifyWebViewAllowed(false))}
    />
  );
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
  },
});

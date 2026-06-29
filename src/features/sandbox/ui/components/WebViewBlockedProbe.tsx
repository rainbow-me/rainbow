import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';

import WebView from 'react-native-webview';

import { BLOCKED_HOST, BLOCKED_URL } from '../../core/models/hosts';
import { classifyWebViewBlocked } from '../../core/services/classifier';
import { useReportOnce } from '../hooks/useReportOnce';

// No event within this window means the blocked host never loaded (iOS cancels
// the navigation silently), which is a pass.
const BLOCKED_TIMEOUT_MS = 8000;
// Android fires a spurious onLoad for the stopped page in addition to the block
// error. An onLoad of the blocked host counts as a breach only if no block error
// lands within this window, giving the authoritative onError time to win.
const BLOCKED_CONFIRM_MS = 1500;

/**
 * Verifies a navigation to the blocked host is prevented. The sandbox surfaces a
 * block differently per platform, so the authoritative pass is the block *error*,
 * not onLoad:
 *  - Android fires onError ("Navigation blocked by sandbox") AND a spurious
 *    onLoad for the stopped page, so onError is the pass, and a lone onLoad is a
 *    breach only if no error follows within BLOCKED_CONFIRM_MS.
 *  - iOS cancels the navigation silently (no event), so no load within the
 *    window is the pass.
 * A genuine load of the blocked host with no block error is the only failure.
 */
export function WebViewBlockedProbe() {
  const report = useReportOnce('webview_blocked');
  const breachTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const timeout = setTimeout(() => report(classifyWebViewBlocked(false)), BLOCKED_TIMEOUT_MS);
    return () => {
      clearTimeout(timeout);
      clearTimeout(breachTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <WebView
      source={{ uri: BLOCKED_URL }}
      sandbox
      style={styles.webview}
      // The sandbox reports a blocked navigation as a load error; that's the
      // authoritative pass and beats any pending breach verdict.
      onError={() => report(classifyWebViewBlocked(false))}
      onLoad={(event: { nativeEvent: { url: string } }) => {
        const { url } = event.nativeEvent;
        // Android fires this onLoad even when it blocked, so a load of the blocked
        // host is only a breach if no block error follows shortly.
        if (url.includes(BLOCKED_HOST)) {
          clearTimeout(breachTimer.current);
          breachTimer.current = setTimeout(() => report(classifyWebViewBlocked(true, url)), BLOCKED_CONFIRM_MS);
        }
      }}
    />
  );
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
  },
});

import { type SandboxTestResult, type WebViewTests, createWebViewTests, runSandboxTests } from '../core/sandboxSecurityTest';
import { savePIN } from '@/handlers/authentication';
import { logger } from '@/logger';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { initializeWallet } from '@/state/wallets/initializeWallet';
import { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import URL from 'url-parse';
import { SandboxSecurityResults } from './SandboxSecurityResults';
import { SandboxWebViewTest } from './SandboxWebViewTest';

/**
 * Handles E2E test commands. See e2e/README.md:31 for usage.
 */
export function TestDeeplinkHandler() {
  const [results, setResults] = useState<SandboxTestResult[] | null>(null);
  const [webViewTests, setWebViewTests] = useState<WebViewTests | undefined>();
  const [webViewDone, setWebViewDone] = useState(false);

  useEffect(() => {
    const listener = Linking.addListener('url', async ({ url }) => {
      const { protocol, host, pathname, query } = new URL(url, true);
      if (protocol !== 'rainbow:' || host !== 'e2e') {
        return;
      }

      const action = pathname.split('/')[1];

      switch (action) {
        case 'import':
          await savePIN('1111');
          await initializeWallet({
            seedPhrase: query.privateKey,
            name: query.name,
            userPin: '1111',
          });
          Navigation.replace(Routes.SWIPE_LAYOUT, {
            screen: Routes.WALLET_SCREEN,
          });
          break;
        case 'sandbox-test': {
          const wvTests = createWebViewTests();
          setWebViewTests(wvTests);
          Promise.all([wvTests.initialLoad.promise, wvTests.jsNavigation.promise]).then(wvResults => {
            setResults(prev => (prev ? [...prev, ...wvResults] : wvResults));
            setWebViewDone(true);
          });
          const syncResults = await runSandboxTests();
          setResults(syncResults);
          break;
        }
        default:
          logger.debug(`[TestDeeplinkHandler]: unknown path`, { url });
          break;
      }
    });
    return listener.remove;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (results) {
    return (
      <>
        <SandboxSecurityResults results={results} allDone={webViewDone} />
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        {webViewTests && <SandboxWebViewTest {...webViewTests} />}
      </>
    );
  }

  return null;
}

import { type SandboxTestResult, type WebViewTest, createWebViewTest, runSandboxTests } from '../core/sandboxSecurityTest';
import { savePIN } from '@/handlers/authentication';
import { logger } from '@/logger';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { initializeWallet } from '@/state/wallets/initializeWallet';
import { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import URL from 'url-parse';
import { SandboxSecurityResults } from './SandboxSecurityResults';

/**
 * Handles E2E test commands. See e2e/README.md:31 for usage.
 */
export function TestDeeplinkHandler() {
  const [sandboxResults, setSandboxResults] = useState<SandboxTestResult[] | null>(null);
  const [webViewTest, setWebViewTest] = useState<WebViewTest | undefined>();

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
          const wvTest = createWebViewTest();
          const results = await runSandboxTests();
          setSandboxResults(results);
          setWebViewTest(wvTest);
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

  if (sandboxResults) {
    return <SandboxSecurityResults results={sandboxResults} webViewTest={webViewTest} />;
  }

  return null;
}

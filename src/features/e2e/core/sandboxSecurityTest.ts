export interface SandboxTestResult {
  name: string;
  passed: boolean;
  detail: string;
}

export interface WebViewTests {
  initialLoad: { promise: Promise<SandboxTestResult>; onError: () => void };
  jsNavigation: { promise: Promise<SandboxTestResult>; onMessage: (event: { nativeEvent: { data: string } }) => void };
}

async function testHttpBlocked(): Promise<SandboxTestResult> {
  try {
    const response = await fetch('https://example.com');
    if (response.status === 500) {
      return { name: 'http_blocked', passed: true, detail: 'blocked with status 500' };
    }
    return { name: 'http_blocked', passed: false, detail: `unexpected status ${response.status}` };
  } catch (e) {
    return { name: 'http_blocked', passed: false, detail: `unexpected error: ${(e as Error).message}` };
  }
}

async function testHttpAllowed(): Promise<SandboxTestResult> {
  try {
    const response = await fetch('https://rainbow.me');
    if (response.ok) {
      return { name: 'http_allowed', passed: true, detail: `allowed with status ${response.status}` };
    }
    return { name: 'http_allowed', passed: false, detail: `unexpected status ${response.status}` };
  } catch (e) {
    return { name: 'http_allowed', passed: false, detail: `blocked with error: ${(e as Error).message}` };
  }
}

function testWsBlocked(): Promise<SandboxTestResult> {
  return new Promise(resolve => {
    let errorFired = false;

    try {
      const ws = new WebSocket('wss://example.com');
      ws.onopen = () => {
        ws.close();
        resolve({ name: 'ws_blocked', passed: false, detail: 'connection opened' });
      };
      ws.onerror = () => {
        errorFired = true;
        resolve({ name: 'ws_blocked', passed: false, detail: 'not blocked (server rejected upgrade)' });
      };
      ws.onclose = () => {
        if (errorFired) return;
        resolve({ name: 'ws_blocked', passed: true, detail: 'blocked (connection closed)' });
      };
    } catch (e) {
      resolve({ name: 'ws_blocked', passed: false, detail: `unexpected error: ${(e as Error).message}` });
    }
  });
}

function testNativeModuleBlocked(): SandboxTestResult {
  try {
    const { NativeModules } = require('react-native');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _module = NativeModules.RNRestart;
    return { name: 'native_module_blocked', passed: false, detail: 'no error thrown' };
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes('unexpected behavior')) {
      return { name: 'native_module_blocked', passed: true, detail: 'blocked: Native Module unexpected behavior detected' };
    }
    return { name: 'native_module_blocked', passed: false, detail: `unexpected error: ${msg}` };
  }
}

/**
 * Creates two WebView tests:
 * 1. initialLoad — loads a blocked URL directly, expects onError
 * 2. jsNavigation — loads an allowed page, attempts JS navigation to blocked URL,
 *    then reports current URL via onMessage. If blocked, URL stays on allowed domain.
 */
export function createWebViewTests(): WebViewTests {
  let resolveInitial: (result: SandboxTestResult) => void;
  const initialPromise = new Promise<SandboxTestResult>(r => {
    resolveInitial = r;
  });

  let resolveJs: (result: SandboxTestResult) => void;
  const jsPromise = new Promise<SandboxTestResult>(r => {
    resolveJs = r;
  });

  return {
    initialLoad: {
      promise: initialPromise,
      onError: () => {
        resolveInitial({ name: 'webview_initial_blocked', passed: true, detail: 'blocked by onError' });
      },
    },
    jsNavigation: {
      promise: jsPromise,
      onMessage: (event: { nativeEvent: { data: string } }) => {
        const url = event.nativeEvent.data;
        const blocked = !url.includes('example.com');
        resolveJs({
          name: 'webview_js_nav_blocked',
          passed: blocked,
          detail: blocked ? `blocked: still on ${url}` : `not blocked: navigated to ${url}`,
        });
      },
    },
  };
}

export async function runSandboxTests(): Promise<SandboxTestResult[]> {
  const results: SandboxTestResult[] = [];
  results.push(await testHttpBlocked());
  results.push(await testHttpAllowed());
  results.push(await testWsBlocked());
  results.push(testNativeModuleBlocked());
  return results;
}

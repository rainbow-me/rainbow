import { logger } from '@/logger';

export interface SandboxTestResult {
  name: string;
  passed: boolean;
  detail: string;
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
    const response = await fetch('https://rainbow-me.github.io');
    return { name: 'http_allowed', passed: true, detail: `allowed with status ${response.status}` };
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

export async function runSandboxTests(): Promise<SandboxTestResult[]> {
  const results: SandboxTestResult[] = [];
  results.push(await testHttpBlocked());
  results.push(await testHttpAllowed());
  results.push(await testWsBlocked());
  logger.info('[SandboxTest] results', { results });
  return results;
}

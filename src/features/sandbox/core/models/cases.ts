export type SandboxChannel = 'http' | 'webview';
export type SandboxTestCaseId = 'http_allowed' | 'http_blocked' | 'webview_allowed' | 'webview_blocked';
export type SandboxTestCaseStatus = 'idle' | 'running' | 'pass' | 'fail';

export interface SandboxTestCase {
  id: SandboxTestCaseId;
  channel: SandboxChannel;
  status: SandboxTestCaseStatus;
  detail?: string;
}

export interface SandboxTestCaseResult {
  passed: boolean;
  detail: string;
}

export const SANDBOX_TEST_CASES: SandboxTestCase[] = [
  { id: 'http_allowed', channel: 'http', status: 'idle' },
  { id: 'http_blocked', channel: 'http', status: 'idle' },
  { id: 'webview_allowed', channel: 'webview', status: 'idle' },
  { id: 'webview_blocked', channel: 'webview', status: 'idle' },
];

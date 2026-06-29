import { type SandboxTestCaseId, type SandboxTestCaseResult } from '../../core/models/cases';
import { probeHttpAllowed, probeHttpBlocked } from '../api/httpProbes';
import { useSandboxDiagnosticsStore } from './sandboxDiagnosticsStore';

jest.mock('../api/httpProbes', () => ({
  probeHttpAllowed: jest.fn(),
  probeHttpBlocked: jest.fn(),
}));

const mockProbeAllowed = jest.mocked(probeHttpAllowed);
const mockProbeBlocked = jest.mocked(probeHttpBlocked);

const store = () => useSandboxDiagnosticsStore.getState();
const allCasesIdle = () => Object.values(store().cases).every(testCase => testCase.status === 'idle' && testCase.detail === undefined);
const markRunning = (caseId: SandboxTestCaseId) =>
  useSandboxDiagnosticsStore.setState(state => ({ cases: { ...state.cases, [caseId]: { ...state.cases[caseId], status: 'running' } } }));

beforeEach(() => {
  jest.clearAllMocks();
  mockProbeAllowed.mockResolvedValue({ passed: true, detail: 'reachable (status 200)' });
  mockProbeBlocked.mockResolvedValue({ passed: true, detail: 'blocked (no response)' });
  useSandboxDiagnosticsStore.setState(useSandboxDiagnosticsStore.getInitialState());
});

describe('useSandboxDiagnosticsStore', () => {
  it('starts closed with every case idle', () => {
    expect(store().isOpen).toBe(false);
    expect(allCasesIdle()).toBe(true);
  });

  describe('#open', () => {
    it('opens the overlay', () => {
      store().open();
      expect(store().isOpen).toBe(true);
    });
  });

  describe('#close', () => {
    it('closes and resets every case to idle', async () => {
      store().open();
      store().runCase('http_allowed');
      await Promise.resolve();
      store().runCase('webview_blocked');
      store().recordResult('webview_blocked', { passed: false, detail: 'loaded blocked host: x' });

      store().close();

      expect(store().isOpen).toBe(false);
      expect(allCasesIdle()).toBe(true);
    });

    it('drops an http probe that resolves after close, leaving the case idle', async () => {
      let resolveProbe!: (result: SandboxTestCaseResult) => void;
      mockProbeAllowed.mockReturnValue(new Promise<SandboxTestCaseResult>(resolve => (resolveProbe = resolve)));

      store().open();
      store().runCase('http_allowed');
      store().close();
      resolveProbe({ passed: false, detail: 'unexpected status 500' });
      await Promise.resolve();

      expect(store().cases.http_allowed.status).toBe('idle');
      expect(store().cases.http_allowed.detail).toBeUndefined();
    });
  });

  describe('#recordResult', () => {
    it('records a pass with its detail', () => {
      markRunning('http_allowed');
      store().recordResult('http_allowed', { passed: true, detail: 'reachable (status 200)' });
      expect(store().cases.http_allowed).toEqual({
        id: 'http_allowed',
        channel: 'http',
        status: 'pass',
        detail: 'reachable (status 200)',
      });
    });

    it('records a fail with its detail', () => {
      markRunning('http_blocked');
      store().recordResult('http_blocked', { passed: false, detail: 'not blocked (status 200)' });
      expect(store().cases.http_blocked).toEqual({
        id: 'http_blocked',
        channel: 'http',
        status: 'fail',
        detail: 'not blocked (status 200)',
      });
    });

    it('drops a result for a case that is not running (e.g. settled late after close)', () => {
      store().runCase('webview_blocked');
      store().close();
      store().recordResult('webview_blocked', { passed: false, detail: 'loaded blocked host: x' });

      expect(store().cases.webview_blocked.status).toBe('idle');
      expect(store().cases.webview_blocked.detail).toBeUndefined();
    });
  });

  describe('#runCase', () => {
    it('marks a webview case running and fires no http probe', () => {
      store().runCase('webview_blocked');
      store().recordResult('webview_blocked', { passed: false, detail: 'stale' });
      store().runCase('webview_blocked');

      expect(store().cases.webview_blocked).toMatchObject({ status: 'running', detail: undefined });
      expect(mockProbeAllowed).not.toHaveBeenCalled();
      expect(mockProbeBlocked).not.toHaveBeenCalled();
    });

    it('marks an http case running, clears the prior outcome, then records the probe result', async () => {
      store().runCase('http_allowed');
      await Promise.resolve();
      expect(store().cases.http_allowed.status).toBe('pass');

      mockProbeAllowed.mockResolvedValue({ passed: false, detail: 'unexpected status 500' });
      store().runCase('http_allowed');

      // Synchronous: running with the previous detail cleared, probe kicked off again.
      expect(store().cases.http_allowed).toMatchObject({ status: 'running', detail: undefined });
      expect(mockProbeAllowed).toHaveBeenCalledTimes(2);

      await Promise.resolve();
      expect(store().cases.http_allowed).toMatchObject({ status: 'fail', detail: 'unexpected status 500' });
    });

    it('ignores a re-tap while the case is already running', () => {
      mockProbeAllowed.mockReturnValue(new Promise<SandboxTestCaseResult>(() => undefined));

      store().runCase('http_allowed');
      store().runCase('http_allowed');

      expect(store().cases.http_allowed.status).toBe('running');
      expect(mockProbeAllowed).toHaveBeenCalledTimes(1);
    });

    it('drops a pre-close probe so it cannot affect a run started after reopen', async () => {
      const resolvers: Array<(result: SandboxTestCaseResult) => void> = [];
      mockProbeAllowed.mockImplementation(() => new Promise<SandboxTestCaseResult>(resolve => resolvers.push(resolve)));

      store().open();
      store().runCase('http_allowed'); // run 1, probe still in flight
      store().close(); // resets to idle; the run-1 probe is not cancelled
      store().open();
      store().runCase('http_allowed'); // run 2, fresh probe

      resolvers[0]({ passed: false, detail: 'unexpected status 500' }); // run-1 probe lands late
      resolvers[1]({ passed: true, detail: 'reachable (status 200)' }); // run-2 probe lands
      await Promise.resolve();

      expect(store().cases.http_allowed).toMatchObject({ status: 'pass', detail: 'reachable (status 200)' });
    });
  });

  describe('#runAll', () => {
    it('marks every case running and fires each http probe once', () => {
      store().runAll();

      expect(Object.values(store().cases).every(testCase => testCase.status === 'running')).toBe(true);
      expect(mockProbeAllowed).toHaveBeenCalledTimes(1);
      expect(mockProbeBlocked).toHaveBeenCalledTimes(1);
    });
  });
});

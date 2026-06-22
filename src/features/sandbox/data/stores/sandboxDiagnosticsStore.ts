import { createRainbowStore } from '@/state/internal/createRainbowStore';

import { SANDBOX_TEST_CASES, type SandboxTestCase, type SandboxTestCaseId, type SandboxTestCaseResult } from '../../core/models/cases';
import { probeHttpAllowed, probeHttpBlocked } from '../api/httpProbes';

interface SandboxDiagnosticsState {
  isOpen: boolean;
  cases: Record<SandboxTestCaseId, SandboxTestCase>;
  open: () => void;
  close: () => void;
  runCase: (caseId: SandboxTestCaseId) => void;
  runAll: () => void;
  recordResult: (caseId: SandboxTestCaseId, result: SandboxTestCaseResult) => void;
}

function idleCases(): Record<SandboxTestCaseId, SandboxTestCase> {
  return Object.fromEntries(SANDBOX_TEST_CASES.map(testCase => [testCase.id, { ...testCase }])) as Record<
    SandboxTestCaseId,
    SandboxTestCase
  >;
}

export const useSandboxDiagnosticsStore = createRainbowStore<SandboxDiagnosticsState>((set, get) => ({
  isOpen: false,
  cases: idleCases(),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false, cases: idleCases() }),
  recordResult: (caseId, result) => {
    // A result only makes sense for a run that's still in flight. close() resets
    // cases to idle, so a probe that settles late (e.g. a WebView event already
    // queued at unmount) is dropped here rather than repopulating a cancelled run.
    if (get().cases[caseId].status !== 'running') {
      return;
    }
    set(state => ({
      cases: { ...state.cases, [caseId]: { ...state.cases[caseId], status: result.passed ? 'pass' : 'fail', detail: result.detail } },
    }));
  },
  runCase: caseId => {
    // A run that's still in flight isn't restarted: re-tapping a running case is a
    // no-op.
    if (get().cases[caseId].status === 'running') {
      return;
    }
    set(state => ({ cases: { ...state.cases, [caseId]: { ...state.cases[caseId], status: 'running', detail: undefined } } }));
    const run = get().cases[caseId];
    const record = (result: SandboxTestCaseResult) => {
      if (get().cases[caseId] === run) {
        get().recordResult(caseId, result);
      }
    };
    if (caseId === 'http_allowed') {
      probeHttpAllowed().then(record);
    } else if (caseId === 'http_blocked') {
      probeHttpBlocked().then(record);
    }
  },
  runAll: () => Object.values(get().cases).forEach(testCase => get().runCase(testCase.id)),
}));

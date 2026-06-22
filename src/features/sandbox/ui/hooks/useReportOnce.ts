import { useRef } from 'react';

import { type SandboxTestCaseId, type SandboxTestCaseResult } from '../../core/models/cases';
import { useSandboxDiagnosticsStore } from '../../data/stores/sandboxDiagnosticsStore';

export function useReportOnce(caseId: SandboxTestCaseId) {
  const recordResult = useSandboxDiagnosticsStore(state => state.recordResult);
  const settled = useRef(false);

  return (result: SandboxTestCaseResult) => {
    if (settled.current) {
      return;
    }
    settled.current = true;
    recordResult(caseId, result);
  };
}

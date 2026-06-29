import { Pressable } from 'react-native';

import { Box, Text } from '@/design-system';

import { type SandboxTestCaseId } from '../../core/models/cases';
import { useSandboxDiagnosticsStore } from '../../data/stores/sandboxDiagnosticsStore';

const LABELS: Record<SandboxTestCaseId, string> = {
  http_allowed: 'HTTP: allowed host reachable',
  http_blocked: 'HTTP: blocked host unreachable',
  webview_allowed: 'WebView: allowed page loads',
  webview_blocked: 'WebView: blocked navigation prevented',
};

export function SandboxCaseRow({ caseId }: { caseId: SandboxTestCaseId }) {
  const { status, detail } = useSandboxDiagnosticsStore(state => state.cases[caseId]);
  const runCase = useSandboxDiagnosticsStore(state => state.runCase);
  const statusColor = status === 'pass' ? 'green' : status === 'fail' ? 'red' : 'labelTertiary';

  return (
    <Pressable onPress={() => runCase(caseId)} testID={`sandbox-case-${caseId}-${status}`}>
      <Box alignItems="center" flexDirection="row" justifyContent="space-between" paddingVertical="12px">
        <Box gap={2} paddingRight="12px" style={{ flex: 1 }}>
          <Text color="label" size="15pt" weight="medium">
            {LABELS[caseId]}
          </Text>
          {detail ? (
            <Text color="labelQuaternary" size="11pt">
              {detail}
            </Text>
          ) : null}
        </Box>
        <Text color={statusColor} size="13pt" weight="bold">
          {status.toUpperCase()}
        </Text>
      </Box>
    </Pressable>
  );
}

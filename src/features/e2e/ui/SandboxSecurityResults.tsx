import { StyleSheet, Text, View } from 'react-native';

import { type SandboxTestResult } from '../core/sandboxSecurityTest';

interface Props {
  results: SandboxTestResult[];
  allDone: boolean;
}

export function SandboxSecurityResults({ results, allDone }: Props) {
  const allPassed = allDone && results.every(r => r.passed);

  return (
    <View style={sx.overlay} testID={allDone ? 'sandbox-test-results' : undefined}>
      <Text style={sx.status} testID="sandbox-test-status">
        {!allDone ? 'SANDBOX_TEST_RUNNING' : allPassed ? 'SANDBOX_TEST_PASSED' : 'SANDBOX_TEST_FAILED'}
      </Text>
      {results.map(r => (
        <Text key={r.name} style={sx.result} testID={`sandbox-${r.name}`}>
          {`${r.name}: ${r.passed ? 'PASS' : 'FAIL'} - ${r.detail}`}
        </Text>
      ))}
    </View>
  );
}

const sx = StyleSheet.create({
  overlay: {
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 9999,
    left: 20,
    padding: 16,
    position: 'absolute',
    right: 20,
    top: 120,
    zIndex: 9999,
  },
  result: {
    color: '#333',
    fontSize: 13,
    marginTop: 6,
  },
  status: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

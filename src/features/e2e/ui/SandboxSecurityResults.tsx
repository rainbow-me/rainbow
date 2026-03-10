import { type SandboxTestResult } from '../core/sandboxSecurityTest';
import { StyleSheet, Text, View } from 'react-native';

export function SandboxSecurityResults({ results }: { results: SandboxTestResult[] }) {
  const allPassed = results.every(r => r.passed);

  return (
    <View style={sx.overlay} testID="sandbox-test-results">
      <Text style={sx.status} testID="sandbox-test-status">
        {allPassed ? 'SANDBOX_TEST_PASSED' : 'SANDBOX_TEST_FAILED'}
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

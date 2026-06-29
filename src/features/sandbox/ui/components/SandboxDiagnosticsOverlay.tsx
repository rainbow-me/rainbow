import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Box, Separator, Stack, Text } from '@/design-system';

import { SANDBOX_TEST_CASES } from '../../core/models/cases';
import { useSandboxDiagnosticsStore } from '../../data/stores/sandboxDiagnosticsStore';
import { SandboxCaseRow } from './SandboxCaseRow';
import { WebViewAllowedProbe } from './WebViewAllowedProbe';
import { WebViewBlockedProbe } from './WebViewBlockedProbe';

export function SandboxDiagnosticsOverlay() {
  const isOpen = useSandboxDiagnosticsStore(state => state.isOpen);

  if (!isOpen) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <Box background="surfacePrimary" borderRadius={16} padding="20px" style={styles.card} width="full">
        <Text color="label" size="20pt" weight="bold">
          Sandbox diagnostics
        </Text>
        <ScrollView style={styles.rows}>
          <Stack separator={<Separator color="separatorTertiary" thickness={1} />}>
            {SANDBOX_TEST_CASES.map(testCase => (
              <SandboxCaseRow key={testCase.id} caseId={testCase.id} />
            ))}
          </Stack>
        </ScrollView>
        <Box flexDirection="row" gap={12} paddingTop="16px">
          <RunAllButton />
          <CloseButton />
        </Box>
      </Box>

      <View pointerEvents="none" style={styles.webviews}>
        <WebViewProbes />
      </View>
    </View>
  );
}

function RunAllButton() {
  const runAll = useSandboxDiagnosticsStore(state => state.runAll);

  return (
    <Pressable onPress={runAll} style={styles.button} testID="sandbox-run-all">
      <Box alignItems="center" background="accent" borderRadius={10} paddingVertical="12px">
        <Text color="white" size="15pt" weight="semibold">
          Run all
        </Text>
      </Box>
    </Pressable>
  );
}

function CloseButton() {
  const close = useSandboxDiagnosticsStore(state => state.close);

  return (
    <Pressable onPress={close} style={styles.button} testID="sandbox-close">
      <Box alignItems="center" background="fillSecondary" borderRadius={10} paddingVertical="12px">
        <Text color="label" size="15pt" weight="semibold">
          Close
        </Text>
      </Box>
    </Pressable>
  );
}

function WebViewProbes() {
  const cases = useSandboxDiagnosticsStore(state => state.cases);
  const runningWebViewCases = Object.values(cases).filter(testCase => testCase.channel === 'webview' && testCase.status === 'running');

  return runningWebViewCases.map(testCase =>
    testCase.id === 'webview_allowed' ? <WebViewAllowedProbe key={testCase.id} /> : <WebViewBlockedProbe key={testCase.id} />
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
  },
  card: {
    maxHeight: '80%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    padding: 20,
    zIndex: 9999,
  },
  rows: {
    marginTop: 12,
  },
  webviews: {
    bottom: 0,
    flexDirection: 'row',
    height: 100,
    left: 0,
    position: 'absolute',
    right: 0,
  },
});

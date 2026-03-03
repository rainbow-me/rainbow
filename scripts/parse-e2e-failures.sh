#!/bin/bash
# parse-e2e-failures.sh — Extract failure details from Maestro e2e artifacts
#
# Usage: ./scripts/parse-e2e-failures.sh <artifacts-dir>
# Output: Multi-line text with test name, error message, and log excerpt for each failure
#
# Maestro outputs XML JUnit reports and log files. This script finds failed tests
# and extracts actionable error information for Claude Code to analyze.

set -euo pipefail

ARTIFACTS_DIR="${1:?Usage: parse-e2e-failures.sh <artifacts-dir>}"

if [ ! -d "$ARTIFACTS_DIR" ]; then
  echo "Error: artifacts directory not found: $ARTIFACTS_DIR" >&2
  exit 1
fi

FOUND_FAILURES=false

# --- Strategy 1: Parse JUnit XML reports ---
# Maestro can output JUnit XML with --format junit
for xml_file in $(find "$ARTIFACTS_DIR" -name "*.xml" -type f 2>/dev/null); do
  # Extract failed test cases from JUnit XML
  if grep -q '<failure' "$xml_file" 2>/dev/null; then
    echo "=== JUnit Report: $(basename "$xml_file") ==="

    # Use python for reliable XML parsing (available on macOS runners)
    python3 -c "
import xml.etree.ElementTree as ET
import sys

tree = ET.parse('$xml_file')
root = tree.getroot()

for tc in root.iter('testcase'):
    failure = tc.find('failure')
    error = tc.find('error')
    elem = failure if failure is not None else error
    if elem is not None:
        name = tc.get('name', 'unknown')
        classname = tc.get('classname', '')
        message = elem.get('message', '')
        text = (elem.text or '')[:2000]  # Truncate long stack traces
        print(f'TEST: {classname}/{name}')
        print(f'ERROR: {message}')
        if text.strip():
            print(f'DETAILS:\n{text}')
        print('---')
" 2>/dev/null && FOUND_FAILURES=true
  fi
done

# --- Strategy 2: Parse Maestro log output ---
# Look for Maestro's stdout/stderr logs in artifacts
for log_file in $(find "$ARTIFACTS_DIR" -name "*.log" -o -name "*.txt" -type f 2>/dev/null); do
  if grep -q -i "FAILED\|failed\|Error\|AssertionError" "$log_file" 2>/dev/null; then
    # Extract the failure sections
    FAILURES=$(grep -B 2 -A 10 -i "FAILED\|Error running\|AssertionError" "$log_file" 2>/dev/null | head -200)
    if [ -n "$FAILURES" ]; then
      echo "=== Log: $(basename "$log_file") ==="
      echo "$FAILURES"
      echo "---"
      FOUND_FAILURES=true
    fi
  fi
done

# --- Strategy 3: Parse Maestro HTML/JSON reports ---
for report in $(find "$ARTIFACTS_DIR" -name "report.json" -o -name "*.json" -type f 2>/dev/null); do
  if python3 -c "
import json, sys
with open('$report') as f:
    data = json.load(f)

# Handle Maestro's JSON report format
if isinstance(data, dict):
    suites = data.get('suites', data.get('testSuites', [data]))
    if not isinstance(suites, list):
        suites = [suites]
    for suite in suites:
        tests = suite.get('tests', suite.get('testCases', []))
        if not isinstance(tests, list):
            continue
        for test in tests:
            status = test.get('status', test.get('result', ''))
            if status.upper() in ('FAILED', 'ERROR', 'FAILURE'):
                name = test.get('name', test.get('testName', 'unknown'))
                error = test.get('error', test.get('message', test.get('failureMessage', '')))
                print(f'TEST: {name}')
                print(f'ERROR: {error}')
                print('---')
                sys.exit(0)  # Signal we found something
sys.exit(1)
" 2>/dev/null; then
    FOUND_FAILURES=true
  fi
done

# --- Strategy 4: Check for Maestro flow failure directories ---
# Maestro creates per-flow directories with screenshots on failure
for flow_dir in $(find "$ARTIFACTS_DIR" -type d -name "*.yaml" -o -name "*.yml" 2>/dev/null); do
  if [ -f "$flow_dir/FAILED" ] || ls "$flow_dir"/*fail* 2>/dev/null | grep -q .; then
    echo "=== Failed Flow: $(basename "$flow_dir") ==="
    # Include any error text files
    for err_file in "$flow_dir"/*.txt "$flow_dir"/*.log; do
      [ -f "$err_file" ] && head -50 "$err_file"
    done
    echo "---"
    FOUND_FAILURES=true
  fi
done

if [ "$FOUND_FAILURES" = false ]; then
  # Last resort: dump artifact file listing so Claude can still try to help
  echo "=== No structured failure data found. Artifact contents: ==="
  find "$ARTIFACTS_DIR" -type f | sort
  echo "---"
  echo "=== Raw log snippets (grep for common error patterns): ==="
  grep -r -l -i "fail\|error\|crash\|exception" "$ARTIFACTS_DIR" 2>/dev/null | while read f; do
    echo "--- $(basename "$f") ---"
    grep -i "fail\|error\|crash\|exception" "$f" | head -20
  done
fi

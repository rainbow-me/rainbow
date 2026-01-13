#!/bin/bash

# Usage: ./scripts/check-cycles.sh <expected_cycles>
# Example: ./scripts/check-cycles.sh 2087

if [ -z "$1" ]; then
  echo "❌ Error: Missing required argument"
  echo "Usage: $0 <expected_cycles>"
  echo "Example: $0 2087"
  exit 1
fi

EXPECTED_CYCLES=$1

echo "Checking for circular dependencies..."
echo "Expected count: $EXPECTED_CYCLES"
echo ""

# Run madge and capture output
OUTPUT=$(yarn madge --circular src/App.tsx 2>&1)

# Check if madge found any cycles
if echo "$OUTPUT" | grep -q "No circular dependency found"; then
  if [ "$EXPECTED_CYCLES" -eq 0 ]; then
    echo "✅ PASSED: No circular dependencies found!"
    exit 0
  else
    echo "❌ FAILED: All cycles eliminated! ($EXPECTED_CYCLES → 0)"
    echo "   Update baseline in package.json to 0"
    exit 1
  fi
fi

# Extract the number of cycles from output like "✖ Found 2189 circular dependencies!"
CYCLE_COUNT=$(echo "$OUTPUT" | grep -oE "Found [0-9]+ circular" | grep -oE "[0-9]+")

if [ -z "$CYCLE_COUNT" ]; then
  echo "❌ Could not determine cycle count. Output:"
  echo "$OUTPUT"
  exit 1
fi

echo "Found $CYCLE_COUNT circular dependencies"
echo ""

if [ "$CYCLE_COUNT" -ne "$EXPECTED_CYCLES" ]; then
  if [ "$CYCLE_COUNT" -gt "$EXPECTED_CYCLES" ]; then
    echo "❌ FAILED: Circular dependencies increased by $((CYCLE_COUNT - EXPECTED_CYCLES)) ($EXPECTED_CYCLES → $CYCLE_COUNT)"
    echo "   Fix the new cycles or update baseline in package.json to $CYCLE_COUNT"
  else
    echo "❌ FAILED: Circular dependencies decreased by $((EXPECTED_CYCLES - CYCLE_COUNT)) ($EXPECTED_CYCLES → $CYCLE_COUNT)"
    echo "   Update baseline in package.json to $CYCLE_COUNT"
  fi
  echo ""
  echo "To see all cycles, run: yarn madge --circular src/App.tsx"
  exit 1
else
  echo "✅ PASSED: Circular dependencies match the expected count ($EXPECTED_CYCLES)"
  exit 0
fi

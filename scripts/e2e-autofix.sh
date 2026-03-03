#!/bin/bash
# e2e-autofix.sh — AI-powered e2e test autofix
#
# Called by e2e-run.sh (locally or on CI) with the list of failed tests.
# Claude Code reads the Maestro logs directly from the artifacts folder.
#
# Local:
#   ./scripts/e2e-autofix.sh --failed-tests "CreateWallet,WatchedWallet" \
#     --failed-flows "e2e/flows/onboarding/CreateWallet.yaml,e2e/flows/onboarding/WatchedWallet.yaml"
#
# CI (called by GitHub Action):
#   ./scripts/e2e-autofix.sh --pr 123 --branch feat/x --repo owner/repo \
#     --failed-tests "CreateWallet" --failed-flows "e2e/flows/onboarding/CreateWallet.yaml"

set -euo pipefail

# ─── Args ─────────────────────────────────────────────────────────────
PR_NUMBER="" PR_BRANCH="" REPO="" MAX_ATTEMPTS=2
FAILED_TESTS_CSV="" FAILED_FLOWS_CSV="" PLATFORM="ios" SKIP_VERIFY=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --pr)            PR_NUMBER="$2";       shift 2 ;;
    --branch)        PR_BRANCH="$2";       shift 2 ;;
    --repo)          REPO="$2";            shift 2 ;;
    --failed-tests)  FAILED_TESTS_CSV="$2"; shift 2 ;;
    --failed-flows)  FAILED_FLOWS_CSV="$2"; shift 2 ;;
    --max-attempts)  MAX_ATTEMPTS="$2";    shift 2 ;;
    --platform)      PLATFORM="$2";        shift 2 ;;
    --skip-verify)   SKIP_VERIFY=true;     shift ;;
    *) echo "Unknown: $1" >&2; exit 1 ;;
  esac
done

[[ -z "$FAILED_TESTS_CSV" ]] && { echo "Error: --failed-tests required" >&2; exit 1; }
[[ -z "$FAILED_FLOWS_CSV" ]] && { echo "Error: --failed-flows required" >&2; exit 1; }

# Parse CSV into arrays
IFS=',' read -ra FAILED_TESTS <<< "$FAILED_TESTS_CSV"
IFS=',' read -ra FAILED_FLOWS <<< "$FAILED_FLOWS_CSV"

CI_MODE=false
if [[ -n "$PR_NUMBER" ]]; then
  CI_MODE=true
  [[ -z "$PR_BRANCH" ]] && { echo "Error: --branch required" >&2; exit 1; }
  [[ -z "$REPO" ]]      && { echo "Error: --repo required" >&2; exit 1; }
  echo "CI mode (PR #${PR_NUMBER})"
else
  echo "Local mode"
fi

echo ""
echo "Failed tests (${#FAILED_TESTS[@]}):"
for i in "${!FAILED_TESTS[@]}"; do
  echo "  ❌ ${FAILED_TESTS[$i]} → ${FAILED_FLOWS[$i]}"
done

# ─── Get diff ─────────────────────────────────────────────────────────
echo ""
echo "=== Getting diff ==="
if [[ "$CI_MODE" = true ]]; then
  PR_DIFF=$(gh pr diff "$PR_NUMBER" --repo "$REPO" 2>/dev/null || echo "")
  PR_FILES=$(gh pr diff "$PR_NUMBER" --repo "$REPO" --name-only 2>/dev/null || echo "")
else
  PR_DIFF=$(git diff HEAD~1 2>/dev/null || echo "")
  PR_FILES=$(git diff --name-only HEAD~1 2>/dev/null || echo "")
fi
echo "Changed: $PR_FILES"

# ─── Fix attempts ────────────────────────────────────────────────────
echo ""
echo "=== Fixing (max $MAX_ATTEMPTS attempts) ==="

FIXED=false FIX_DIFF="" FIX_FILES="" FIX_EXPLANATION="" CATEGORY=""
ATTEMPT_LOG="" ATTEMPT=0
VERIFIED_TESTS=() STILL_FAILING=() VERIFY_SKIPPED=false

for ATTEMPT in $(seq 1 "$MAX_ATTEMPTS"); do
  echo ""
  echo "--- Attempt $ATTEMPT/$MAX_ATTEMPTS ---"

  # Build list of failed flows + their log locations
  FLOW_INFO=""
  for i in "${!FAILED_TESTS[@]}"; do
    FLOW_INFO="${FLOW_INFO}
- ${FAILED_TESTS[$i]}: ${FAILED_FLOWS[$i]}"
  done

  if [[ "$ATTEMPT" -eq 1 ]]; then
    FIX_PROMPT="You are fixing failing e2e tests in a React Native app (Rainbow).
Tests use Maestro (YAML flows in e2e/flows/).

## PR diff:
${PR_DIFF}

## Failed tests:
${FLOW_INFO}

## Maestro logs
Check the e2e-artifacts/maestro/ folder for detailed failure logs.
Folders are named like ❌-TestName-attempt. Read the logs to understand what failed.

## CRITICAL: Classify before fixing

**Category A — Bug in PR:** The PR broke something unintentionally (typo, wrong variable, renamed ID without updating refs). → Fix the source code. Do NOT touch tests.

**Category B — Intentional change, tests outdated:** The PR intentionally changed behavior/UI and the tests need updating. → Update the test YAML files. Do NOT revert source.

**Category C — Unclear / risky:** Cannot confidently determine intent. → Make NO changes. Explain why.

## Rules:
1. State CATEGORY: A, B, or C with reason
2. A → fix source only. B → fix tests only. C → no changes.
3. Minimal changes only.
4. Read the actual Maestro log files for error details before making changes.

Start response with: CATEGORY: A|B|C — reason"
  else
    FIX_PROMPT="Previous fix attempt failed verification.

$ATTEMPT_LOG

Original diff: ${PR_DIFF}
Failed tests: ${FLOW_INFO}

Check e2e-artifacts/maestro/ for detailed logs. Try a different approach."
  fi

  echo "Running Claude Code..."
  CLAUDE_OUTPUT=$(echo "$FIX_PROMPT" | claude -p --dangerously-skip-permissions 2>&1) || true

  echo "Claude (last 15 lines):"
  echo "$CLAUDE_OUTPUT" | tail -15

  CATEGORY=$(echo "$CLAUDE_OUTPUT" | grep -o "CATEGORY: [ABC]" | head -1 | cut -d' ' -f2) || true
  echo "Category: ${CATEGORY:-unknown}"

  if [[ "$CATEGORY" = "C" ]]; then
    echo "Category C — skipping."
    ATTEMPT_LOG="Attempt $ATTEMPT: Category C. $(echo "$CLAUDE_OUTPUT" | tail -10)"
    continue
  fi

  CHANGES=$(git diff --stat 2>/dev/null) || true
  if [[ -z "$CHANGES" ]]; then
    echo "No changes."
    ATTEMPT_LOG="Attempt $ATTEMPT: No file changes."
    continue
  fi

  CHANGED_COUNT=$(git diff --name-only | wc -l | tr -d ' ')
  if [[ "$CHANGED_COUNT" -gt 15 ]]; then
    echo "Too many files ($CHANGED_COUNT). Reverting."
    git checkout -- .
    ATTEMPT_LOG="Attempt $ATTEMPT: Too many changes."
    continue
  fi

  echo "Changes: $CHANGES"
  FIX_DIFF=$(git diff)
  FIX_FILES=$(git diff --name-only)
  FIX_EXPLANATION=$(echo "$CLAUDE_OUTPUT" | tail -20)

  # ─── Verify ──────────────────────────────────────────────────────
  VERIFIED_TESTS=() STILL_FAILING=() VERIFY_SKIPPED=false

  if [[ "$SKIP_VERIFY" = true ]]; then
    echo "⏭️ Skipping verify"
    VERIFY_SKIPPED=true
    VERIFIED_TESTS=("${FAILED_TESTS[@]}")
    FIXED=true; break
  else
    echo ""
    echo "=== Verifying ${#FAILED_FLOWS[@]} test(s) ==="

    for j in "${!FAILED_FLOWS[@]}"; do
      FLOW="${FAILED_FLOWS[$j]}"
      TEST_NAME="${FAILED_TESTS[$j]}"
      echo "🧪 $TEST_NAME..."
      VERIFY_EXIT=0
      ./scripts/e2e-run.sh --flow "$FLOW" --platform "$PLATFORM" > "/tmp/e2e-verify-${TEST_NAME}.log" 2>&1 || VERIFY_EXIT=$?

      if [[ "$VERIFY_EXIT" -eq 0 ]]; then
        echo "  ✅ PASSED"
        VERIFIED_TESTS+=("$TEST_NAME")
      else
        echo "  ❌ STILL FAILING"
        tail -5 "/tmp/e2e-verify-${TEST_NAME}.log" | sed 's/^/    /'
        STILL_FAILING+=("$TEST_NAME")
      fi
      rm -f "/tmp/e2e-verify-${TEST_NAME}.log"
    done

    echo "Results: ${#VERIFIED_TESTS[@]} passed, ${#STILL_FAILING[@]} failed"

    if [[ ${#VERIFIED_TESTS[@]} -gt 0 ]]; then
      FIXED=true; break
    else
      echo "All still failing. Reverting."
      git checkout -- .
      ATTEMPT_LOG="Attempt $ATTEMPT: Fix didn't pass verification."
      continue
    fi
  fi
done

# ─── Results ──────────────────────────────────────────────────────────
build_table() {
  echo "| Test | Before | After |"
  echo "|------|--------|-------|"
  for i in "${!FAILED_TESTS[@]}"; do
    local NAME="${FAILED_TESTS[$i]}" AFTER="—"
    if [[ "${VERIFY_SKIPPED}" = true ]]; then
      AFTER="⏭️ Not verified"
    else
      local PASS=false
      for v in "${VERIFIED_TESTS[@]:-}"; do [[ "$v" = "$NAME" ]] && PASS=true && break; done
      [[ "$PASS" = true ]] && AFTER="✅ Fixed" || AFTER="❌ Still failing"
    fi
    echo "| \`$NAME\` | ❌ Failed | $AFTER |"
  done
}

case "${CATEGORY:-}" in
  A) CAT_LABEL="🐛 Bug fix (reverted unintentional breakage)" ;;
  B) CAT_LABEL="🔄 Test update (adapted tests to intentional change)" ;;
  *) CAT_LABEL="Fix applied" ;;
esac

if [[ "${VERIFY_SKIPPED}" = true ]]; then
  VERIFY_MSG="⚠️ Verification skipped."
elif [[ ${#STILL_FAILING[@]} -eq 0 ]] && [[ ${#VERIFIED_TESTS[@]} -gt 0 ]]; then
  VERIFY_MSG="✅ All ${#VERIFIED_TESTS[@]} failing test(s) now pass."
elif [[ ${#VERIFIED_TESTS[@]} -gt 0 ]]; then
  VERIFY_MSG="⚠️ Partial: ${#VERIFIED_TESTS[@]}/${#FAILED_TESTS[@]} fixed."
else
  VERIFY_MSG=""
fi

if [[ "$FIXED" = true ]]; then
  TABLE=$(build_table)

  if [[ "$CI_MODE" = true ]]; then
    AUTOFIX_BRANCH="autofix/e2e-${PR_NUMBER}"
    git checkout -b "$AUTOFIX_BRANCH" 2>/dev/null || git checkout "$AUTOFIX_BRANCH"
    git add -u
    git commit -m "[skip-ci] fix: autofix e2e for PR #${PR_NUMBER}

${CAT_LABEL}
Verified: ${#VERIFIED_TESTS[@]}/${#FAILED_TESTS[@]}

Co-authored-by: Claude <noreply@anthropic.com>"

    git push origin "$AUTOFIX_BRANCH" --force

    FIX_PR_URL=$(gh pr create --repo "$REPO" --base "$PR_BRANCH" --head "$AUTOFIX_BRANCH" \
      --title "[skip-ci] fix: autofix e2e for PR #${PR_NUMBER}" \
      --body "## 🤖 E2E Autofix

$TABLE

$VERIFY_MSG

**Classification:** $CAT_LABEL

### What was fixed
$(echo "$FIX_EXPLANATION")

### Changed files
$(echo "$FIX_FILES" | sed 's/^/- /')

<details><summary>Diff</summary>

\`\`\`diff
$(echo "$FIX_DIFF" | head -200)
\`\`\`
</details>

_Generated by E2E Autofix_" --no-maintainer-edit 2>&1)

    gh pr comment "$PR_NUMBER" --repo "$REPO" --body "## 🤖 E2E Autofix

$TABLE
$VERIFY_MSG

**Classification:** $CAT_LABEL
**Fix PR:** $FIX_PR_URL

$(echo "$FIX_EXPLANATION" | head -10)"

    echo "Done! Fix PR: $FIX_PR_URL"
  else
    echo ""
    echo "==========================================="
    echo "FIX GENERATED ($CAT_LABEL)"
    echo "==========================================="
    echo "$TABLE"
    echo "$VERIFY_MSG"
    echo ""
    git diff --name-only
    echo ""
    git diff
  fi
  exit 0
else
  if [[ "$CI_MODE" = true ]]; then
    gh pr comment "$PR_NUMBER" --repo "$REPO" --body "## 🤖 E2E Autofix — No Fix Found

| Test | Status |
|------|--------|
$(for t in "${FAILED_TESTS[@]}"; do echo "| \`$t\` | ❌ Not fixed |"; done)

Tried $MAX_ATTEMPTS attempts. $ATTEMPT_LOG"
  else
    echo ""
    echo "NO FIX FOUND"
    for t in "${FAILED_TESTS[@]}"; do echo "  ❌ $t"; done
    echo "$ATTEMPT_LOG"
  fi
  exit 1
fi

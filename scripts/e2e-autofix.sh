#!/bin/bash
# e2e-autofix.sh — AI-powered e2e test autofix
#
# Modes (--pr switches):
#   Local:  ./scripts/e2e-autofix.sh --artifacts-dir <path> --repo-dir <path> [--diff-file <path>]
#   CI:     ./scripts/e2e-autofix.sh --artifacts-dir <path> --repo-dir <path> --pr <N> --branch <name> --repo <owner/repo>
#
# Options:
#   --skip-verify         Skip Maestro re-run verification
#   --platform <ios|android>  Platform for verify (default: ios)
#   --max-attempts <N>    Max fix attempts (default: 2)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ─── Args ─────────────────────────────────────────────────────────────
ARTIFACTS_DIR="" REPO_DIR="" PR_NUMBER="" PR_BRANCH="" REPO=""
MAX_ATTEMPTS=2 DIFF_FILE="" SKIP_VERIFY=false PLATFORM="ios"

while [[ $# -gt 0 ]]; do
  case $1 in
    --artifacts-dir) ARTIFACTS_DIR="$2"; shift 2 ;;
    --repo-dir)      REPO_DIR="$2";      shift 2 ;;
    --pr)            PR_NUMBER="$2";      shift 2 ;;
    --branch)        PR_BRANCH="$2";      shift 2 ;;
    --repo)          REPO="$2";           shift 2 ;;
    --max-attempts)  MAX_ATTEMPTS="$2";   shift 2 ;;
    --diff-file)     DIFF_FILE="$2";      shift 2 ;;
    --skip-verify)   SKIP_VERIFY=true;    shift ;;
    --platform)      PLATFORM="$2";       shift 2 ;;
    *) echo "Unknown: $1" >&2; exit 1 ;;
  esac
done

[[ -z "$ARTIFACTS_DIR" ]] && { echo "Error: --artifacts-dir required" >&2; exit 1; }
[[ -z "$REPO_DIR" ]]      && { echo "Error: --repo-dir required" >&2; exit 1; }

CI_MODE=false
if [[ -n "$PR_NUMBER" ]]; then
  CI_MODE=true
  [[ -z "$PR_BRANCH" ]] && { echo "Error: --branch required in CI mode" >&2; exit 1; }
  [[ -z "$REPO" ]]      && { echo "Error: --repo required in CI mode" >&2; exit 1; }
  echo "CI mode (PR #${PR_NUMBER})"
else
  echo "Local mode"
fi

# ─── 1. Parse failures ────────────────────────────────────────────────
echo ""
echo "=== Parsing failures ==="
FAILURES=$("$SCRIPT_DIR/parse-e2e-failures.sh" "$ARTIFACTS_DIR" 2>&1) || true
[[ -z "$FAILURES" ]] && { echo "ERROR: No failures found."; exit 1; }
echo "$FAILURES"

# Extract test names + flow paths
FAILED_TESTS=()
FAILED_FLOWS=()
while IFS= read -r line; do
  if [[ "$line" =~ ^TEST:\ (.+)/(.+)$ ]]; then
    FAILED_TESTS+=("${BASH_REMATCH[2]}")
    FLOW_PATH=$(echo "${BASH_REMATCH[1]}" | tr '.' '/').yaml
    FAILED_FLOWS+=("$FLOW_PATH")
  fi
done <<< "$FAILURES"

echo ""
echo "Failed (${#FAILED_TESTS[@]}):"
for i in "${!FAILED_TESTS[@]}"; do
  echo "  ❌ ${FAILED_TESTS[$i]} → ${FAILED_FLOWS[$i]}"
done

# ─── 2. Get diff ──────────────────────────────────────────────────────
echo ""
echo "=== Getting diff ==="
if [[ "$CI_MODE" = true ]]; then
  PR_DIFF=$(gh pr diff "$PR_NUMBER" --repo "$REPO" 2>/dev/null || echo "")
  PR_FILES=$(gh pr diff "$PR_NUMBER" --repo "$REPO" --name-only 2>/dev/null || echo "")
elif [[ -n "$DIFF_FILE" && -f "$DIFF_FILE" ]]; then
  PR_DIFF=$(cat "$DIFF_FILE")
  PR_FILES=$(grep '^diff --git' "$DIFF_FILE" | sed 's|^diff --git a/||; s| b/.*||' || echo "")
else
  PR_DIFF=$(cd "$REPO_DIR" && git diff HEAD~1 2>/dev/null || echo "")
  PR_FILES=$(cd "$REPO_DIR" && git diff --name-only HEAD~1 2>/dev/null || echo "")
fi
echo "Changed: $PR_FILES"

# ─── 3. Relevance check (CI only) ────────────────────────────────────
if [[ "$CI_MODE" = true ]]; then
  echo ""
  echo "=== Relevance check ==="
  RELEVANCE=$(echo "Are these e2e failures related to files changed in this PR?

Changed files: ${PR_FILES}

Failures: ${FAILURES}

Reply ONLY: RELATED: reason / UNRELATED: reason / UNCLEAR: reason" \
    | claude -p 2>/dev/null || echo "UNCLEAR: error")
  echo "$RELEVANCE"

  if echo "$RELEVANCE" | grep -q "^UNRELATED:"; then
    gh pr comment "$PR_NUMBER" --repo "$REPO" --body "## 🤖 E2E Autofix

| Test | Status |
|------|--------|
$(for t in "${FAILED_TESTS[@]}"; do echo "| \`$t\` | ❌ Failed (likely flaky) |"; done)

$RELEVANCE — _no fix attempted._"
    exit 0
  fi
fi

# ─── 4. Fix attempts ─────────────────────────────────────────────────
echo ""
echo "=== Fixing (max $MAX_ATTEMPTS attempts) ==="

FIXED=false
FIX_DIFF="" FIX_FILES="" FIX_EXPLANATION="" CATEGORY=""
ATTEMPT_LOG="" ATTEMPT=0

for ATTEMPT in $(seq 1 "$MAX_ATTEMPTS"); do
  echo ""
  echo "--- Attempt $ATTEMPT/$MAX_ATTEMPTS ---"

  if [[ "$ATTEMPT" -eq 1 ]]; then
    FIX_PROMPT="You are fixing failing e2e tests in a React Native app (Rainbow).
Tests use Maestro (YAML flows in e2e/flows/).

## PR diff:
${PR_DIFF}

## Failed tests:
$(for i in "${!FAILED_TESTS[@]}"; do echo "- ${FAILED_TESTS[$i]} (${FAILED_FLOWS[$i]})"; done)

## Failure details:
${FAILURES}

## CRITICAL: Classify before fixing

**Category A — Bug in PR:** The PR broke something unintentionally (typo, wrong variable, renamed ID without updating refs). → Fix the source code. Do NOT touch tests.

**Category B — Intentional change, tests outdated:** The PR intentionally changed behavior/UI and the tests need updating. → Update the test YAML files. Do NOT revert source.

**Category C — Unclear / risky:** Cannot confidently determine intent. → Make NO changes. Just explain.

## Rules:
1. State CATEGORY: A, B, or C with reason
2. A → fix source only. B → fix tests only. C → no changes.
3. Minimal changes only.

Start response with: CATEGORY: A|B|C — reason"
  else
    FIX_PROMPT="Previous attempt failed verification.

$ATTEMPT_LOG

Original diff: ${PR_DIFF}
Failures: ${FAILURES}

Try a different approach. State CATEGORY and fix."
  fi

  echo "Running Claude Code..."
  CLAUDE_OUTPUT=$(cd "$REPO_DIR" && echo "$FIX_PROMPT" | claude -p --dangerously-skip-permissions 2>&1) || true

  echo "Claude (last 15 lines):"
  echo "$CLAUDE_OUTPUT" | tail -15

  # Extract category (|| true to prevent pipefail exit)
  CATEGORY=$(echo "$CLAUDE_OUTPUT" | grep -o "CATEGORY: [ABC]" | head -1 | cut -d' ' -f2) || true
  echo "Category: ${CATEGORY:-unknown}"

  if [[ "$CATEGORY" = "C" ]]; then
    echo "Category C — cannot confidently fix."
    ATTEMPT_LOG="Attempt $ATTEMPT: Category C. $(echo "$CLAUDE_OUTPUT" | tail -10)"
    continue
  fi

  # Check for changes
  CHANGES=$(cd "$REPO_DIR" && git diff --stat 2>/dev/null) || true
  if [[ -z "$CHANGES" ]]; then
    echo "No changes detected."
    ATTEMPT_LOG="Attempt $ATTEMPT: No file changes."
    continue
  fi

  CHANGED_COUNT=$(cd "$REPO_DIR" && git diff --name-only | wc -l | tr -d ' ')
  if [[ "$CHANGED_COUNT" -gt 15 ]]; then
    echo "Too many files ($CHANGED_COUNT). Reverting."
    (cd "$REPO_DIR" && git checkout -- .)
    ATTEMPT_LOG="Attempt $ATTEMPT: Too many changes ($CHANGED_COUNT files)."
    continue
  fi

  echo "Changes: $CHANGES"

  FIX_DIFF=$(cd "$REPO_DIR" && git diff)
  FIX_FILES=$(cd "$REPO_DIR" && git diff --name-only)
  FIX_EXPLANATION=$(echo "$CLAUDE_OUTPUT" | tail -20)

  # ─── Verify: re-run failed tests ──────────────────────────────────
  VERIFIED_TESTS=()
  STILL_FAILING=()
  VERIFY_SKIPPED=false

  if [[ "$SKIP_VERIFY" = true ]]; then
    echo "⏭️ Verification skipped (--skip-verify)"
    VERIFY_SKIPPED=true
    VERIFIED_TESTS=("${FAILED_TESTS[@]}")
    FIXED=true
    break
  elif ! command -v maestro >/dev/null 2>&1 && [[ ! -x "$REPO_DIR/scripts/e2e-run.sh" ]]; then
    echo "⏭️ Verification skipped (no maestro or e2e-run.sh)"
    VERIFY_SKIPPED=true
    VERIFIED_TESTS=("${FAILED_TESTS[@]}")
    FIXED=true
    break
  else
    echo ""
    echo "=== Verifying: re-running ${#FAILED_FLOWS[@]} test(s) ==="
    cd "$REPO_DIR"

    for j in "${!FAILED_FLOWS[@]}"; do
      FLOW="${FAILED_FLOWS[$j]}"
      TEST_NAME="${FAILED_TESTS[$j]}"
      VERIFY_LOG="/tmp/e2e-verify-${TEST_NAME}.txt"

      echo "🧪 $TEST_NAME ($FLOW)..."
      VERIFY_EXIT=0

      # Use the project's e2e-run.sh if available, otherwise maestro directly
      if [[ -x "$REPO_DIR/scripts/e2e-run.sh" ]]; then
        "$REPO_DIR/scripts/e2e-run.sh" --flow "$FLOW" --platform "$PLATFORM" > "$VERIFY_LOG" 2>&1 || VERIFY_EXIT=$?
      else
        maestro test "$FLOW" --platform "$PLATFORM" > "$VERIFY_LOG" 2>&1 || VERIFY_EXIT=$?
      fi

      if [[ "$VERIFY_EXIT" -eq 0 ]]; then
        echo "  ✅ PASSED"
        VERIFIED_TESTS+=("$TEST_NAME")
      else
        echo "  ❌ STILL FAILING"
        tail -5 "$VERIFY_LOG" | sed 's/^/    /'
        STILL_FAILING+=("$TEST_NAME")
      fi
      rm -f "$VERIFY_LOG"
    done

    echo "Results: ${#VERIFIED_TESTS[@]} passed, ${#STILL_FAILING[@]} failed"

    if [[ ${#VERIFIED_TESTS[@]} -gt 0 ]]; then
      FIXED=true
      break
    else
      echo "All still failing. Reverting."
      git checkout -- .
      ATTEMPT_LOG="Attempt $ATTEMPT: Fix didn't resolve any tests."
      continue
    fi
  fi
done

# ─── 5. Build results table ──────────────────────────────────────────
build_table() {
  echo "| Test | Before | After |"
  echo "|------|--------|-------|"
  for i in "${!FAILED_TESTS[@]}"; do
    local NAME="${FAILED_TESTS[$i]}"
    local AFTER="—"
    if [[ "${VERIFY_SKIPPED:-false}" = true ]]; then
      AFTER="⏭️ Not verified"
    else
      local PASS=false
      for v in "${VERIFIED_TESTS[@]:-}"; do
        [[ "$v" = "$NAME" ]] && PASS=true && break
      done
      [[ "$PASS" = true ]] && AFTER="✅ Fixed" || AFTER="❌ Still failing"
    fi
    echo "| \`$NAME\` | ❌ Failed | $AFTER |"
  done
}

# ─── 6. Output ────────────────────────────────────────────────────────
if [[ "$FIXED" = true ]]; then
  TABLE=$(build_table)

  # Verification summary
  if [[ "${VERIFY_SKIPPED:-false}" = true ]]; then
    VERIFY_MSG="⚠️ Verification skipped — not tested with Maestro."
  elif [[ ${#STILL_FAILING[@]} -eq 0 ]]; then
    VERIFY_MSG="✅ All ${#VERIFIED_TESTS[@]} failing test(s) now pass."
  else
    VERIFY_MSG="⚠️ Partial: ${#VERIFIED_TESTS[@]}/${#FAILED_TESTS[@]} fixed, ${#STILL_FAILING[@]} still failing."
  fi

  # Category label
  case "${CATEGORY:-}" in
    A) CAT_LABEL="🐛 Bug fix (reverted unintentional breakage)" ;;
    B) CAT_LABEL="🔄 Test update (adapted tests to intentional change)" ;;
    *) CAT_LABEL="Fix applied" ;;
  esac

  if [[ "$CI_MODE" = true ]]; then
    AUTOFIX_BRANCH="autofix/e2e-${PR_NUMBER}"
    cd "$REPO_DIR"
    git checkout -b "$AUTOFIX_BRANCH" 2>/dev/null || git checkout "$AUTOFIX_BRANCH"
    git add -u
    git commit -m "[skip-ci] fix: autofix e2e for PR #${PR_NUMBER}

${CAT_LABEL}
Verified: ${#VERIFIED_TESTS[@]}/${#FAILED_TESTS[@]} tests

Co-authored-by: Claude <noreply@anthropic.com>"

    git push origin "$AUTOFIX_BRANCH" --force

    FIX_PR_URL=$(gh pr create \
      --repo "$REPO" \
      --base "$PR_BRANCH" \
      --head "$AUTOFIX_BRANCH" \
      --title "[skip-ci] fix: autofix e2e for PR #${PR_NUMBER}" \
      --body "## 🤖 E2E Autofix

$TABLE

$VERIFY_MSG

### Classification
$CAT_LABEL

### What was fixed
$(echo "$FIX_EXPLANATION")

### Changed files
$(echo "$FIX_FILES" | sed 's/^/- /')

<details><summary>Diff</summary>

\`\`\`diff
$(echo "$FIX_DIFF" | head -200)
\`\`\`
</details>

_Generated by E2E Autofix_" \
      --no-maintainer-edit 2>&1)

    echo "Fix PR: $FIX_PR_URL"

    gh pr comment "$PR_NUMBER" --repo "$REPO" --body "## 🤖 E2E Autofix

$TABLE

$VERIFY_MSG

**Classification:** $CAT_LABEL
**Fix PR:** $FIX_PR_URL

$(echo "$FIX_EXPLANATION" | head -10)

_Attempt $ATTEMPT/$MAX_ATTEMPTS_"

    echo "Done!"
  else
    echo ""
    echo "==========================================="
    echo "FIX GENERATED ($CAT_LABEL)"
    echo "==========================================="
    echo ""
    echo "$TABLE"
    echo "$VERIFY_MSG"
    echo ""
    echo "Changed:"
    (cd "$REPO_DIR" && git diff --name-only)
    echo ""
    (cd "$REPO_DIR" && git diff)
  fi
  exit 0

else
  if [[ "$CI_MODE" = true ]]; then
    gh pr comment "$PR_NUMBER" --repo "$REPO" --body "## 🤖 E2E Autofix — No Fix Found

| Test | Status |
|------|--------|
$(for t in "${FAILED_TESTS[@]}"; do echo "| \`$t\` | ❌ Not fixed |"; done)

Tried $MAX_ATTEMPTS attempts. $ATTEMPT_LOG

_Review manually or re-run for flaky tests._"
  else
    echo ""
    echo "==========================================="
    echo "NO FIX FOUND"
    echo "==========================================="
    for t in "${FAILED_TESTS[@]}"; do echo "  ❌ $t"; done
    echo "$ATTEMPT_LOG"
  fi
  exit 1
fi

#!/bin/bash
# e2e-autofix.sh — AI-powered e2e test autofix
#
# Called by e2e-run.sh (locally or on CI) with the list of failed tests.
# Claude Code reads the Maestro logs directly from the artifacts folder.
#
# Local:
#   ./scripts/e2e-autofix.sh \
#
# CI (called by GitHub Action):
#   ./scripts/e2e-autofix.sh --pr 123 --branch feat/x --repo owner/repo \
#     --failed-flows "e2e/flows/onboarding/CreateWallet.yaml"

set -euo pipefail

# ─── Args ─────────────────────────────────────────────────────────────
PR_NUMBER="" PR_BRANCH="" REPO="" MAX_ATTEMPTS=2
FAILED_FLOWS_CSV="" SKIP_VERIFY=false PLATFORM=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --pr)            PR_NUMBER="$2";       shift 2 ;;
    --branch)        PR_BRANCH="$2";       shift 2 ;;
    --repo)          REPO="$2";            shift 2 ;;
    --failed-flows)  FAILED_FLOWS_CSV="$2"; shift 2 ;;
    --max-attempts)  MAX_ATTEMPTS="$2";    shift 2 ;;
    --skip-verify)   SKIP_VERIFY=true;     shift ;;
    --platform)      PLATFORM="$2";        shift 2 ;;
    *) echo "Unknown: $1" >&2; exit 1 ;;
  esac
done

[[ -z "$FAILED_FLOWS_CSV" ]] && { echo "Error: --failed-flows required" >&2; exit 1; }

# Parse CSV into arrays, derive test names from flow paths
IFS=',' read -ra FAILED_FLOWS <<< "$FAILED_FLOWS_CSV"
FAILED_TESTS=()
for FLOW in "${FAILED_FLOWS[@]}"; do
  FAILED_TESTS+=("$(basename "${FLOW%.*}")")
done

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

# ─── Capture native fingerprint before fixing ─────────────────────────
if [[ -n "$PLATFORM" ]]; then
  BUILD_FINGERPRINT=$(npx rock fingerprint --platform "$PLATFORM" --raw 2>/dev/null | head -1 || echo "")
  echo "Build fingerprint: ${BUILD_FINGERPRINT:-unknown}"
fi

# ─── Install app (before any fix attempts) ────────────────────────────
if [[ -n "${ARTIFACT_PATH_FOR_E2E:-}" && -n "$PLATFORM" ]]; then
  echo ""
  echo "=== Installing app ==="
  if [[ "$PLATFORM" = "ios" ]]; then
    echo "Terminating app before install..."
    xcrun simctl terminate booted me.rainbow 2>/dev/null || true
    xcrun simctl install booted "$ARTIFACT_PATH_FOR_E2E"
    echo "✅ App installed on simulator"
  elif [[ "$PLATFORM" = "android" ]]; then
    adb install -r "$ARTIFACT_PATH_FOR_E2E"
    echo "✅ APK installed on emulator"
  fi
fi

# ─── Fix attempts ────────────────────────────────────────────────────
echo ""
echo "=== Fixing (max $MAX_ATTEMPTS attempts) ==="

FIXED=false FIX_DIFF="" FIX_FILES="" FIX_DESCRIPTION="" CATEGORY=""
ATTEMPT_LOG="" ATTEMPT=0
VERIFIED_TESTS=() STILL_FAILING=() VERIFY_SKIPPED=false

CLAUDE_SESSION_ID=$(uuidgen | tr "[:upper:]" "[:lower:]")

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

## Failed tests:
${FLOW_INFO}

## Maestro logs
Check the e2e-artifacts/maestro/ folder for detailed failure logs.
Folders are named like ❌-TestName-attempt. Read the logs to understand what failed.

## CRITICAL: Classify before fixing

**Category A — Bug in PR:** The PR broke something unintentionally (typo, wrong variable, renamed ID without updating refs). → Fix the source code. Do NOT touch tests.

**Category B — Intentional change, tests outdated:** The PR intentionally changed behavior/UI and the tests need updating. → Update the test YAML files. Do NOT revert source.

**Category C — Unclear / risky:** Cannot confidently determine intent. → Make NO changes. Explain why.

## Instructions:
- Run 'git diff HEAD~1' or 'gh pr diff' to see what changed in this PR.
- Read the Maestro test YAML files for the failing tests.
- Read the Maestro log files in the e2e-artifacts/ folder for error details.

## Rules:
1. State CATEGORY: A, B, or C with one-line reason
2. State FIX_DESCRIPTION: a short (1-2 sentence) description of what you changed and why
3. A → fix source only. B → fix tests only. C → no changes.
4. Minimal changes only.
5. Read the actual Maestro log files for error details before making changes.

IMPORTANT: If a testID or selector changed in the source code, prefer Category B
(update tests to match the new selector). Only use Category A if the change
is clearly a typo or unintentional breakage.

Start response with: CATEGORY: A|B|C — reason"
  else
    STILL_FAILING_LIST=""
    for t in "${STILL_FAILING[@]}"; do
      STILL_FAILING_LIST="${STILL_FAILING_LIST}
- $t"
    done
    FIX_PROMPT="Your previous fix did not work. The following tests still fail after your changes:
${STILL_FAILING_LIST}

The verification re-ran the tests with your changes applied.
Check e2e-artifacts/maestro/ for the latest Maestro logs from the verification run.
These logs reflect the state AFTER your fix — use them to understand what is still broken.

Try a different approach. Remember:
- CATEGORY A: fix source code only
- CATEGORY B: fix test files only
- State CATEGORY and FIX_DESCRIPTION in your response."
  fi

  echo "Running Claude Code..."
  if [[ "$ATTEMPT" -eq 1 ]]; then
    CLAUDE_OUTPUT=$(echo "$FIX_PROMPT" | claude -p --dangerously-skip-permissions --session-id "$CLAUDE_SESSION_ID" 2>&1) || true
  else
    CLAUDE_OUTPUT=$(echo "$FIX_PROMPT" | claude -p --dangerously-skip-permissions --resume "$CLAUDE_SESSION_ID" 2>&1) || true
  fi

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
  FIX_DESCRIPTION=$(echo "$CLAUDE_OUTPUT" | grep -o "FIX_DESCRIPTION: .*" | head -1 | sed "s/FIX_DESCRIPTION: //" || echo "Fix applied by Claude Code")

  # ─── Verify ──────────────────────────────────────────────────────
  VERIFIED_TESTS=() STILL_FAILING=() VERIFY_SKIPPED=false

  if [[ "$SKIP_VERIFY" = true ]]; then
    echo "⏭️ Skipping verify"
    VERIFY_SKIPPED=true
    VERIFIED_TESTS=("${FAILED_TESTS[@]}")
    FIXED=true; break
  else
    echo ""

    # Determine if we need to rebuild the app
    ONLY_TEST_FILES=true
    while IFS= read -r f; do
      [[ -z "$f" ]] && continue
      if [[ "$f" != e2e/* ]]; then
        ONLY_TEST_FILES=false
        break
      fi
    done <<< "$FIX_FILES"

    if [[ "$ONLY_TEST_FILES" = true ]]; then
      echo "=== Only test files changed — no rebuild needed ==="
    elif [[ -z "$PLATFORM" ]]; then
      echo "⚠️ No --platform specified — skipping rebuild (source changes won't be verified)"
    elif [[ -z "${ARTIFACT_PATH_FOR_E2E:-}" ]]; then
      echo "⚠️ No ARTIFACT_PATH_FOR_E2E — skipping rebuild"
    else
      # Compare native fingerprint to detect if we need a full rebuild or just JS re-sign
      echo "=== Source code changed — checking fingerprint ==="
      NEW_FINGERPRINT=$(npx rock fingerprint --platform "$PLATFORM" --raw 2>/dev/null | head -1)
      OLD_FINGERPRINT="${BUILD_FINGERPRINT:-}"

      if [[ -n "$OLD_FINGERPRINT" && "$NEW_FINGERPRINT" != "$OLD_FINGERPRINT" ]]; then
        echo "🔨 Native fingerprint changed — full rebuild required"
        if [[ "$PLATFORM" = "ios" ]]; then
          npx rock build:ios --configuration Release --destination "generic/platform=iOS Simulator"
          # Find and install the new .app
          NEW_APP=$(find ios/build -name "*.app" -type d | head -1)
          if [[ -n "$NEW_APP" ]]; then
            xcrun simctl terminate booted me.rainbow 2>/dev/null || true
            xcrun simctl uninstall booted me.rainbow 2>/dev/null || true
            xcrun simctl install booted "$NEW_APP"
            echo "✅ Full rebuild complete and installed"
          else
            echo "❌ Build succeeded but could not find .app"
          fi
        elif [[ "$PLATFORM" = "android" ]]; then
          npx rock build:android --variant release
          NEW_APK=$(find android/app/build -name "*.apk" | head -1)
          if [[ -n "$NEW_APK" ]]; then
            adb install -r "$NEW_APK"
            echo "✅ Full rebuild complete and installed"
          else
            echo "❌ Build succeeded but could not find .apk"
          fi
        fi
      else
        echo "📦 Native fingerprint unchanged — JS-only re-sign"
        if [[ "$PLATFORM" = "ios" ]]; then
          npx rock sign:ios "$ARTIFACT_PATH_FOR_E2E" --app --build-jsbundle
          echo "Terminating and uninstalling app before reinstall..."
          xcrun simctl terminate booted me.rainbow 2>/dev/null || true
          xcrun simctl uninstall booted me.rainbow 2>/dev/null || true
          echo "Installing from: $ARTIFACT_PATH_FOR_E2E"
          ls -la "$ARTIFACT_PATH_FOR_E2E/main.jsbundle" 2>/dev/null || echo "(no main.jsbundle found)"
          md5 -q "$ARTIFACT_PATH_FOR_E2E/main.jsbundle" 2>/dev/null || true
          xcrun simctl install booted "$ARTIFACT_PATH_FOR_E2E"
          echo "Verifying install..."
          CONTAINER=$(xcrun simctl get_app_container booted me.rainbow 2>/dev/null) && echo "✅ App container: $CONTAINER" || echo "⚠️ App container not found"
          if [[ -n "$CONTAINER" ]]; then
            echo "Installed bundle hash:"
            md5 -q "$CONTAINER/main.jsbundle" 2>/dev/null || true
          fi
          echo "✅ App re-signed and reinstalled"
        elif [[ "$PLATFORM" = "android" ]]; then
          npx rock sign:android "$ARTIFACT_PATH_FOR_E2E" --build-jsbundle
          adb install -r "$ARTIFACT_PATH_FOR_E2E"
          echo "✅ APK re-signed and reinstalled"
        fi
      fi
    fi

    echo "=== Verifying ${#FAILED_FLOWS[@]} test(s) ==="

    for j in "${!FAILED_FLOWS[@]}"; do
      FLOW="${FAILED_FLOWS[$j]}"
      TEST_NAME="${FAILED_TESTS[$j]}"
      echo "🧪 $TEST_NAME..."
      VERIFY_EXIT=0
      ./scripts/e2e-run.sh --flow "$FLOW" || VERIFY_EXIT=$?

      if [[ "$VERIFY_EXIT" -eq 0 ]]; then
        echo "  ✅ PASSED"
        VERIFIED_TESTS+=("$TEST_NAME")
      else
        echo "  ❌ STILL FAILING"
        STILL_FAILING+=("$TEST_NAME")
      fi
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
    git commit -m "[autofix] e2e ci fix for PR #${PR_NUMBER}

${CAT_LABEL}
Verified: ${#VERIFIED_TESTS[@]}/${#FAILED_TESTS[@]}

Co-authored-by: Claude <noreply@anthropic.com>"

    git push origin "$AUTOFIX_BRANCH" --force

    FIX_PR_URL=$(gh pr create --repo "$REPO" --base "$PR_BRANCH" --head "$AUTOFIX_BRANCH" \
      --title "[autofix] e2e ci fix for PR #${PR_NUMBER}" \
      --body "## 🤖 E2E Autofix

$TABLE

$VERIFY_MSG

**Classification:** $CAT_LABEL
**Fix:** $FIX_DESCRIPTION

### Changed files
$(echo "$FIX_FILES" | sed 's/^/- /')

_Generated by E2E Autofix_" --no-maintainer-edit 2>&1)

    gh pr comment "$PR_NUMBER" --repo "$REPO" --body "## 🤖 E2E Autofix

$TABLE
$VERIFY_MSG

**Classification:** $CAT_LABEL
**Fix:** $FIX_DESCRIPTION
**Fix PR:** $FIX_PR_URL"

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

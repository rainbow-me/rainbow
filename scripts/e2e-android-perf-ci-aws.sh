#!/bin/bash

set -euo pipefail

BUNDLE_NAME="e2e-android-test-bundle.zip"
TMP_DIR="tmp-devicefarm-test"
ENTRY_SCRIPT="scripts/e2e-android-perf-aws-test.sh"
TESTSPEC_ARN="arn:aws:devicefarm:us-west-2:420893459882:upload:c41a0d34-1e25-41ca-9fa0-5d42c9e2a881/57abaa86-de5e-436a-bb20-4906bc68c7e1"

# Required env
: "${ARTIFACT_PATH_FOR_E2E:?Environment variable ARTIFACT_PATH_FOR_E2E is required}"
: "${PROJECT_ARN:?Environment variable PROJECT_ARN is required}"
: "${DEVICE_POOL_ARN:?Environment variable DEVICE_POOL_ARN is required}"

# Create a temporary folder structure
rm -rf "$TMP_DIR"
mkdir -p "$TMP_DIR/e2e"

# Copy test dependencies
cp -r e2e/. "$TMP_DIR/e2e/"
cp "$ENTRY_SCRIPT" "$TMP_DIR/run-test.sh"
chmod +x "$TMP_DIR/run-test.sh"

# Create .env with RESULTS_TITLE inside the bundle
ENV_PATH="$TMP_DIR/.env"
if [[ -n "${GITHUB_PR_NUMBER:-}" ]]; then
  RESULTS_TITLE="Current (#${GITHUB_PR_NUMBER})"
  RUN_NAME="Flashlight Maestro Perf Test (#${GITHUB_PR_NUMBER})"
else
  SHORT_SHA=$(git rev-parse --short HEAD)
  RESULTS_TITLE="Baseline (${SHORT_SHA})"
  RUN_NAME="Flashlight Maestro Perf Test (${SHORT_SHA})"
fi
echo "RESULTS_TITLE=\"$RESULTS_TITLE\"" > "$ENV_PATH"

# Zip the bundle
(cd "$TMP_DIR" && zip -r "../$BUNDLE_NAME" .)
echo "✅ Created test bundle: $BUNDLE_NAME"

# Upload APK
echo "📤 Uploading APK..."
APP_UPLOAD_RESULT=$(aws devicefarm create-upload \
  --project-arn "$PROJECT_ARN" \
  --name "$(basename "$ARTIFACT_PATH_FOR_E2E")" \
  --type ANDROID_APP)
APP_UPLOAD_ARN=$(echo "$APP_UPLOAD_RESULT" | jq -r '.upload.arn')
APP_UPLOAD_URL=$(echo "$APP_UPLOAD_RESULT" | jq -r '.upload.url')

curl --fail --upload-file "$ARTIFACT_PATH_FOR_E2E" "$APP_UPLOAD_URL"

# Upload test bundle
echo "📤 Uploading test bundle..."
TEST_UPLOAD_RESULT=$(aws devicefarm create-upload \
  --project-arn "$PROJECT_ARN" \
  --name "$BUNDLE_NAME" \
  --type APPIUM_NODE_TEST_PACKAGE)
TEST_UPLOAD_ARN=$(echo "$TEST_UPLOAD_RESULT" | jq -r '.upload.arn')
TEST_UPLOAD_URL=$(echo "$TEST_UPLOAD_RESULT" | jq -r '.upload.url')

curl --fail --upload-file "$BUNDLE_NAME" "$TEST_UPLOAD_URL"

# Wait for uploads
echo "⏳ Waiting for uploads to complete..."
for UPLOAD_ARN in "$APP_UPLOAD_ARN" "$TEST_UPLOAD_ARN"; do
  while true; do
    STATUS=$(aws devicefarm get-upload --arn "$UPLOAD_ARN" --query "upload.status" --output text)
    if [[ "$STATUS" == "SUCCEEDED" ]]; then break; fi
    if [[ "$STATUS" == "FAILED" ]]; then echo "❌ Upload failed for $UPLOAD_ARN"; exit 1; fi
    sleep 5
  done
done

echo "✅ All uploads complete."

sleep 5

TEST_JSON=$(printf '{"type": "APPIUM_NODE", "testPackageArn": "%s", "testSpecArn": "%s"}' "$TEST_UPLOAD_ARN" "$TESTSPEC_ARN")
RUN_ARN=$(aws devicefarm schedule-run \
  --project-arn "$PROJECT_ARN" \
  --app-arn "$APP_UPLOAD_ARN" \
  --device-pool-arn "$DEVICE_POOL_ARN" \
  --name "$RUN_NAME" \
  --test "$TEST_JSON" \
  --query "run.arn" --output text)

echo "✅ Test scheduled successfully."

echo "⏳ Waiting for test to complete..."
while true; do
  STATUS=$(aws devicefarm get-run --arn "$RUN_ARN" --query "run.status" --output text)
  echo "Current status: $STATUS"
  if [[ "$STATUS" == "COMPLETED" || "$STATUS" == "ERRORED" || "$STATUS" == "STOPPED" ]]; then
    break
  fi
  sleep 10
done

RESULT=$(aws devicefarm get-run --arn "$RUN_ARN" --query "run.result" --output text)
if [[ "$RESULT" == "PASSED" ]]; then
  echo "✅ Run completed successfully."
else
  echo "❌ Test run failed with result: $RESULT"
  exit 1
fi

# Create local artifact dir
PERF_DIR="e2e-artifacts"
mkdir -p "$PERF_DIR"

echo "📥 Downloading Customer Artifacts..."

# Locate the ZIP artifact
ARTIFACT_ZIP_URL=$(aws devicefarm list-artifacts \
  --arn "$RUN_ARN" \
  --type FILE \
  --query "artifacts[?type=='CUSTOMER_ARTIFACT'].url" \
  --output text)

if [[ -z "$ARTIFACT_ZIP_URL" ]]; then
  echo "❌ Could not find CUSTOMER_ARTIFACT zip."
  exit 1
fi

# Download and extract
ARTIFACTS_DIR="e2e-artifacts"
mkdir -p "$ARTIFACTS_DIR"
curl -s -o "$ARTIFACTS_DIR/results.zip" "$ARTIFACT_ZIP_URL"
unzip -o "$ARTIFACTS_DIR/results.zip" -d "$ARTIFACTS_DIR"

# Locate tti.json within extracted ZIP
TTI_JSON_PATH=$(find "$PERF_DIR" -name "tti.json" | head -n1)

if [[ -z "$TTI_JSON_PATH" || ! -f "$TTI_JSON_PATH" ]]; then
  echo "❌ Could not find tti.json in extracted artifact."
  echo "✅ DEBUG: Listing files in $PERF_DIR:"
  find "$PERF_DIR"
  exit 1
fi

# Copy to a location that is easily accessible for GitHub Actions
mkdir -p "$ARTIFACTS_DIR/perf"
cp "$TTI_JSON_PATH" "$ARTIFACTS_DIR/perf/tti.json"

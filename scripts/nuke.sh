#!/usr/bin/env bash
# debug log

echo " 🤖 Attempting to clean android build..."
yarn clean:android > /dev/null 2>&1 || true
echo "Done. "

echo " 🍎  Attempting to clean iOS build..."
yarn clean:ios  > /dev/null 2>&1 || true
echo "Done. "

echo " 🕳  Attempting to clean JS deps..."
yarn clean:node  > /dev/null 2>&1 || true
echo "Done. "

echo "Clean up complete. You can now run 'yarn fast' to install all the app dependencies."
#!/bin/bash

echo "🌈 Setting up environment"
if [ -f .env ]; then
  source .env
else
  echo "🚨 .env file not found"
  exit 1
fi

echo "🌈 Creating .easignore"
bash $RAINBOW_SCRIPTS_APP_EASIGNORE_HOOK;

echo "🌈 Finished preboot..."

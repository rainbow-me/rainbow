#!/bin/bash
source .env
npx hardhat node --fork "$ETHEREUM_MAINNET_RPC_DEV" --fork-block-number 18700000
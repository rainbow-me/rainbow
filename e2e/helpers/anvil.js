/**
 * Anvil JSON-RPC helpers for Maestro E2E tests.
 *
 * Method names match Anvil's RPC interface. Params pass through directly.
 * Uses Maestro's built-in http client for HTTP calls.
 *
 * Setup — load once per flow:
 *   - runScript: { file: ../../helpers/anvil.js }
 *
 * Usage:
 *   - evalScript: ${output.anvil.evm_setAutomine(false)}
 *   - evalScript: ${output.anvil.evm_mine()}
 *   - evalScript: ${output.anvil.anvil_impersonateAccount('0x...')}
 */

// --- Config (inherited from scripts/anvil.sh) ---

const ANVIL_PORT = 8545;
const ANVIL_URL = 'http://127.0.0.1:' + ANVIL_PORT;

// --- Internals ---

function rpc(method, params) {
  const body = JSON.stringify({ jsonrpc: '2.0', method: method, params: params || [], id: 1 });
  // eslint-disable-next-line no-undef
  const response = http.post(ANVIL_URL, {
    headers: { 'Content-Type': 'application/json' },
    body: body,
  });
  const parsed = JSON.parse(response.body);
  if (parsed.error) {
    throw new Error(method + ' failed: ' + parsed.error.message);
  }
  return parsed.result;
}

// --- Anvil RPC methods (names match JSON-RPC interface) ---

// eslint-disable-next-line no-undef
output.anvil = {
  // EVM methods
  evm_setAutomine: function (enabled) {
    return rpc('evm_setAutomine', [enabled]);
  },
  evm_mine: function (timestamp) {
    return rpc('evm_mine', timestamp != null ? [timestamp] : []);
  },
  evm_setIntervalMining: function (intervalMs) {
    return rpc('evm_setIntervalMining', [intervalMs]);
  },
  evm_setBlockGasLimit: function (gasLimit) {
    return rpc('evm_setBlockGasLimit', [gasLimit]);
  },

  // Anvil-specific methods
  anvil_mine: function (numBlocks, interval) {
    return rpc('anvil_mine', [numBlocks, interval]);
  },
  anvil_getAutomine: function () {
    return rpc('anvil_getAutomine', []);
  },
  anvil_setChainId: function (chainId) {
    return rpc('anvil_setChainId', [chainId]);
  },
  anvil_impersonateAccount: function (address) {
    return rpc('anvil_impersonateAccount', [address]);
  },
  anvil_stopImpersonatingAccount: function (address) {
    return rpc('anvil_stopImpersonatingAccount', [address]);
  },
  anvil_setBlockTimestampInterval: function (seconds) {
    return rpc('anvil_setBlockTimestampInterval', [seconds]);
  },
  anvil_removeBlockTimestampInterval: function () {
    return rpc('anvil_removeBlockTimestampInterval', []);
  },
};

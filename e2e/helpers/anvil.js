/**
 * Anvil JSON-RPC helpers for Maestro E2E tests.
 *
 * Method names match Anvil's RPC interface. Params pass through directly.
 * Uses GraalJS Java interop (java.net.http.HttpClient) for synchronous HTTP.
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

/* eslint-disable no-undef */
const HttpClient = java.net.http.HttpClient;
const HttpRequest = java.net.http.HttpRequest;
const HttpResponse = java.net.http.HttpResponse;
const URI = java.net.URI;
/* eslint-enable no-undef */

const client = HttpClient.newHttpClient();

function rpc(method, params) {
  const body = JSON.stringify({ jsonrpc: '2.0', method: method, params: params || [], id: 1 });
  const request = HttpRequest.newBuilder()
    .uri(URI.create(ANVIL_URL))
    .header('Content-Type', 'application/json')
    .POST(HttpRequest.BodyPublishers.ofString(body))
    .build();
  const response = client.send(request, HttpResponse.BodyHandlers.ofString()).body();
  const parsed = JSON.parse(response);
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

import * as AbiError from 'ox/AbiError';
import {
  BaseError,
  ccipReadTunnel,
  ccipRequest,
  concat,
  createClient,
  encodeAbiParameters,
  http,
  isAddressEqual,
  isHex,
  offchainLookupAbiItem,
  offchainLookupSignature,
  RpcRequestError,
  type Client,
  type Hex,
  type Transport,
} from 'viem';
import { call, type CallParameters, type CallReturnType } from 'viem/actions';
import { mainnet } from 'viem/chains';

import { backendNetworksActions } from '@/features/network/stores/backendNetworksStore';
import { ChainId } from '@/features/network/types/backendNetworks';
import { time } from '@/framework/core/utils/time';

export type EnsClient = Client<Transport, typeof mainnet>;

const BATCH_GATEWAYS = ['https://ccip-v3.ens.xyz'];
const LOOKUP_TIMEOUT_MS = time.seconds(15);
const MAX_CCIP_LOOKUPS = 8;
const ABI_ENCODE_PARAMS = [{ type: 'bytes' }, { type: 'bytes' }] as const;
const OFFCHAIN_LOOKUP_ERROR = AbiError.from(offchainLookupAbiItem);

/**
 * Runs ENS contract reads through the shared timeout and bounded CCIP transport.
 */
export async function withEnsClient<T>(read: (client: EnsClient) => Promise<T>, signal?: AbortSignal): Promise<T> {
  if (signal?.aborted) throw new Error('ENS lookup cancelled');

  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(abort, LOOKUP_TIMEOUT_MS);

  try {
    const base = createClient({
      chain: mainnet,
      ccipRead: false,
      transport: http(backendNetworksActions.getChainDefaultRpc(ChainId.mainnet), {
        retryCount: 0,
        timeout: 0,
        fetchOptions: { signal: controller.signal },
      }),
    });

    const gateway = ccipReadTunnel({
      batchGateways: BATCH_GATEWAYS,
      ccipRequest: parameters => ccipRequest({ ...parameters, requestOptions: { signal: controller.signal } }),
    });

    const client = base.extend(() => ({
      call: (parameters: CallParameters<typeof mainnet>) => callWithCcip(base, parameters, gateway.request, controller.signal),
    }));

    return await read(client);
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}

/**
 * Completes a contract read through bounded CCIP callbacks.
 *
 * Each gateway reply must pass its contract callback, including the final
 * allowed lookup.
 */
async function callWithCcip(
  client: EnsClient,
  parameters: CallParameters<typeof mainnet>,
  requestGateway: typeof ccipRequest,
  signal: AbortSignal
): Promise<CallReturnType> {
  let data = parameters.data;
  const requestOptions = { ...parameters.requestOptions, signal };

  for (let lookups = 0; ; lookups += 1) {
    if (signal.aborted) throw new Error('ENS lookup cancelled');

    try {
      return await call(client, { ...parameters, data, requestOptions });
    } catch (error) {
      const revertData = getRevertData(error);
      if (!parameters.to || !revertData?.startsWith(offchainLookupSignature)) throw error;

      const { sender, urls, callData, callbackFunction, extraData } = AbiError.decode(OFFCHAIN_LOOKUP_ERROR, revertData, { as: 'Object' });

      if (!isAddressEqual(sender, parameters.to)) throw new Error('CCIP lookup sender does not match the called contract');
      if (lookups === MAX_CCIP_LOOKUPS) throw new Error('ENS lookup exceeded its CCIP request limit');

      const response = await requestGateway({ sender, urls, data: callData });
      data = concat([callbackFunction, encodeAbiParameters(ABI_ENCODE_PARAMS, [response, extraData])]);
    }
  }
}

/**
 * Extracts direct or nested revert bytes from this client's HTTP RPC error.
 */
function getRevertData(error: unknown): Hex | undefined {
  if (!(error instanceof BaseError)) return undefined;

  const cause = error.walk(isRpcRequestError);
  if (!isRpcRequestError(cause)) return undefined;

  const payload = cause.data;
  const data = payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload;

  return isHex(data, { strict: true }) ? data : undefined;
}

function isRpcRequestError(error: unknown): error is RpcRequestError {
  return error instanceof RpcRequestError;
}

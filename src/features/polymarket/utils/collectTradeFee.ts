import { createGelatoEvmRelayerClient } from '@gelatocloud/gasless/_dist/relayer/evm/index.js';
import { ChainId } from '@rainbow-me/swaps';
import { type Address, erc20Abi, encodeFunctionData, parseUnits, zeroAddress } from 'viem';
import { GELATO_API_KEY } from 'react-native-dotenv';
import { getPolymarketClobClient, usePolymarketClients } from '@/features/polymarket/stores/derived/usePolymarketClients';
import { getProvider } from '@/handlers/web3';
import { ensureError, logger, RainbowError } from '@/logger';
import { mulWorklet } from '@/framework/core/safeMath';
import { POLYGON_USDC_ADDRESS, RAINBOW_POLYMARKET_FEE_ADDRESS, USD_FEE_PER_TOKEN } from '../constants';
import { analytics } from '@/analytics';
import ethereumUtils from '@/utils/ethereumUtils';
import { ChainId as BackendChainId } from '@/state/backendNetworks/types';
import { time } from '@/utils/time';

const ZERO_BN = 0n;

const safeAbi = [
  {
    name: 'execTransaction',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'data', type: 'bytes' },
      { name: 'operation', type: 'uint8' },
      { name: 'safeTxGas', type: 'uint256' },
      { name: 'baseGas', type: 'uint256' },
      { name: 'gasPrice', type: 'uint256' },
      { name: 'gasToken', type: 'address' },
      { name: 'refundReceiver', type: 'address' },
      { name: 'signatures', type: 'bytes' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'nonce',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

const safeTxTypes = {
  SafeTx: [
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'data', type: 'bytes' },
    { name: 'operation', type: 'uint8' },
    { name: 'safeTxGas', type: 'uint256' },
    { name: 'baseGas', type: 'uint256' },
    { name: 'gasPrice', type: 'uint256' },
    { name: 'gasToken', type: 'address' },
    { name: 'refundReceiver', type: 'address' },
    { name: 'nonce', type: 'uint256' },
  ],
};

type CollectTradeFeeResult = {
  success: boolean;
  taskId: string;
  transactionHash?: string;
  errorMessage?: string;
  gasUsed?: string;
  effectiveGasPrice?: string;
};

// TODO: Figure out if there are transient error cases and implement retry logic
export async function collectTradeFee(tokenAmount: string): Promise<CollectTradeFeeResult | undefined> {
  const safeAddress = usePolymarketClients.getState().proxyAddress;
  if (!safeAddress) {
    throw new RainbowError('[collectTradeFee] No proxy address available');
  }
  const feeAmount = mulWorklet(tokenAmount, USD_FEE_PER_TOKEN);
  let taskId: string | undefined;

  try {
    /**
     * We use the CLOB client's signer to sign the transaction because it is already unlocked from placing the trade
     * Otherwise, we would need to show biometrics twice for every trade
     */
    const polymarketClobClient = await getPolymarketClobClient();
    const signer = polymarketClobClient.signer;
    if (!signer) {
      throw new RainbowError('[collectTradeFee] Failed to get signer');
    }

    const nonce = await getSafeNonce(safeAddress);

    const transferData = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'transfer',
      args: [RAINBOW_POLYMARKET_FEE_ADDRESS, parseUnits(feeAmount, 6)],
    });

    const safeTxData = {
      to: POLYGON_USDC_ADDRESS,
      value: ZERO_BN,
      data: transferData,
      operation: 0,
      safeTxGas: ZERO_BN,
      baseGas: ZERO_BN,
      gasPrice: ZERO_BN,
      gasToken: zeroAddress,
      refundReceiver: zeroAddress,
      nonce,
    };

    const domain = {
      chainId: ChainId.polygon,
      verifyingContract: safeAddress,
    };

    const signature = await signer._signTypedData(domain, safeTxTypes, safeTxData);

    const execData = encodeFunctionData({
      abi: safeAbi,
      functionName: 'execTransaction',
      args: [
        safeTxData.to,
        safeTxData.value,
        safeTxData.data,
        safeTxData.operation,
        safeTxData.safeTxGas,
        safeTxData.baseGas,
        safeTxData.gasPrice,
        safeTxData.gasToken,
        safeTxData.refundReceiver,
        signature,
      ],
    });

    const gelatoRelayer = createGelatoEvmRelayerClient({
      apiKey: GELATO_API_KEY,
      pollingInterval: time.ms(500),
      timeout: time.seconds(30),
    });

    taskId = await gelatoRelayer.sendTransaction({
      chainId: ChainId.polygon,
      to: safeAddress,
      data: execData,
    });

    /**
     * Use polling is required because the Websocket constructor used in the package does not correctly attach the auth headers for RN.
     * @gelatocloud/gasless builds WS in non-browser mode as:
     * new WebSocket(url, { headers: { Authorization: ... } })
     * In React Native, headers must be passed as the 3rd constructor arg:
     * new WebSocket(url, protocols, { headers })
     */
    const receipt = await gelatoRelayer.waitForReceipt({ id: taskId }, { usePolling: true });
    const result: CollectTradeFeeResult = {
      success: true,
      taskId,
      transactionHash: receipt.transactionHash,
      gasUsed: receipt.gasUsed.toString(),
      effectiveGasPrice: receipt.effectiveGasPrice.toString(),
    };

    const gasCostUsd = getGasCostUsd(result);

    analytics.track(analytics.event.predictionsCollectTradeFee, {
      feeAmountUsd: Number(feeAmount),
      netFeeAmountUsd: Number(feeAmount) - (gasCostUsd ?? 0),
      gasCostUsd: gasCostUsd ?? 0,
    });

    return result;
  } catch (e) {
    const error = ensureError(e);
    logger.error(new RainbowError('[Polymarket collectTradeFee] Error collecting trade fee', error), {
      tokenAmount,
      feeAmount,
    });
    analytics.track(analytics.event.predictionsCollectTradeFeeFailed, {
      tokenAmount: Number(tokenAmount),
      feeAmountUsd: Number(feeAmount),
      taskId,
      safeAddress,
      errorMessage: error.message,
    });
  }
}

async function getSafeNonce(safeAddress: Address): Promise<bigint> {
  const provider = getProvider({ chainId: ChainId.polygon });
  const data = encodeFunctionData({ abi: safeAbi, functionName: 'nonce' });
  const result = await provider.call({ to: safeAddress, data });
  return BigInt(result);
}

function getGasCostUsd(result: CollectTradeFeeResult): number | undefined {
  if (!result.gasUsed || !result.effectiveGasPrice) {
    return undefined;
  }

  const gasCostWei = BigInt(result.gasUsed) * BigInt(result.effectiveGasPrice);
  const gasCostMatic = Number(gasCostWei) / 1e18;
  const maticPriceUsd = ethereumUtils.getPriceOfNativeAssetForNetwork({ chainId: BackendChainId.polygon });

  if (!maticPriceUsd) {
    return undefined;
  }

  return gasCostMatic * maticPriceUsd;
}

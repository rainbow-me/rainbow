import { GelatoRelay, SponsoredCallRequest, TaskState } from '@gelatonetwork/relay-sdk';
import { Address, erc20Abi, encodeFunctionData, parseUnits, zeroAddress } from 'viem';
import { ChainId } from '@rainbow-me/swaps';
import { getProvider } from '@/handlers/web3';
import { ensureError, logger, RainbowError } from '@/logger';
import { usePolymarketProxyAddress } from '@/features/polymarket/stores/derived/usePolymarketProxyAddress';
import { POLYGON_USDC_ADDRESS, USD_FEE_PER_TOKEN } from '../constants';
import { mulWorklet } from '@/safe-math/SafeMath';
import { delay } from '@/utils/delay';
import { time } from '@/utils/time';
import { getPolymarketClobClient } from '@/features/polymarket/stores/derived/usePolymarketClobClient';

const GELATO_API_KEY = '';
// TODO: Move to constants and configure proper recipient
const RAINBOW_POLYMARKET_FEE_ADDRESS = '0x83e3057f7b619ffe340bb8157356e3eb4aecc40f';
const POLLING_INTERVAL = time.seconds(1);
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
};

// TODO: Figure out if there are transient error cases and implement retry logic
export async function collectTradeFee(tokenAmount: string): Promise<CollectTradeFeeResult | undefined> {
  const safeAddress = usePolymarketProxyAddress.getState().proxyAddress as Address;
  const feeAmount = mulWorklet(tokenAmount, USD_FEE_PER_TOKEN);

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

    const gelatoRelay = new GelatoRelay();
    const request: SponsoredCallRequest = {
      chainId: BigInt(ChainId.polygon),
      target: safeAddress,
      data: execData,
    };

    const { taskId } = await gelatoRelay.sponsoredCall(request, GELATO_API_KEY);

    const result = await pollTaskStatus(gelatoRelay, taskId);

    if (!result.success) {
      throw new RainbowError(`[collectTradeFee] Failed to collect trade fee: ${result.errorMessage}`);
    }

    return result;
  } catch (e) {
    const error = ensureError(e);
    logger.error(new RainbowError('[Polymarket collectTradeFee] Error collecting trade fee', error), {
      safeAddress,
      tokenAmount,
      feeAmount,
    });
  }
}

async function getSafeNonce(safeAddress: Address): Promise<bigint> {
  const provider = getProvider({ chainId: ChainId.polygon });
  const data = encodeFunctionData({ abi: safeAbi, functionName: 'nonce' });
  const result = await provider.call({ to: safeAddress, data });
  return BigInt(result);
}

async function pollTaskStatus(relay: GelatoRelay, taskId: string): Promise<CollectTradeFeeResult> {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const status = await relay.getTaskStatus(taskId);
    const taskState = status?.taskState;
    if (!taskState) {
      await delay(POLLING_INTERVAL);
      continue;
    }

    if (taskState === TaskState.ExecSuccess) {
      return {
        success: true,
        taskId,
        transactionHash: status?.transactionHash,
      };
    }

    if (taskState === TaskState.Cancelled || taskState === TaskState.ExecReverted) {
      return {
        success: false,
        taskId,
        errorMessage: status?.lastCheckMessage ?? `Gelato transaction failed with state: ${taskState}`,
        transactionHash: status?.transactionHash,
      };
    }

    await delay(POLLING_INTERVAL);
  }
}

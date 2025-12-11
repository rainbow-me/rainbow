import { GelatoRelay, SponsoredCallRequest, TaskState } from '@gelatonetwork/relay-sdk';
import { Address, erc20Abi, encodeFunctionData, Hex, parseUnits, WalletClient, zeroAddress } from 'viem';
import { ChainId } from '@rainbow-me/swaps';
import { getProvider } from '@/handlers/web3';
import { ensureError, logger, RainbowError } from '@/logger';
import { usePolymarketProxyAddress } from '@/features/polymarket/stores/derived/usePolymarketProxyAddress';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { loadViemWallet } from './loadViemWallet';
import { POLYGON_USDC_ADDRESS, USD_FEE_PER_TOKEN } from '../constants';
import { LedgerSigner } from '@/handlers/LedgerSigner';
import { mulWorklet } from '@/safe-math/SafeMath';
import { delay } from '@/utils/delay';
import { time } from '@/utils/time';

// TODO: Move to environment variable
const GELATO_API_KEY = 'nyRoSDLjBOBgKIhKbIXxBxrdKfKDNrazOr_10HELMLA_';
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
} as const;

type CollectTradeFeeResult = {
  success: boolean;
  taskId: string;
  transactionHash?: string;
  errorMessage?: string;
};

// TODO: Figure out if there are transient error cases and implement retry logic
export async function collectTradeFee(tokenAmount: string): Promise<CollectTradeFeeResult | undefined> {
  const address = useWalletsStore.getState().accountAddress as Hex;
  const safeAddress = usePolymarketProxyAddress.getState().proxyAddress as Address;
  const feeAmount = mulWorklet(tokenAmount, USD_FEE_PER_TOKEN);

  try {
    const wallet = await loadViemWallet(address, getProvider({ chainId: ChainId.polygon }));

    if (wallet instanceof LedgerSigner) {
      throw new RainbowError('[collectTradeFee] Hardware wallets are not supported for fee collection');
    }

    if (!isViemWalletClient(wallet)) {
      throw new RainbowError('[collectTradeFee] Unexpected wallet type');
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

    const signature = await wallet.signTypedData({
      domain: {
        chainId: ChainId.polygon,
        verifyingContract: safeAddress,
      },
      types: safeTxTypes,
      primaryType: 'SafeTx',
      message: safeTxData,
    });

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

function isViemWalletClient(wallet: unknown): wallet is WalletClient {
  return wallet !== null && typeof wallet === 'object' && 'signTypedData' in wallet;
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

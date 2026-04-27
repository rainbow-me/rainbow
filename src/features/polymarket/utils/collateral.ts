import { type Signer } from '@ethersproject/abstract-signer';
import { OperationType, type RelayClient, type SafeTransaction } from '@polymarket/builder-relayer-client';
import { BigNumber, ethers } from 'ethers';

import {
  POLYGON_USDC_ADDRESS,
  POLYMARKET_COLLATERAL_OFFRAMP_ADDRESS,
  POLYMARKET_COLLATERAL_ONRAMP_ADDRESS,
  POLYMARKET_PUSD_ADDRESS,
} from '@/features/polymarket/constants';
import { getPolymarketRelayClient, usePolymarketClients } from '@/features/polymarket/stores/derived/usePolymarketClients';
import { getMissingErc20ApprovalTransaction } from '@/features/polymarket/utils/erc20Approval';
import { createPolymarketRelayClient, deployProxyIfNeeded, executeRelayTransaction } from '@/features/polymarket/utils/proxyWallet';
import { refetchPolymarketBalance } from '@/features/polymarket/utils/refetchPolymarketStores';
import { getProvider } from '@/handlers/web3';
import { logger, RainbowError } from '@/logger';
import erc20ABI from '@/references/erc20-abi.json';
import { type DepositSubmitContext } from '@/systems/funding/types';
import { delay } from '@/utils/delay';
import { time } from '@/utils/time';
import { ChainId } from '@rainbow-me/swaps';

// ========== Contracts ==========

const polygonProvider = getProvider({ chainId: ChainId.polygon });
const usdcContract = new ethers.Contract(POLYGON_USDC_ADDRESS, erc20ABI, polygonProvider);
const collateralRampInterface = new ethers.utils.Interface([
  'function wrap(address _asset, address _to, uint256 _amount)',
  'function unwrap(address _asset, address _to, uint256 _amount)',
]);

// ========== Transaction Builders ==========

function buildWrapUsdcToPusdTransaction(recipient: string, amount: BigNumber): SafeTransaction {
  return {
    to: POLYMARKET_COLLATERAL_ONRAMP_ADDRESS,
    data: collateralRampInterface.encodeFunctionData('wrap', [POLYGON_USDC_ADDRESS, recipient, amount]),
    value: '0',
    operation: OperationType.Call,
  };
}

function buildUnwrapPusdToUsdcTransaction(recipient: string, amount: BigNumber): SafeTransaction {
  return {
    to: POLYMARKET_COLLATERAL_OFFRAMP_ADDRESS,
    data: collateralRampInterface.encodeFunctionData('unwrap', [POLYGON_USDC_ADDRESS, recipient, amount]),
    value: '0',
    operation: OperationType.Call,
  };
}

// ========== Collateral Checks ==========

async function getUsdcBalance(proxyAddress: string): Promise<BigNumber> {
  return (await usdcContract.balanceOf(proxyAddress)) as BigNumber;
}

function parseExpectedRawTargetAmount(rawAmount: string | undefined): BigNumber | null {
  if (!rawAmount || rawAmount === '0') return null;

  try {
    return BigNumber.from(rawAmount);
  } catch {
    return null;
  }
}

async function waitForSubmittedDeposit({ confirmationChainId, hash, isConfirmed }: DepositSubmitContext): Promise<void> {
  if (!hash || isConfirmed) return;

  try {
    await getProvider({ chainId: confirmationChainId }).waitForTransaction(hash, 1, time.minutes(3));
  } catch (error) {
    logger.warn('[polymarket] Deposit confirmation wait timed out before wrapping', { error, hash });
  }
}

async function waitForWrappableUsdcBalance(proxyAddress: string, expectedRawTargetAmount?: string): Promise<BigNumber> {
  const expectedBalance = parseExpectedRawTargetAmount(expectedRawTargetAmount);
  const startedAt = Date.now();

  while (Date.now() - startedAt < time.minutes(10)) {
    const usdcBalance = await getUsdcBalance(proxyAddress);
    const hasExpectedBalance = expectedBalance ? usdcBalance.gte(expectedBalance) : !usdcBalance.isZero();

    if (hasExpectedBalance) {
      return usdcBalance;
    }

    await delay(time.seconds(3));
  }

  throw new RainbowError('[polymarket] Timed out waiting for USDC.e deposit to arrive');
}

// ========== Public API ==========

export async function buildUnwrapPusdToUsdcTransactions({
  amount,
  proxyAddress,
  recipient,
}: {
  amount: BigNumber;
  proxyAddress: string;
  recipient: string;
}): Promise<SafeTransaction[]> {
  return [
    ...(await getMissingErc20ApprovalTransaction({
      amount,
      owner: proxyAddress,
      provider: polygonProvider,
      spender: POLYMARKET_COLLATERAL_OFFRAMP_ADDRESS,
      tokenAddress: POLYMARKET_PUSD_ADDRESS,
    })),
    buildUnwrapPusdToUsdcTransaction(recipient, amount),
  ];
}

export async function buildEnsureUsdcBalanceTransactions({
  amount,
  proxyAddress,
}: {
  amount: BigNumber;
  proxyAddress: string;
}): Promise<SafeTransaction[]> {
  const usdcBalance = await getUsdcBalance(proxyAddress);
  if (usdcBalance.gte(amount)) return [];

  return buildUnwrapPusdToUsdcTransactions({
    amount: amount.sub(usdcBalance),
    proxyAddress,
    recipient: proxyAddress,
  });
}

export async function handlePolymarketDepositSubmitted(signer: Signer, context: DepositSubmitContext): Promise<void> {
  const proxyAddress = usePolymarketClients.getState().proxyAddress;
  if (!proxyAddress) {
    throw new RainbowError('[polymarket] No proxy address available');
  }

  const client = createPolymarketRelayClient(signer);
  await deployProxyIfNeeded(client, proxyAddress);
  await waitForSubmittedDeposit(context);

  const usdcBalance = await waitForWrappableUsdcBalance(proxyAddress, context.expectedRawTargetAmount);
  await wrapUsdcToPusd({ client, proxyAddress, amount: usdcBalance });
  await refetchPolymarketBalance();
}

export async function wrapUsdcBalanceToPusd(proxyAddress: string): Promise<void> {
  const usdcBalance = await getUsdcBalance(proxyAddress);
  if (usdcBalance.isZero()) return;

  const client = await getPolymarketRelayClient();

  await wrapUsdcToPusd({ client, proxyAddress, amount: usdcBalance });
  await refetchPolymarketBalance();
}

async function wrapUsdcToPusd({
  client,
  proxyAddress,
  amount,
}: {
  client: RelayClient;
  proxyAddress: string;
  amount: BigNumber;
}): Promise<void> {
  const transactions = [
    ...(await getMissingErc20ApprovalTransaction({
      amount,
      owner: proxyAddress,
      provider: polygonProvider,
      spender: POLYMARKET_COLLATERAL_ONRAMP_ADDRESS,
      tokenAddress: POLYGON_USDC_ADDRESS,
    })),
    buildWrapUsdcToPusdTransaction(proxyAddress, amount),
  ];

  await executeRelayTransaction(client, transactions, 'wrap USDC.e to pUSD');
}

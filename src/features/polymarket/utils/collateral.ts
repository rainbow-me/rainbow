import { OperationType, type RelayClient, type SafeTransaction } from '@polymarket/builder-relayer-client';
import { ethers, type BigNumber } from 'ethers';

import {
  POLYGON_USDC_ADDRESS,
  POLYMARKET_COLLATERAL_OFFRAMP_ADDRESS,
  POLYMARKET_COLLATERAL_ONRAMP_ADDRESS,
  POLYMARKET_PUSD_ADDRESS,
} from '@/features/polymarket/constants';
import { getPolymarketRelayClient } from '@/features/polymarket/stores/derived/usePolymarketClients';
import { getMissingErc20ApprovalTransaction } from '@/features/polymarket/utils/erc20Approval';
import { executeRelayTransaction } from '@/features/polymarket/utils/proxyWallet';
import { refetchPolymarketBalance } from '@/features/polymarket/utils/refetchPolymarketStores';
import { getProvider } from '@/handlers/web3';
import erc20ABI from '@/references/erc20-abi.json';
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

// ========== Public API ==========

export async function getPolymarketUsdcBalance(proxyAddress: string): Promise<BigNumber> {
  return (await usdcContract.balanceOf(proxyAddress)) as BigNumber;
}

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
      amount: amount.toString(),
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
  const usdcBalance = await getPolymarketUsdcBalance(proxyAddress);
  if (usdcBalance.gte(amount)) return [];

  return buildUnwrapPusdToUsdcTransactions({
    amount: amount.sub(usdcBalance),
    proxyAddress,
    recipient: proxyAddress,
  });
}

export async function wrapUsdcAmountToPusd({ amount, proxyAddress }: { amount: BigNumber; proxyAddress: string }): Promise<void> {
  if (amount.isZero()) return;

  const client = await getPolymarketRelayClient();

  await wrapUsdcToPusd({ client, proxyAddress, amount });
  await refetchPolymarketBalance();
}

export async function wrapUsdcToPusd({
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
      amount: amount,
      owner: proxyAddress,
      provider: polygonProvider,
      spender: POLYMARKET_COLLATERAL_ONRAMP_ADDRESS,
      tokenAddress: POLYGON_USDC_ADDRESS,
    })),
    buildWrapUsdcToPusdTransaction(proxyAddress, amount),
  ];

  await executeRelayTransaction(client, transactions, 'wrap USDC.e to pUSD');
}

import { OperationType, type SafeTransaction } from '@polymarket/builder-relayer-client';
import { ethers, type BigNumber } from 'ethers';
import { type Address } from 'viem';

import {
  POLYGON_USDC_ADDRESS,
  POLYMARKET_COLLATERAL_OFFRAMP_ADDRESS,
  POLYMARKET_COLLATERAL_ONRAMP_ADDRESS,
  POLYMARKET_PUSD_ADDRESS,
} from '@/features/polymarket/constants';
import { getMissingErc20ApprovalTransaction } from '@/features/polymarket/utils/erc20Approval';
import { executeRelayTransaction } from '@/features/polymarket/utils/proxyWallet';
import { refetchPolymarketBalance } from '@/features/polymarket/utils/refetchPolymarketStores';
import { getErc20Balance } from '@/framework/data/evm/erc20Read';
import { getProvider } from '@/handlers/web3';
import { ChainId } from '@rainbow-me/swaps';

// ========== Contracts ==========

const polygonProvider = getProvider({ chainId: ChainId.polygon });
const collateralRampInterface = new ethers.utils.Interface([
  'function wrap(address _asset, address _to, uint256 _amount)',
  'function unwrap(address _asset, address _to, uint256 _amount)',
]);

// ========== Transaction Builders ==========

function buildWrapUsdcToPusdTransaction(recipient: Address, amount: BigNumber): SafeTransaction {
  return {
    to: POLYMARKET_COLLATERAL_ONRAMP_ADDRESS,
    data: collateralRampInterface.encodeFunctionData('wrap', [POLYGON_USDC_ADDRESS, recipient, amount]),
    value: '0',
    operation: OperationType.Call,
  };
}

function buildUnwrapPusdToUsdcTransaction(recipient: Address, amount: BigNumber): SafeTransaction {
  return {
    to: POLYMARKET_COLLATERAL_OFFRAMP_ADDRESS,
    data: collateralRampInterface.encodeFunctionData('unwrap', [POLYGON_USDC_ADDRESS, recipient, amount]),
    value: '0',
    operation: OperationType.Call,
  };
}

// ========== Public API ==========

export async function getPolygonUsdcBalance(address: Address): Promise<BigNumber> {
  return getErc20Balance({ owner: address, provider: polygonProvider, tokenAddress: POLYGON_USDC_ADDRESS });
}

export async function buildUnwrapPusdToUsdcTransactions({
  amount,
  proxyAddress,
  recipient,
}: {
  amount: BigNumber;
  proxyAddress: Address;
  recipient: Address;
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
  proxyAddress: Address;
}): Promise<SafeTransaction[]> {
  const usdcBalance = await getPolygonUsdcBalance(proxyAddress);
  if (usdcBalance.gte(amount)) return [];

  return buildUnwrapPusdToUsdcTransactions({
    amount: amount.sub(usdcBalance),
    proxyAddress,
    recipient: proxyAddress,
  });
}

export async function wrapUsdcAmountToPusd({ amount, proxyAddress }: { amount: BigNumber; proxyAddress: Address }): Promise<void> {
  if (amount.isZero()) return;

  await wrapUsdcToPusd({ proxyAddress, amount });
  await refetchPolymarketBalance();
}

export async function wrapUsdcToPusd({ proxyAddress, amount }: { proxyAddress: Address; amount: BigNumber }): Promise<void> {
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

  await executeRelayTransaction(transactions, 'wrap USDC.e to pUSD');
}

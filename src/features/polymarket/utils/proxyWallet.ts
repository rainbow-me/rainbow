import { getPolymarketRelayClient, usePolymarketRelayClient } from '@/features/polymarket/stores/derived/usePolymarketRelayClient';
import { ethers } from 'ethers';
import { erc20ABI } from '@/references';
import { equalWorklet } from '@/safe-math/SafeMath';
import { POLYGON_USDC_ADDRESS, POLYMARKET_CTF_ADDRESS } from '@/features/polymarket/constants';
import { getProvider } from '@/handlers/web3';
import { ChainId } from '@rainbow-me/swaps';
import { OperationType, RelayerTransaction, SafeTransaction } from '@polymarket/builder-relayer-client';
import { Interface } from 'ethers/lib/utils';

const erc20Interface = new Interface([
  {
    constant: false,
    inputs: [
      { name: '_spender', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
]);

const usdcContract = new ethers.Contract(POLYGON_USDC_ADDRESS, erc20ABI, getProvider({ chainId: ChainId.polygon }));

function buildApprovalTransaction(tokenAddress: string, spenderAddress: string): SafeTransaction {
  return {
    to: tokenAddress,
    operation: OperationType.Call,
    data: erc20Interface.encodeFunctionData('approve', [spenderAddress, ethers.constants.MaxUint256]),
    value: '0',
  };
}

async function isUsdcMaxApprovedForCtf(address: string): Promise<boolean> {
  const allowance = await usdcContract.allowance(address, POLYMARKET_CTF_ADDRESS);
  return equalWorklet(allowance, ethers.constants.MaxUint256.toString());
}

export async function ensureUsdcIsMaxApprovedForCtf(address: string): Promise<RelayerTransaction | undefined> {
  const isApproved = await isUsdcMaxApprovedForCtf(address);
  if (isApproved) return;

  const client = await getPolymarketRelayClient();

  const approvalTx = buildApprovalTransaction(POLYGON_USDC_ADDRESS, POLYMARKET_CTF_ADDRESS);
  const response = await client.execute([approvalTx], 'usdc approval on the CTF');

  return await response.wait();
}

export async function ensureProxyWalletIsDeployed(address: string): Promise<RelayerTransaction | undefined> {
  const client = await getPolymarketRelayClient();

  // @ts-expect-error - TODO: patch getDeployed to be public
  const isDeployed = await client.getDeployed(address);

  if (!isDeployed) {
    const response = await client.deploy();
    return await response.wait();
  }
}

export async function ensureProxyWalletIsDeployedAndUsdcMaxApproved(): Promise<void> {
  const proxyAddress = usePolymarketRelayClient.getState().proxyAddress;

  const deployTx = await ensureProxyWalletIsDeployed(proxyAddress);
  const approveTx = await ensureUsdcIsMaxApprovedForCtf(proxyAddress);

  console.log('deployTx', JSON.stringify(deployTx, null, 2));
  console.log('approveTx', JSON.stringify(approveTx, null, 2));
}

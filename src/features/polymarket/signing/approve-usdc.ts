import { OperationType, SafeTransaction } from '@polymarket/builder-relayer-client';
import { Interface } from 'ethers/lib/utils';
import { ethers } from 'ethers';
import { getPolymarketRelayClient } from '@/features/polymarket/stores/derived/usePolymarketRelayClient';

const POLYGON_USDC_ADDRESS = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
const POLYMARKET_CTF_ADDRESS = '0x4d97dcd97ec945f40cf65f87097ace5ea0476045';

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

function createApprovalTransaction(tokenAddress: string, spenderAddress: string): SafeTransaction {
  return {
    to: tokenAddress,
    operation: OperationType.Call,
    data: erc20Interface.encodeFunctionData('approve', [spenderAddress, ethers.constants.MaxUint256]),
    value: '0',
  };
}

async function approveUsdc() {
  const approvalTx = createApprovalTransaction(POLYGON_USDC_ADDRESS, POLYMARKET_CTF_ADDRESS);

  const client = await getPolymarketRelayClient();
  if (!client) return;

  const response = await client.execute([approvalTx], 'usdc approval on the CTF');
  const result = await response.wait();
  console.log('Approval completed:', JSON.stringify(result, null, 2));
}

async function isUsdcApproved() {
  //
}

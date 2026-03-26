import { type Signer } from '@ethersproject/abstract-signer';
import { type Address, type Hex, decodeFunctionResult, encodeAbiParameters, encodeFunctionData, zeroAddress, zeroHash } from 'viem';
import { loadWallet, signTypedDataMessage } from '@/model/wallet';
import { getProvider } from '@/handlers/web3';
import { time } from '@/utils/time';
import type { StaticJsonRpcProvider } from '@ethersproject/providers';

type BatchCallForSigning = {
  to: Address;
  value: bigint;
  data: Hex;
};

type CaliburDomain = {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: Address;
  salt: Hex;
};

type SignedBatchedCall = {
  batchedCall: {
    calls: BatchCallForSigning[];
    revertOnFailure: boolean;
  };
  nonce: bigint;
  keyHash: Hex;
  executor: Address;
  deadline: bigint;
};

/**
 * Signs a batched call using EIP-712 and encodes the `execute(SignedBatchedCall, bytes)`
 * calldata for the Calibur delegation contract. This allows any address (e.g. a Gelato
 * relayer) to submit the transaction on behalf of the user.
 */
export async function prepareSignedBatchedCalldata({
  address,
  chainId,
  calls,
  signer,
  keyHash = ROOT_KEY_HASH,
  executor = PERMISSIONLESS_EXECUTOR,
  deadline = BigInt(Math.floor(Date.now() / 1000) + time.hours(1) / 1000),
  nonceKey = ROOT_NONCE_KEY,
  revertOnFailure = true,
}: {
  address: Address;
  chainId: number;
  calls: BatchCallForSigning[];
  signer?: Signer;
  keyHash?: Hex;
  executor?: Address;
  deadline?: bigint;
  nonceKey?: bigint;
  revertOnFailure?: boolean;
}): Promise<{ to: Address; data: Hex }> {
  const provider = getProvider({ chainId });
  const { nonce, domain } = await fetchCaliburNonceAndDomain({ address, provider, nonceKey });

  const signedBatchedCall: SignedBatchedCall = {
    batchedCall: {
      calls,
      revertOnFailure,
    },
    nonce,
    keyHash,
    executor,
    deadline,
  };

  const rawSignature = await signBatchedCallTypedData({
    address,
    provider,
    domain,
    signedBatchedCall,
    signer,
  });
  const wrappedSignature = encodeAbiParameters([{ type: 'bytes' }, { type: 'bytes' }], [rawSignature, EMPTY_HOOK_DATA]);

  // Encode the execute(SignedBatchedCall, bytes) calldata
  const data = encodeFunctionData({
    abi: caliberAbi,
    functionName: 'execute',
    args: [signedBatchedCall, wrappedSignature],
  });

  return { to: address, data };
}

async function fetchCaliburNonceAndDomain({
  address,
  provider,
  nonceKey,
}: {
  address: Address;
  provider: StaticJsonRpcProvider;
  nonceKey: bigint;
}): Promise<{ nonce: bigint; domain: CaliburDomain }> {
  const getSeqData = encodeFunctionData({ abi: caliberAbi, functionName: 'getSeq', args: [nonceKey] });
  const nonceSequenceResult = await provider.call({ to: address, data: getSeqData });
  const nonceSequence = decodeFunctionResult({
    abi: caliberAbi,
    functionName: 'getSeq',
    data: nonceSequenceResult as Hex,
  });
  const nonce = (nonceKey << 64n) | nonceSequence;

  const eip712DomainData = encodeFunctionData({ abi: caliberAbi, functionName: 'eip712Domain' });
  const eip712DomainResult = await provider.call({ to: address, data: eip712DomainData });
  const [, name, version, chainId, verifyingContract, salt] = decodeFunctionResult({
    abi: caliberAbi,
    functionName: 'eip712Domain',
    data: eip712DomainResult as Hex,
  });

  return {
    nonce,
    domain: {
      name,
      version,
      chainId: Number(chainId.toString()),
      verifyingContract,
      salt,
    },
  };
}

async function signBatchedCallTypedData({
  address,
  provider,
  domain,
  signedBatchedCall,
  signer: existingSigner,
}: {
  address: Address;
  provider: StaticJsonRpcProvider;
  domain: CaliburDomain;
  signedBatchedCall: SignedBatchedCall;
  signer?: Signer;
}): Promise<Hex> {
  // Sign via EIP-712
  const signer = existingSigner ?? (await loadWallet({ address, provider }));
  if (!signer) {
    throw new Error('Failed to load wallet for signing');
  }

  const typedData = {
    types: EIP712_TYPES,
    primaryType: 'SignedBatchedCall',
    domain,
    message: {
      batchedCall: {
        calls: signedBatchedCall.batchedCall.calls.map(c => ({ to: c.to, value: c.value.toString(), data: c.data })),
        revertOnFailure: signedBatchedCall.batchedCall.revertOnFailure,
      },
      nonce: signedBatchedCall.nonce.toString(),
      keyHash: signedBatchedCall.keyHash,
      executor: signedBatchedCall.executor,
      deadline: signedBatchedCall.deadline.toString(),
    },
  };

  const signResult = await signTypedDataMessage(typedData, provider, signer);
  if (!signResult?.result || signResult?.error) {
    throw new Error(`Failed to sign batched call: ${signResult?.error?.message ?? 'Unknown error'}`);
  }

  return signResult.result as Hex;
}

/**
 * Subset of the Calibur ABI used for local helpers.
 * https://github.com/Uniswap/calibur
 */
const caliberAbi = [
  {
    name: 'execute',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'signedBatchedCall',
        type: 'tuple',
        components: [
          {
            name: 'batchedCall',
            type: 'tuple',
            components: [
              {
                name: 'calls',
                type: 'tuple[]',
                components: [
                  { name: 'to', type: 'address' },
                  { name: 'value', type: 'uint256' },
                  { name: 'data', type: 'bytes' },
                ],
              },
              { name: 'revertOnFailure', type: 'bool' },
            ],
          },
          { name: 'nonce', type: 'uint256' },
          { name: 'keyHash', type: 'bytes32' },
          { name: 'executor', type: 'address' },
          { name: 'deadline', type: 'uint256' },
        ],
      },
      { name: 'wrappedSignature', type: 'bytes' },
    ],
    outputs: [],
  },
  {
    name: 'getSeq',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'key', type: 'uint256' }],
    outputs: [{ name: 'seq', type: 'uint256' }],
  },
  {
    name: 'eip712Domain',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'fields', type: 'bytes1' },
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
      { name: 'salt', type: 'bytes32' },
      { name: 'extensions', type: 'uint256[]' },
    ],
  },
] as const;

/** The root EOA owner key in Calibur is always bytes32(0) */
const ROOT_KEY_HASH = zeroHash;

/** address(0) for executor means any address can relay */
const PERMISSIONLESS_EXECUTOR = zeroAddress;
const ROOT_NONCE_KEY = 0n;
const EMPTY_HOOK_DATA = '0x';

const EIP712_TYPES = {
  EIP712Domain: [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' },
    { name: 'salt', type: 'bytes32' },
  ],
  SignedBatchedCall: [
    { name: 'batchedCall', type: 'BatchedCall' },
    { name: 'nonce', type: 'uint256' },
    { name: 'keyHash', type: 'bytes32' },
    { name: 'executor', type: 'address' },
    { name: 'deadline', type: 'uint256' },
  ],
  BatchedCall: [
    { name: 'calls', type: 'Call[]' },
    { name: 'revertOnFailure', type: 'bool' },
  ],
  Call: [
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'data', type: 'bytes' },
  ],
};

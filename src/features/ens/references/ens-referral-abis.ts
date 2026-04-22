export const UNWRAPPED_REGISTRAR_ABI = [
  {
    name: 'register',
    type: 'function',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'owner', type: 'address' },
      { name: 'duration', type: 'uint256' },
      { name: 'secret', type: 'bytes32' },
      { name: 'resolver', type: 'address' },
      { name: 'data', type: 'bytes[]' },
      { name: 'reverseRecord', type: 'bool' },
      { name: 'ownerControlledFuses', type: 'uint16' },
      { name: 'referrer', type: 'bytes32' },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    name: 'rentPrice',
    type: 'function',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'duration', type: 'uint256' },
    ],
    outputs: [
      {
        name: 'price',
        type: 'tuple',
        components: [
          { name: 'base', type: 'uint256' },
          { name: 'premium', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
] as const;

export const UNIVERSAL_RENEWAL_ABI = [
  {
    name: 'renew',
    type: 'function',
    inputs: [
      { name: 'label', type: 'string' },
      { name: 'duration', type: 'uint256' },
      { name: 'referrer', type: 'bytes32' },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
] as const;
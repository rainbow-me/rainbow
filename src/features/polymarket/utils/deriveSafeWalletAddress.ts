import { getCreate2Address, type Hex, keccak256, encodeAbiParameters, type Address } from 'viem';

const SAFE_INIT_CODE_HASH = '0x2bce2127ff07fb632d16c8347c4ebf501f4841168bed00d9e6ef715ddb6fcecf';

const POLYGON_SAFE_CONTRACTS = {
  SafeContracts: {
    SafeFactory: '0xaacFeEa03eb1561C4e67d661e40682Bd20E3541b',
    SafeMultisend: '0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761',
  },
};

export function deriveSafeWalletAddress(address: Address): Address {
  return getCreate2Address({
    bytecodeHash: SAFE_INIT_CODE_HASH as Hex,
    from: POLYGON_SAFE_CONTRACTS.SafeContracts.SafeFactory as Hex,
    salt: keccak256(encodeAbiParameters([{ name: 'address', type: 'address' }], [address as Hex])),
  });
}

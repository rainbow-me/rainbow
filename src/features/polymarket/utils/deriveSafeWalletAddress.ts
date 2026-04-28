import { encodeAbiParameters, getCreate2Address, keccak256, type Address, type Hex } from 'viem';

const SAFE_INIT_CODE_HASH: Hex = '0x2bce2127ff07fb632d16c8347c4ebf501f4841168bed00d9e6ef715ddb6fcecf';
const POLYGON_SAFE_FACTORY_ADDRESS: Address = '0xaacFeEa03eb1561C4e67d661e40682Bd20E3541b';

export function deriveSafeWalletAddress(address: Address): Address {
  return getCreate2Address({
    bytecodeHash: SAFE_INIT_CODE_HASH,
    from: POLYGON_SAFE_FACTORY_ADDRESS,
    salt: keccak256(encodeAbiParameters([{ name: 'address', type: 'address' }], [address])),
  });
}

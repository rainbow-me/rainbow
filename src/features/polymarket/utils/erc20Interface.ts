import { Interface } from '@ethersproject/abi';

// ============ ERC20 Interface =============================================== //

export const erc20Interface = new Interface([
  'function approve(address spender, uint256 value)',
  'function transfer(address to, uint256 value)',
]);

// ============ ERC1155 Interface ============================================= //

export const erc1155Interface = new Interface([
  'function setApprovalForAll(address operator, bool approved)',
  'function isApprovedForAll(address account, address operator) view returns (bool)',
]);

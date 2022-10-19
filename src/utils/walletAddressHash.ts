import { ethers } from 'ethers';
import { WALLET_ADDRESS_HASH_KEY } from 'react-native-dotenv';

type WalletAddress = `0x${string}`;

let currentWalletAddressHash: string | undefined = undefined;

function hash(value: string) {
  return ethers.utils.computeHmac(
    ethers.utils.SupportedAlgorithm.sha256,
    WALLET_ADDRESS_HASH_KEY,
    value
  );
}

export function setCurrentWalletAddress(walletAddress: WalletAddress) {
  currentWalletAddressHash = hash(walletAddress);
}

export function getCurrentWalletAddress() {
  return currentWalletAddressHash;
}

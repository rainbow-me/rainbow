import { loadWallet } from '@/model/wallet';
import { Network } from '@/networks/types';
import {
  getPublicClientForNetwork,
  getWalletClientForAddress,
} from '@/viem/utils';
import { privateKeyToAccount } from 'viem/accounts';
import * as wagmi from '../generated';

const calculateZoraEditionPrice = (
  price: bigint,
  zoraFee: bigint,
  quantity: bigint
) => {
  const pricePer = price + zoraFee;

  return quantity * pricePer;
};

const getZoraEditionPrice = async ({
  contractAddress,
  network,
  quantity = 1n,
}: {
  contractAddress: `0x${string}`;
  network: Network;
  quantity: bigint;
}) => {
  const publicClient = getPublicClientForNetwork(network);

  const saleDetails = await publicClient.readContract({
    address: contractAddress,
    abi: wagmi.zoraDropABI,
    functionName: 'saleDetails',
  });

  const zoraFee = await publicClient.readContract({
    address: contractAddress,
    abi: wagmi.zoraDropABI,
    functionName: 'zoraFeeForAmount',
    args: [1n],
  });

  return calculateZoraEditionPrice(
    saleDetails.publicSalePrice,
    zoraFee[1],
    quantity
  );
};

export const mintZoraEdition = async ({
  accountAddress,
  contractAddress,
  network,
  quantity,
}: {
  accountAddress: `0x${string}`;
  contractAddress: `0x${string}`;
  network: Network;
  quantity: bigint;
}) => {
  // set up viem account
  const wallet = await loadWallet(accountAddress, false);
  console.log('post wallet');
  const account = privateKeyToAccount(wallet?.privateKey as `0x${string}`);

  // calculate eth value for purchase
  const txValue = await getZoraEditionPrice({
    contractAddress,
    network,
    quantity,
  });

  // prepare contract call
  const publicClient = getPublicClientForNetwork(network);
  const { request: purchaseRequest } = await publicClient.simulateContract({
    account,
    address: contractAddress,
    abi: wagmi.zoraDropABI,
    functionName: 'purchase',
    args: [quantity],
    value: txValue,
  });

  const walletClient = await getWalletClientForAddress(
    accountAddress,
    network,
    account
  );
  // @ts-ignore unsure why it doesnt like value (was working in earlier viem version)
  return await walletClient.writeContract(purchaseRequest);
};

export const getZoraEditionBalance = async ({
  contractAddress,
  network,
}: {
  contractAddress: `0x${string}`;
  network: Network;
}) => {
  const publicClient = getPublicClientForNetwork(network);
  return await publicClient.getBalance({ address: contractAddress });
};

export const withdrawETHZoraEdition = async ({
  accountAddress,
  contractAddress,
  network,
}: {
  accountAddress: `0x${string}`;
  contractAddress: `0x${string}`;
  network: Network;
}) => {
  const wallet = await loadWallet(accountAddress, false);
  const account = privateKeyToAccount(wallet?.privateKey as `0x${string}`);

  // prepare contract call
  const publicClient = getPublicClientForNetwork(network);

  const { request } = await publicClient.simulateContract({
    account,
    address: contractAddress,
    abi: wagmi.zoraDropABI,
    functionName: 'withdraw',
  });

  const walletClient = await getWalletClientForAddress(
    accountAddress,
    network,
    account
  );
  return await walletClient.writeContract(request);
};

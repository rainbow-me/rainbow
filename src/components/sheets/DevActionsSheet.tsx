import { Sheet } from '@/components/sheet';
import { Box, Text } from '@/design-system';
import { NewTransaction, TransactionStatus } from '@/entities';
import { ChainId } from '@/state/backendNetworks/types';
import { addNewTransaction, usePendingTransactionsStore } from '@/state/pendingTransactions';
import { useAccountAddress } from '@/state/wallets/walletsStore';
import { SwapType } from '@rainbow-me/swaps';
import React from 'react';
import { Button, ScrollView } from 'react-native';
import { toHex } from 'viem';

const generateRandomHash = (): string => {
  // Generate a random 64-character hex string (32 bytes)
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
};

export function DevActionsSheet() {
  const accountAddress = useAccountAddress();

  const createMockSendTransaction = (status: TransactionStatus): NewTransaction => {
    return {
      chainId: ChainId.mainnet,
      from: accountAddress,
      to: '0x742d35Cc6634C0532925a3b8D93c6C4cae6AaAaA',
      hash: generateRandomHash(),
      nonce: Math.floor(Math.random() * 1000),
      network: 'mainnet',
      type: 'send' as const,
      value: toHex(1000000000000000000n), // 1 ETH
      symbol: 'ETH',
      name: 'Etherum',
      status,
    };
  };

  const createMockSwapTransaction = (status: TransactionStatus): NewTransaction => {
    return {
      chainId: ChainId.mainnet,
      from: accountAddress,
      to: '0x1111111254fb6c44bAC0beD2854e76F90643097d',
      hash: generateRandomHash(),
      nonce: Math.floor(Math.random() * 1000),
      network: 'mainnet',
      type: 'swap' as const,
      status,
      swap: {
        type: SwapType.normal,
        fromChainId: ChainId.mainnet,
        toChainId: ChainId.polygon,
        isBridge: false,
      },
    };
  };

  const createMockMintTransaction = (status: TransactionStatus): NewTransaction => {
    return {
      chainId: ChainId.mainnet,
      from: accountAddress,
      to: '0x495f947276749ce646f68ac8c248420045cb7b5e',
      hash: generateRandomHash(),
      nonce: Math.floor(Math.random() * 1000),
      network: 'mainnet',
      type: 'mint' as const,
      status,
      description: 'A beautiful NFT',
    };
  };

  // the stores own update doesn't change status so we force it this way
  function updateTransaction(transaction: NewTransaction) {
    const { pendingTransactions } = usePendingTransactionsStore.getState();
    usePendingTransactionsStore.getState().setPendingTransactions({
      address: accountAddress,
      pendingTransactions: pendingTransactions[accountAddress].map(px => {
        if (px.hash === transaction.hash) {
          return {
            ...px,
            status: transaction.status,
          };
        }
        return px;
      }),
    });
  }

  function addThenUpdate(transaction: NewTransaction) {
    addNewTransaction({
      address: accountAddress,
      chainId: ChainId.mainnet,
      transaction,
    });
    updateTransaction(transaction);
    added.push(transaction);
  }

  const addSendTransaction = () => {
    addThenUpdate(createMockSendTransaction(TransactionStatus.sending));
  };

  const addSwapTransaction = () => {
    addThenUpdate(createMockSwapTransaction(TransactionStatus.swapping));
  };

  const addMintTransaction = () => {
    addThenUpdate(createMockMintTransaction(TransactionStatus.minting));
  };

  const added: NewTransaction[] = [];

  const updateLatestTransactionOfType = (type: 'mint' | 'swap' | 'send', status: TransactionStatus) => {
    const latest = added.findLast(px => px.type === type);
    if (latest) {
      updateTransaction({
        ...latest,
        status,
      });
    }
  };

  const updateLastSendTo = (status: TransactionStatus) => {
    updateLatestTransactionOfType('send', status);
  };

  const updateLastSwapTo = (status: TransactionStatus) => {
    updateLatestTransactionOfType('swap', status);
  };

  const updateLastMintTo = (status: TransactionStatus) => {
    updateLatestTransactionOfType('mint', status);
  };

  return (
    <Sheet>
      <Box paddingHorizontal="20px" paddingTop="44px">
        <Text size="20pt" weight="bold" color="label" align="center">
          Toast Actions
        </Text>

        <ScrollView style={{ marginTop: 20 }} showsVerticalScrollIndicator={false}>
          <Box gap={12}>
            <Button
              onPress={() => {
                usePendingTransactionsStore.getState().setPendingTransactions({
                  address: accountAddress,
                  pendingTransactions: [],
                });
              }}
              title="Clear All"
            />

            <Text size="17pt" weight="semibold" color="label">
              Add New Transactions
            </Text>

            <Button onPress={addSendTransaction} title="Add Send Transaction" />
            <Button onPress={addSwapTransaction} title="Add Swap Transaction" />
            <Button onPress={addMintTransaction} title="Add Mint Transaction" />

            <Text size="17pt" weight="semibold" color="label" style={{ marginTop: 20 }}>
              Update Send Status
            </Text>

            <Button onPress={() => updateLastSendTo(TransactionStatus.sending)} title="Update Send → Sending" />
            <Button onPress={() => updateLastSendTo(TransactionStatus.sent)} title="Update Send → Sent" />
            <Button onPress={() => updateLastSendTo(TransactionStatus.failed)} title="Update Send → Failed" />

            <Text size="17pt" weight="semibold" color="label" style={{ marginTop: 20 }}>
              Update Swap Status
            </Text>

            <Button onPress={() => updateLastSwapTo(TransactionStatus.swapping)} title="Update Swap → Swapping" />
            <Button onPress={() => updateLastSwapTo(TransactionStatus.swapped)} title="Update Swap → Swapped" />
            <Button onPress={() => updateLastSwapTo(TransactionStatus.failed)} title="Update Swap → Failed" />

            <Text size="17pt" weight="semibold" color="label" style={{ marginTop: 20 }}>
              Update Mint Status
            </Text>

            <Button onPress={() => updateLastMintTo(TransactionStatus.minting)} title="Update Mint → Minting" />
            <Button onPress={() => updateLastMintTo(TransactionStatus.minted)} title="Update Mint → Minted" />
            <Button onPress={() => updateLastMintTo(TransactionStatus.failed)} title="Update Mint → Failed" />
          </Box>
        </ScrollView>
      </Box>
    </Sheet>
  );
}

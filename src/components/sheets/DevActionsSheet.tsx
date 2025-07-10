import React from 'react';
import { ScrollView, Button } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sheet } from '@/components/sheet';
import { Box, Text } from '@/design-system';
import { NewTransaction, TransactionStatus } from '@/entities';
import { ChainId } from '@/state/backendNetworks/types';
import { addNewTransaction, updateTransaction } from '@/state/pendingTransactions';
import { useAccountAddress } from '@/state/wallets/walletsStore';
import { toHex } from 'viem';
import { SwapType } from '@rainbow-me/swaps';

const MOCK_HASH = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

export function DevActionsSheet() {
  const insets = useSafeAreaInsets();
  const accountAddress = useAccountAddress();

  const createMockSendTransaction = (status: TransactionStatus): NewTransaction => {
    return {
      chainId: ChainId.mainnet,
      from: accountAddress,
      to: '0x742d35Cc6634C0532925a3b8D93c6C4cae6AaAaA',
      hash: `${MOCK_HASH}_send_${Date.now()}`,
      nonce: Math.floor(Math.random() * 1000),
      network: 'mainnet',
      type: 'send' as const,
      value: toHex(MOCK_HASH), // 1 ETH
      symbol: 'ETH',
      status,
    };
  };

  const createMockSwapTransaction = (status: TransactionStatus): NewTransaction => {
    return {
      chainId: ChainId.mainnet,
      from: accountAddress,
      to: '0x1111111254fb6c44bAC0beD2854e76F90643097d',
      hash: `${MOCK_HASH}_swap_${Date.now()}`,
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
      hash: `${MOCK_HASH}_mint_${Date.now()}`,
      nonce: Math.floor(Math.random() * 1000),
      network: 'mainnet',
      type: 'mint' as const,
      status,
      description: 'A beautiful NFT',
    };
  };

  const addSendTransaction = () => {
    const transaction = createMockSendTransaction(TransactionStatus.pending);
    addNewTransaction({
      address: accountAddress,
      chainId: ChainId.mainnet,
      transaction,
    });
  };

  const addSwapTransaction = () => {
    const transaction = createMockSwapTransaction(TransactionStatus.pending);
    addNewTransaction({
      address: accountAddress,
      chainId: ChainId.mainnet,
      transaction,
    });
  };

  const addMintTransaction = () => {
    const transaction = createMockMintTransaction(TransactionStatus.pending);
    addNewTransaction({
      address: accountAddress,
      chainId: ChainId.mainnet,
      transaction,
    });
  };

  const updateLastSendTo = (status: TransactionStatus) => {
    const transaction = createMockSendTransaction(status);
    updateTransaction({
      address: accountAddress,
      chainId: ChainId.mainnet,
      transaction,
    });
  };

  const updateLastSwapTo = (status: TransactionStatus) => {
    const transaction = createMockSwapTransaction(status);
    updateTransaction({
      address: accountAddress,
      chainId: ChainId.mainnet,
      transaction,
    });
  };

  const updateLastMintTo = (status: TransactionStatus) => {
    const transaction = createMockMintTransaction(status);
    updateTransaction({
      address: accountAddress,
      chainId: ChainId.mainnet,
      transaction,
    });
  };

  return (
    <Sheet>
      <Box paddingHorizontal="20px" paddingTop="20px" paddingBottom={{ custom: insets.bottom + 20 }}>
        <Text size="20pt" weight="bold" color="label" align="center">
          Dev Actions
        </Text>

        <ScrollView style={{ marginTop: 20 }} showsVerticalScrollIndicator={false}>
          <Box gap={12}>
            <Text size="17pt" weight="semibold" color="label">
              Add New Transactions
            </Text>

            <Button onPress={addSendTransaction} title="Add Send Transaction" />
            <Button onPress={addSwapTransaction} title="Add Swap Transaction" />
            <Button onPress={addMintTransaction} title="Add Mint Transaction" />

            <Text size="17pt" weight="semibold" color="label" style={{ marginTop: 20 }}>
              Update Send Status
            </Text>

            <Button onPress={() => updateLastSendTo(TransactionStatus.pending)} title="Update Send → Pending" />
            <Button onPress={() => updateLastSendTo(TransactionStatus.confirmed)} title="Update Send → Confirmed" />
            <Button onPress={() => updateLastSendTo(TransactionStatus.failed)} title="Update Send → Failed" />

            <Text size="17pt" weight="semibold" color="label" style={{ marginTop: 20 }}>
              Update Swap Status
            </Text>

            <Button onPress={() => updateLastSwapTo(TransactionStatus.pending)} title="Update Swap → Pending" />
            <Button onPress={() => updateLastSwapTo(TransactionStatus.confirmed)} title="Update Swap → Confirmed" />
            <Button onPress={() => updateLastSwapTo(TransactionStatus.failed)} title="Update Swap → Failed" />

            <Text size="17pt" weight="semibold" color="label" style={{ marginTop: 20 }}>
              Update Mint Status
            </Text>

            <Button onPress={() => updateLastMintTo(TransactionStatus.pending)} title="Update Mint → Pending" />
            <Button onPress={() => updateLastMintTo(TransactionStatus.confirmed)} title="Update Mint → Confirmed" />
            <Button onPress={() => updateLastMintTo(TransactionStatus.failed)} title="Update Mint → Failed" />
          </Box>
        </ScrollView>
      </Box>
    </Sheet>
  );
}

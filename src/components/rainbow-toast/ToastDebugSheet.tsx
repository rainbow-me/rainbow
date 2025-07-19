import { useToastStore } from '@/components/rainbow-toast/useRainbowToasts';
import { Sheet } from '@/components/sheet';
import { Box, Text } from '@/design-system';
import { RainbowTransaction, TransactionStatus } from '@/entities';
import { pendingTransactionsStore, usePendingTransactionsStore } from '@/state/pendingTransactions';
import { useAccountAddress } from '@/state/wallets/walletsStore';
import React from 'react';
import { Button, ScrollView } from 'react-native';
import { exampleSwaps, exampleSends, exampleMints } from '@/components/rainbow-toast/mockToastData';

let lastSwap = 0;
let lastSend = 0;
let lastMint = 0;

export function ToastDebugSheet() {
  const accountAddress = useAccountAddress();

  const createMockSendTransaction = (status: TransactionStatus): RainbowTransaction => {
    return {
      ...exampleSends[lastSend++ % exampleSends.length],
      status,
    };
  };

  const createMockSwapTransaction = (status: TransactionStatus): RainbowTransaction => {
    return {
      ...exampleSwaps[lastSwap++ % exampleSwaps.length],
      status,
    };
  };

  const createMockMintTransaction = (status: TransactionStatus): RainbowTransaction => {
    return {
      ...exampleMints[lastMint++ % exampleMints.length],
      status,
    };
  };

  let current: RainbowTransaction[] = [];

  function addThenUpdate(transaction: RainbowTransaction) {
    current = [...current, transaction];
    pendingTransactionsStore.setState(state => ({
      ...state,
      pendingTransactions: {
        [accountAddress]: current,
      },
    }));
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

  const updateLatestTransactionOfType = (type: 'mint' | 'swap' | 'send' | 'contract_interaction', status: TransactionStatus) => {
    const latest = current.findLast(px => px.type === type);
    if (latest) {
      console.info(`Updating`, latest, 'to', type);
      pendingTransactionsStore.setState(state => ({
        ...state,
        pendingTransactions: {
          [accountAddress]: current.map(item => (item === latest ? { ...item, status } : item)),
        },
      }));
      return true;
    } else {
      return false;
    }
  };

  const updateLastSendTo = (status: TransactionStatus) => {
    updateLatestTransactionOfType('send', status);
  };

  const updateLastSwapTo = (status: TransactionStatus) => {
    updateLatestTransactionOfType('swap', status);
  };

  const updateLastMintTo = (status: TransactionStatus) => {
    if (updateLatestTransactionOfType('mint', status)) {
      return;
    }
    updateLatestTransactionOfType('contract_interaction', status);
  };

  return (
    <Sheet>
      <Box paddingHorizontal="20px" paddingTop="44px">
        <Text size="20pt" weight="bold" color="label" align="center">
          Transactions
        </Text>

        <ScrollView style={{ marginTop: 20 }} showsVerticalScrollIndicator={false}>
          <Box gap={12}>
            <Button
              onPress={() => {
                current = [];
                usePendingTransactionsStore.getState().clearPendingTransactions();
                useToastStore.setState(() => ({
                  hiddenToasts: {},
                  toasts: [],
                }));
              }}
              title="Clear All"
            />

            <Text size="17pt" weight="semibold" color="label" style={{ marginTop: 20 }}>
              Send
            </Text>

            <Button onPress={addSendTransaction} title="Add Send Transaction" />
            <Button onPress={() => updateLastSendTo(TransactionStatus.sent)} title="Update Send → Sent" />
            <Button onPress={() => updateLastSendTo(TransactionStatus.failed)} title="Update Send → Failed" />

            <Text size="17pt" weight="semibold" color="label" style={{ marginTop: 20 }}>
              Swap
            </Text>

            <Button onPress={addSwapTransaction} title="Add Swap Transaction" />
            <Button onPress={() => updateLastSwapTo(TransactionStatus.swapped)} title="Update Swap → Swapped" />
            <Button onPress={() => updateLastSwapTo(TransactionStatus.failed)} title="Update Swap → Failed" />

            <Text size="17pt" weight="semibold" color="label" style={{ marginTop: 20 }}>
              Mint
            </Text>

            <Button onPress={addMintTransaction} title="Add Mint Transaction" />
            <Button onPress={() => updateLastMintTo(TransactionStatus.minted)} title="Update Mint → Minted" />
            <Button onPress={() => updateLastMintTo(TransactionStatus.failed)} title="Update Mint → Failed" />
          </Box>
        </ScrollView>
      </Box>
    </Sheet>
  );
}

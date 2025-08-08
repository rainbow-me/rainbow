/* eslint-disable no-plusplus */

import {
  exampleClaims,
  exampleDappSwaps,
  exampleLaunchFlow,
  exampleMints,
  exampleSaleFlow,
  exampleSends,
  exampleSendThenSpeedupFlow,
  exampleSwaps,
} from '@/components/rainbow-toast/mockToastData';
import { useToastStore } from '@/components/rainbow-toast/useRainbowToasts';
import { Sheet } from '@/components/sheet';
import { Box, Text } from '@/design-system';
import { RainbowTransaction, TransactionStatus } from '@/entities';
import { pendingTransactionsStore, usePendingTransactionsStore } from '@/state/pendingTransactions';
import { useAccountAddress } from '@/state/wallets/walletsStore';
import React from 'react';
import { Button, ScrollView, View } from 'react-native';

let lastSwap = 0;
let lastSend = 0;
let lastMint = 0;

export function ToastDebugSheet() {
  const accountAddress = useAccountAddress();

  const createMockSendTransaction = (status: TransactionStatus): RainbowTransaction => {
    return {
      ...exampleSends[lastSend++ % exampleSends.length],
      status,
      title: `send.${status}`,
    };
  };

  const createMockSwapTransaction = (status: TransactionStatus): RainbowTransaction => {
    return {
      ...exampleSwaps[lastSwap++ % exampleSwaps.length],
      status,
      title: `swap.${status}`,
    };
  };

  const createMockMintTransaction = (status: TransactionStatus): RainbowTransaction => {
    return {
      ...exampleMints[lastMint++ % exampleMints.length],
      status,
      title: `mint.${status}`,
    };
  };

  const createMockDappSwapTransaction = (status: TransactionStatus): RainbowTransaction => {
    return {
      ...exampleDappSwaps[lastMint++ % exampleDappSwaps.length],
      status,
      title: `contract_interaction.${status}`,
    };
  };

  const createMockClaimTransaction = (status: TransactionStatus): RainbowTransaction => {
    return {
      ...exampleClaims[lastMint++ % exampleClaims.length],
      status,
      title: `claim.${status}`,
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
    addThenUpdate(createMockSendTransaction(TransactionStatus.pending));
  };

  const addSwapTransaction = () => {
    addThenUpdate(createMockSwapTransaction(TransactionStatus.pending));
  };

  const addMintTransaction = () => {
    addThenUpdate(createMockMintTransaction(TransactionStatus.pending));
  };

  const addDappSwapTransaction = () => {
    addThenUpdate(createMockDappSwapTransaction(TransactionStatus.pending));
  };

  const addClaimTransaction = () => {
    addThenUpdate(createMockClaimTransaction(TransactionStatus.pending));
  };

  const updateLatestTransactionOfType = (type: 'mint' | 'swap' | 'send' | 'contract_interaction', status: TransactionStatus) => {
    const latest = current.findLast(px => px.type === type);
    if (latest) {
      pendingTransactionsStore.setState(state => ({
        ...state,
        pendingTransactions: {
          [accountAddress]: current.map(item => (item === latest ? { ...item, status, title: `${item.type}.${status}` } : item)),
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
    updateLatestTransactionOfType('mint', status);
  };

  const updateDappSwapTo = (status: TransactionStatus) => {
    updateLatestTransactionOfType('contract_interaction', status);
  };

  return (
    <Sheet>
      <Box paddingHorizontal="20px" paddingTop="44px">
        <Text size="20pt" weight="bold" color="label" align="center">
          Transactions
        </Text>

        <ScrollView style={{ marginTop: 30 }} showsVerticalScrollIndicator={false}>
          <Text size="12pt" color="label">
            Note that due to these being fake transactions the expanded toast sheet doesn&apos;t show the right values on the right side for
            the amounts, as the transaction is not actually in the userAssetsStoreManager.
          </Text>

          <Text size="12pt" color="label" style={{ marginTop: 10 }}>
            Also note that in general there&apos;s only 2 example transactions of any given type, and they sometimes will get immediately
            sent into sent state if they&apos;ve been processed by this wallet already.
          </Text>

          <Box gap={5} paddingVertical="32px">
            <Button
              onPress={() => {
                current = [];
                usePendingTransactionsStore.getState().clearPendingTransactions();
                useToastStore.setState(() => ({
                  dismissedToasts: {},
                  hiddenToasts: {},
                  toasts: [],
                }));
              }}
              title="Clear All"
            />

            <Text size="17pt" weight="semibold" color="label" style={{ marginTop: 20 }}>
              Send
            </Text>

            <View style={{ flexDirection: 'row' }}>
              <Button onPress={addSendTransaction} title="Add" />
              <Button onPress={() => updateLastSendTo(TransactionStatus.confirmed)} title="→ Sent" />
              <Button onPress={() => updateLastSendTo(TransactionStatus.failed)} title="→ Failed" />
            </View>

            <View style={{ flexDirection: 'row' }}>
              <Button
                title="Send"
                onPress={() => {
                  addThenUpdate(exampleSendThenSpeedupFlow[0]);
                }}
              />
              <Button
                onPress={() => {
                  addThenUpdate(exampleSendThenSpeedupFlow[1]);
                }}
                title="→ Speedup"
              />
            </View>

            <Text size="17pt" weight="semibold" color="label" style={{ marginTop: 20 }}>
              Swap
            </Text>

            <View style={{ flexDirection: 'row' }}>
              <Button onPress={addSwapTransaction} title="Add" />
              <Button onPress={() => updateLastSwapTo(TransactionStatus.confirmed)} title="→ Swapped" />
              <Button onPress={() => updateLastSwapTo(TransactionStatus.failed)} title="→ Failed" />
            </View>

            <Text size="17pt" weight="semibold" color="label" style={{ marginTop: 20 }}>
              Mint
            </Text>

            <View style={{ flexDirection: 'row' }}>
              <Button onPress={addMintTransaction} title="Add" />
              <Button onPress={() => updateLastMintTo(TransactionStatus.confirmed)} title="→ Minted" />
              <Button onPress={() => updateLastMintTo(TransactionStatus.failed)} title="→ Failed" />
            </View>

            <Text size="17pt" weight="semibold" color="label" style={{ marginTop: 20 }}>
              Dapp Swap
            </Text>

            <View style={{ flexDirection: 'row' }}>
              <Button onPress={addDappSwapTransaction} title="Add" />
              <Button onPress={() => updateDappSwapTo(TransactionStatus.confirmed)} title="→ Swapped" />
              <Button onPress={() => updateDappSwapTo(TransactionStatus.failed)} title="→ Failed" />
            </View>

            <Text size="17pt" weight="semibold" color="label" style={{ marginTop: 20 }}>
              Launch
            </Text>

            <View style={{ flexDirection: 'row' }}>
              <Button
                title="Launch"
                onPress={() => {
                  addThenUpdate(exampleLaunchFlow[0]);
                }}
              />
              <Button
                onPress={() => {
                  addThenUpdate(exampleLaunchFlow[1]);
                }}
                title="→ Launched"
              />
            </View>

            <Text size="17pt" weight="semibold" color="label" style={{ marginTop: 20 }}>
              Claim
            </Text>

            <View style={{ flexDirection: 'row' }}>
              <Button onPress={addClaimTransaction} title="Add" />
            </View>

            <Text size="17pt" weight="semibold" color="label" style={{ marginTop: 20 }}>
              Sale
            </Text>

            <View style={{ flexDirection: 'row' }}>
              <Button
                title="Sell"
                onPress={() => {
                  addThenUpdate(exampleSaleFlow[0]);
                }}
              />
              <Button
                onPress={() => {
                  addThenUpdate(exampleSaleFlow[1]);
                }}
                title="→ Sold"
              />
            </View>
          </Box>
        </ScrollView>
      </Box>
    </Sheet>
  );
}

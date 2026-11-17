import React, { useRef, useState } from 'react';

import { formatUnits } from 'viem';

import { IS_STORE_INSTALL } from '@/env';
import { ChainId } from '@/features/network/types/backendNetworks';
import { type MvpRoute } from '@/features/solana/core/mvpRoutes';
import {
  checkMvpExecution,
  executeMvpTrade,
  getMvpBalances,
  prepareMvpTrade,
  useSolanaMvpExecutionStore,
} from '@/features/solana/data/mvpTrades';
import { useIsSolanaEnabled } from '@/features/solana/hooks/useIsSolanaEnabled';
import { enableSolanaAccount } from '@/features/wallet/data/enableSolanaAccount';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { Menu } from '@/screens/SettingsSheet/components/Menu';
import { MenuItem } from '@/screens/SettingsSheet/components/MenuItem';
import { isTerminalStatus } from '@rainbow-me/solana-sdk';

function confirm(message: string): Promise<boolean> {
  return new Promise(resolve => {
    Alert.alert(
      'Confirm mainnet test swap',
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Swap', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}

export function SolanaMvpMenu() {
  const enabled = useIsSolanaEnabled();
  return !IS_STORE_INSTALL && enabled ? <SolanaMvpControls /> : null;
}

function SolanaMvpControls() {
  const attempt = useSolanaMvpExecutionStore(state => state.attempt);
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);

  const run = async (operation: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      await operation();
    } catch (error) {
      const pending = useSolanaMvpExecutionStore.getState().attempt;
      Alert.alert(
        'Solana test',
        `${error instanceof Error ? error.message.slice(0, 500) : 'Operation failed.'}${pending && !isTerminalStatus(pending.status) ? '\n\nUse “Check execution” before trying another swap.' : ''}`
      );
    } finally {
      // eslint-disable-next-line require-atomic-updates -- only the operation holding this lock reaches finally
      lock.current = false;
      setBusy(false);
    }
  };

  const trade = async (route: MvpRoute) => {
    const quote = await prepareMvpTrade(route);
    const { review } = quote.prepared;
    if (review.output.minimumAmount === undefined) throw new Error('The quote is missing its minimum received amount.');
    const evmSource = route === 'buy' || route === 'buyBonk';
    const input = `${formatUnits(quote.input, evmSource ? 18 : route === 'solToBase' ? 9 : 5)} ${evmSource ? 'Base ETH (approximately $1 at quote time)' : route === 'solToBase' ? 'SOL' : 'BONK'}`;
    const symbol = route === 'buyBonk' ? 'BONK' : route === 'buy' ? 'SOL' : route === 'solToBase' ? 'Base USDC' : 'Solana USDC';
    const message = [
      `Spend: ${input}`,
      `Receive: ${formatUnits(review.output.amount, review.output.decimals)} ${symbol}`,
      `Minimum: ${formatUnits(review.output.minimumAmount, review.output.decimals)} ${symbol}`,
      `From: ${evmSource ? quote.account.sourceEvmAddress : quote.account.address}`,
      `Recipient (${route === 'solToBase' ? 'Base' : 'Solana'}): ${route === 'solToBase' ? quote.account.sourceEvmAddress : quote.account.address}`,
      ...(evmSource ? ['The gasless Base route may authorize Rainbow EVM delegation.'] : []),
      evmSource
        ? 'Full sponsorship required. No user-paid gas fallback.'
        : 'Your Solana wallet pays the source network fee in SOL, in addition to the swap amount. Provider fees remain fully sponsored.',
      `Quote expires: ${new Date(Number(review.expiresAt) * 1000).toLocaleTimeString()}`,
    ].join('\n\n');
    if (!(await confirm(message))) return;
    await executeMvpTrade(quote);
    const latest = useSolanaMvpExecutionStore.getState().attempt;
    Alert.alert(
      'Solana test execution',
      `${latest?.status}\n\n${latest?.executionId}\n\nUse “Check execution” until terminal, then refresh balances.`
    );
  };

  return (
    <Menu header="Solana MVP · mainnet · internal only">
      <MenuItem
        disabled={busy}
        size={60}
        testID="solana-mvp-enable"
        titleComponent={<MenuItem.Title text="Enable Solana for this account" />}
        onPress={() =>
          run(async () => {
            const account = await enableSolanaAccount();
            Alert.alert('Solana enabled', `Subaccount ${account.index}\n\n${account.address}\n\nThe displayed EVM account stays selected.`);
          })
        }
      />
      <MenuItem
        disabled={busy}
        size={60}
        testID="solana-mvp-buy"
        titleComponent={<MenuItem.Title text="Buy SOL with $1 of Base ETH" />}
        onPress={() => run(() => trade('buy'))}
      />
      <MenuItem
        disabled={busy}
        size={60}
        testID="solana-mvp-buy-bonk"
        titleComponent={<MenuItem.Title text="Buy BONK with $1 of Base ETH" />}
        onPress={() => run(() => trade('buyBonk'))}
      />
      <MenuItem
        disabled={busy}
        size={60}
        testID="solana-mvp-sell"
        titleComponent={<MenuItem.Title text="Swap BONK → Solana USDC" />}
        labelComponent={<MenuItem.Label text="Up to 100,000 BONK; review before signing" />}
        onPress={() => run(() => trade('sell'))}
      />
      <MenuItem
        disabled={busy}
        size={60}
        testID="solana-mvp-sol-to-base"
        titleComponent={<MenuItem.Title text="Swap 0.01 SOL → Base USDC" />}
        labelComponent={<MenuItem.Label text="Review before signing" />}
        onPress={() => run(() => trade('solToBase'))}
      />
      <MenuItem
        disabled={busy}
        size={60}
        testID="solana-mvp-balances"
        titleComponent={<MenuItem.Title text="Refresh Solana balances" />}
        onPress={() =>
          run(async () => {
            const balances = await getMvpBalances();
            Alert.alert(
              'Solana balances',
              `${balances.address}\n\nSOL: ${formatUnits(balances.sol, 9)}\nBONK: ${formatUnits(balances.bonk, 5)}\nUSDC: ${formatUnits(balances.usdc, 6)}`
            );
          })
        }
      />
      <MenuItem
        disabled={busy || !attempt}
        size={60}
        testID="solana-mvp-status"
        titleComponent={<MenuItem.Title text="Check execution" />}
        labelComponent={<MenuItem.Label text={busy ? 'Working…' : (attempt?.status ?? 'No test execution')} />}
        onPress={() =>
          run(async () => {
            const result = await checkMvpExecution();
            const source = result.onchain?.source;
            const baseTransactions =
              source?.kind === 'evm' && source.chainId === ChainId.base
                ? `\n\nBase transactions:\n${source.hashes.map(hash => `https://basescan.org/tx/${hash}`).join('\n')}`
                : '';
            Alert.alert(
              'Execution status',
              `${result.status}\n\nExecution ID: ${result.executionId}${baseTransactions}\n\nSource: ${attempt?.account.sourceEvmAddress}\nSolana: ${attempt?.account.address}${result.error ? `\n\n${result.error.message ?? result.error.code}` : ''}`
            );
          })
        }
      />
    </Menu>
  );
}

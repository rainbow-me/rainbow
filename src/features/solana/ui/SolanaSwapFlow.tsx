import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView } from 'react-native';

import BigNumber from 'bignumber.js';
import { useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import { formatUnits } from 'viem';

import { GasButtonView, GasFeeRow, SelectedGasView } from '@/__swaps__/screens/Swap/components/GasButton';
import { SwapActionButton } from '@/__swaps__/screens/Swap/components/SwapActionButton';
import { SwapNavbarView } from '@/__swaps__/screens/Swap/components/SwapNavbar';
import { SwapWarningView } from '@/__swaps__/screens/Swap/components/SwapWarning';
import { BOTTOM_ACTION_BAR_HEIGHT, CUSTOM_KEYBOARD_HEIGHT } from '@/__swaps__/screens/Swap/constants';
import { AnimatedSpinner } from '@/components/animations/AnimatedSpinner';
import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { useHoldToActivate } from '@/components/buttons/useHoldToActivate';
import { Page } from '@/components/layout';
import { navbarHeight } from '@/components/navbar/Navbar';
import { Box, Separator, Text, useColorMode, useForegroundColor } from '@/design-system';
import { getUniqueId } from '@/entities/assetId';
import { convertAmountToNativeDisplay, convertAmountToNativeDisplayWorklet } from '@/features/currency/utils/nativeDisplay';
import { SOLANA_CHAIN_ID } from '@/features/solana/core/chainId';
import {
  SOLANA_SWAP_OUTPUTS,
  SWAP_ASSETS,
  swapInputAmount,
  swapMaxAmount,
  validateSwapReview,
  type SwapAsset,
} from '@/features/solana/core/swap';
import {
  checkMvpExecution,
  executeMvpTrade,
  getSwapBalances,
  prepareSwapTrade,
  useSolanaMvpExecutionStore,
} from '@/features/solana/data/mvpTrades';
import { useSolanaBalancesStore, useSolanaWalletBalances } from '@/features/solana/data/solanaBalancesStore';
import { type SolanaSwapSelection } from '@/features/solana/data/swapSelection';
import { type PreparedSwap } from '@/features/solana/data/swapTypes';
import { appearance, SolanaSwapAmountControls, SolanaSwapCard } from '@/features/solana/ui/SolanaSwapControls';
import { SolanaSwapTokenPicker } from '@/features/solana/ui/SolanaSwapTokenPicker';
import { getEnabledSolanaAccount } from '@/features/wallet/data/enableSolanaAccount';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { handleSignificantDecimals } from '@/helpers/utilities';
import * as i18n from '@/languages';
import { logger } from '@/logger';
import Navigation from '@/navigation/Navigation';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { LIGHT_SEPARATOR_COLOR, SEPARATOR_COLOR } from '@/styles/constants';
import safeAreaInsetValues from '@/utils/safeAreaInsetValues';
import { isTerminalStatus, type ExecutionStatus } from '@rainbow-me/solana-sdk';

const errorMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unable to complete the swap.';
  logger.warn('[Solana swap]', { error: message });
  return message;
};

const NO_QUOTE_LABEL = `􀇿 ${i18n.t(i18n.l.exchange.quote_errors.no_quote_available)}`;

export function SolanaSwapFlow({ selection, onBack }: { selection: SolanaSwapSelection; onBack: () => void }) {
  const [input, setInput] = useState(selection.inputAsset);
  const [output, setOutput] = useState(selection.outputAsset);
  const [amount, setAmount] = useState(selection.amount);
  const [picker, setPicker] = useState<'input' | 'output' | null>(selection.inputAsset ? null : 'input');
  const [balances, setBalances] = useState<Partial<Record<string, bigint>>>({});
  const [trade, setTrade] = useState<PreparedSwap | null>(null);
  const [lastOutput, setLastOutput] = useState('0');
  const [reviewing, setReviewing] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<ExecutionStatus | null>(null);
  const [now, setNow] = useState(Date.now());
  const [revision, setRevision] = useState(0);
  const attempt = useSolanaMvpExecutionStore(state => state.attempt);
  const ownedAttempt = attempt?.account.address === selection.address ? attempt : null;
  const pending = !!attempt && !isTerminalStatus(attempt.status);
  const mounted = useRef(true);
  const submittingRef = useRef(false);
  const generation = useRef(0);
  const [executionId, setExecutionId] = useState(ownedAttempt && !isTerminalStatus(ownedAttempt.status) ? ownedAttempt.executionId : null);
  const [sliderActive, setSliderActive] = useState(false);
  const title = useDerivedValue(() => 'Swap');
  const currency = userAssetsStoreManager(state => state.currency);
  const { data: solanaBalances } = useSolanaWalletBalances();
  const baseEth = useUserAssetsStore(state => state.getNativeAssetForChain(8453));
  const nativeValue = (id: SwapAsset | null, value: string) => {
    let price = new BigNumber(0);
    if (id?.chain === 'evm') price = new BigNumber(baseEth?.native.price?.amount ?? 0);
    else if (id) {
      const item = solanaBalances?.balances.get(
        getUniqueId(id.asset.kind === 'token' ? id.asset.address : 'So11111111111111111111111111111111111111111', SOLANA_CHAIN_ID)
      );
      if (item?.value && !item.rawUnits && new BigNumber(item.amount).gt(0)) price = new BigNumber(item.value).div(item.amount);
    }
    return convertAmountToNativeDisplay(price.times(value || '0').toFixed(), currency);
  };
  const { isDarkMode } = useColorMode();
  const buttonAsset = useDerivedValue(() => appearance(output));
  const blue = useForegroundColor('blue');
  const warningColor = useForegroundColor('labelTertiary');
  const warningTitle = useDerivedValue(() => NO_QUOTE_LABEL);
  const warningSubtitle = useDerivedValue(() => '');

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refreshBalances = useCallback(async () => {
    const account = getEnabledSolanaAccount();
    if (account.address !== selection.address) throw new Error('The selected account changed.');
    const result = await getSwapBalances(account, [SWAP_ASSETS['base-eth'], ...SOLANA_SWAP_OUTPUTS, ...(input ? [input] : []), output]);
    if (mounted.current) setBalances(current => ({ ...current, ...result }));
  }, [selection.address, input, output]);

  useEffect(() => {
    const refresh = () => {
      void refreshBalances().catch(e => {
        errorMessage(e);
      });
    };
    refresh();
    const timer = setInterval(refresh, 30000);
    return () => clearInterval(timer);
  }, [refreshBalances]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (reviewing || submitting || pending || executionId || picker || sliderActive) return;
    generation.current += 1;
    const request = generation.current;
    const requestState = generation;
    setTrade(null);
    setError(null);
    setPreparing(false);
    if (!input || input.id === output.id) return;
    try {
      swapInputAmount(amount, input);
    } catch {
      setLastOutput('0');
      return;
    }
    setPreparing(true);
    const timer = setTimeout(() => {
      void prepareSwapTrade(input, output, amount)
        .then(result => {
          if (mounted.current && request === generation.current) {
            setTrade(result);
            setLastOutput(formatUnits(result.prepared.review.output.amount, result.outputAsset.decimals));
          }
        })
        .catch(e => {
          if (mounted.current && request === generation.current) {
            setLastOutput('0');
            setError(errorMessage(e));
          }
        })
        .finally(() => {
          if (mounted.current && request === generation.current) setPreparing(false);
        });
    }, 500);
    return () => {
      clearTimeout(timer);
      requestState.current += 1;
    };
  }, [amount, input, output, reviewing, submitting, pending, executionId, revision, picker, sliderActive]);

  const checkStatus = useCallback(async () => {
    const result = await checkMvpExecution();
    if (!mounted.current || result.executionId !== executionId) return;
    setStatus(result);
    if (result.status === 'CONFIRMED') {
      await Promise.allSettled([
        refreshBalances(),
        useSolanaBalancesStore.getState().fetch(undefined, { staleTime: 0 }),
        useUserAssetsStore.getState().fetch(undefined, { staleTime: 0 }),
      ]);
    }
  }, [executionId, refreshBalances]);

  const terminal = !!status && isTerminalStatus(status.status);
  useEffect(() => {
    if ((!executionId && !pending) || submitting || terminal) return;
    let checking = false;
    const check = async () => {
      if (checking) return;
      checking = true;
      try {
        await checkStatus();
      } catch (e) {
        if (mounted.current) setError(errorMessage(e));
      } finally {
        // eslint-disable-next-line require-atomic-updates -- only the active poll can release this effect-local lock
        checking = false;
      }
    };
    void check();
    const timer = setInterval(() => void check(), 5000);
    return () => clearInterval(timer);
  }, [executionId, submitting, terminal, pending, checkStatus]);

  const invalidate = useCallback(() => {
    generation.current += 1;
    setTrade(null);
    setReviewing(false);
    setError(null);
    setStatus(null);
  }, []);
  const changeAmount = useCallback(
    (value: string) => {
      setSliderActive(false);
      invalidate();
      setAmount(value);
      setRevision(revision => revision + 1);
    },
    [invalidate]
  );
  const onSliderInteraction = useCallback(
    (active: boolean) => {
      setSliderActive(active);
      if (active) {
        invalidate();
        setPreparing(false);
      }
    },
    [invalidate]
  );
  const choose = (id: SwapAsset) => {
    invalidate();
    setLastOutput('0');
    if (picker === 'input') {
      setInput(id);
      setAmount('0');
      if (id.id === output.id) setOutput(id.id === 'sol' ? SWAP_ASSETS.usdc : SWAP_ASSETS.sol);
    } else if (id.chain !== 'evm') setOutput(id);
    setPicker(null);
  };
  const expired = !!trade && trade.prepared.review.expiresAt <= BigInt(Math.floor(now / 1000));
  const locked = submitting || pending || !!executionId;
  const inputIsZero = new BigNumber(amount).isZero();
  const inputBalance = input ? balances[input.id] : undefined;
  const outputBalance = balances[output.id];
  const insufficientFunds = !!input && inputBalance !== undefined && new BigNumber(amount).gt(swapMaxAmount(input, inputBalance));

  useEffect(() => {
    if ((!trade && !error) || preparing || locked || picker || sliderActive || (reviewing && !expired)) return;
    // Resume after failures too, like EVM; never refresh an unexpired review.
    const timer = setTimeout(
      () => {
        invalidate();
        setRevision(value => value + 1);
      },
      trade ? Math.min(12000, Math.max(0, Number(trade.prepared.review.expiresAt) * 1000 - Date.now())) : 12000
    );
    return () => clearTimeout(timer);
  }, [trade, error, preparing, locked, picker, sliderActive, reviewing, expired, invalidate]);

  useEffect(() => {
    if (status?.status === 'FAILED') Alert.alert(i18n.t(i18n.l.swap.error_executing_swap));
  }, [status?.executionId, status?.status]);

  const submit = async () => {
    if (!reviewing || !trade || expired || submittingRef.current || pending || executionId) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      validateSwapReview(trade);
      await executeMvpTrade(trade);
    } catch (e) {
      if (mounted.current) Alert.alert(i18n.t(i18n.l.swap.error_executing_swap), errorMessage(e));
    } finally {
      if (mounted.current) {
        const saved = useSolanaMvpExecutionStore.getState().attempt;
        if (saved?.executionId === trade.prepared.executionId) setExecutionId(saved.executionId);
        else {
          setTrade(null);
          setReviewing(false);
          setRevision(value => value + 1);
        }
        setSubmitting(false);
      }
      // eslint-disable-next-line require-atomic-updates -- released only by the operation holding the submission lock
      submittingRef.current = false;
    }
  };
  const hold = useHoldToActivate({ duration: 400, onActivate: () => void submit(), disabled: !reviewing || !trade || expired || locked });
  const startReview = () => {
    if (!trade) return;
    try {
      validateSwapReview(trade);
      setReviewing(true);
    } catch (e) {
      setError(errorMessage(e));
    }
  };
  const actionIcon = useDerivedValue<string>(() =>
    executionId || submitting || preparing || expired || inputIsZero || insufficientFunds ? '' : reviewing ? '􀎽' : '􀕹'
  );
  const actionIconStyle = useAnimatedStyle(() => ({ display: actionIcon.value ? 'flex' : 'none' }));
  const actionDisabled = useDerivedValue<boolean | undefined>(() =>
    executionId ? !terminal : reviewing ? !trade || expired || locked : preparing || locked || !trade || expired || !!error
  );
  const outputAmount = lastOutput;
  const solBalance = solanaBalances?.balances.get(getUniqueId('So11111111111111111111111111111111111111111', SOLANA_CHAIN_ID));
  const solPrice =
    solanaBalances?.address === selection.address &&
    solanaBalances.currency.toUpperCase() === currency &&
    solBalance?.value &&
    !solBalance.rawUnits &&
    new BigNumber(solBalance.amount).gt(0)
      ? new BigNumber(solBalance.value).div(solBalance.amount)
      : new BigNumber(0);
  const isNetworkFeeSponsored = !!trade && !expired && trade.prepared.review.gasless && trade.prepared.review.sponsorship === 'full';
  const networkFee = !trade
    ? '--'
    : trade.networkFeeLamports === 0n
      ? convertAmountToNativeDisplayWorklet('0', currency)
      : solPrice.gt(0)
        ? convertAmountToNativeDisplayWorklet(solPrice.times(formatUnits(trade.networkFeeLamports, 9)).toFixed(), currency, true)
        : `${formatUnits(trade.networkFeeLamports, 9)} SOL`;

  return (
    <Box as={Page} height="full" testID="solana-swap-flow">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          alignItems: 'center',
          paddingTop: safeAreaInsetValues.top + (navbarHeight - 12) + 29,
          paddingBottom:
            !reviewing && !locked && input && !picker
              ? CUSTOM_KEYBOARD_HEIGHT + BOTTOM_ACTION_BAR_HEIGHT + 100
              : BOTTOM_ACTION_BAR_HEIGHT + 24,
        }}
      >
        {picker ? (
          <Box width="full">
            <Box paddingHorizontal="20px" paddingBottom="16px">
              <Text color="label" size="20pt" weight="bold">
                {picker === 'input' ? 'Token to Swap' : 'Token to Get'}
              </Text>
            </Box>
            <SolanaSwapTokenPicker
              output={picker === 'output'}
              selected={picker === 'input' ? input : output}
              balances={balances}
              onSelect={choose}
              onCancel={() => setPicker(null)}
            />
            <Box padding="20px" gap={20}>
              <ButtonPressAnimation onPress={onBack}>
                <Text color="blue" size="17pt" weight="semibold">
                  Other networks
                </Text>
              </ButtonPressAnimation>
              <ButtonPressAnimation onPress={() => setPicker(null)}>
                <Text color="blue" size="17pt" weight="semibold">
                  Cancel
                </Text>
              </ButtonPressAnimation>
            </Box>
          </Box>
        ) : (
          <>
            <SolanaSwapCard
              token={input}
              nativeValue={nativeValue(input, amount)}
              amount={amount}
              balance={
                input && inputBalance !== undefined
                  ? `${handleSignificantDecimals(formatUnits(inputBalance, input.decimals), input.decimals)} ${input.symbol}`
                  : 'Loading balance…'
              }
              onSelect={() => {
                if (!locked) {
                  invalidate();
                  setPicker('input');
                }
              }}
              onMax={
                input && inputBalance !== undefined && !locked ? () => changeAmount(swapMaxAmount(input, inputBalance ?? 0n)) : undefined
              }
            />
            <Box height={{ custom: 12 }} width={{ custom: 28 }} style={{ zIndex: 1 }} justifyContent="center" alignItems="center">
              <Box
                background="fillSecondary"
                borderRadius={15}
                height={{ custom: 30 }}
                width={{ custom: 30 }}
                alignItems="center"
                justifyContent="center"
              >
                <Text color="labelTertiary" size="17pt" weight="heavy">
                  􀆈
                </Text>
              </Box>
              <Box position="absolute" pointerEvents="none">
                <AnimatedSpinner
                  color={blue}
                  isLoading={preparing}
                  requireSrc={require('@/assets/swapSpinner.png')}
                  scaleInFrom={1}
                  size={32}
                />
              </Box>
            </Box>
            <SolanaSwapCard
              token={output}
              bottomInput
              nativeValue={nativeValue(output, outputAmount)}
              amount={outputAmount}
              balance={
                outputBalance === undefined
                  ? 'No Balance'
                  : `${handleSignificantDecimals(formatUnits(outputBalance, output.decimals), output.decimals)} ${output.symbol}`
              }
              onSelect={() => {
                if (!locked) {
                  invalidate();
                  setPicker('output');
                }
              }}
            />
            <Box padding="20px" width="full" gap={16}>
              {error && !insufficientFunds && !preparing && !executionId && (
                <Box alignItems="center">
                  <SwapWarningView
                    title={warningTitle}
                    subtitle={warningSubtitle}
                    titleStyle={{ color: warningColor, textAlign: 'center' }}
                    subtitleStyle={{ opacity: 0 }}
                    style={{ alignItems: 'center' }}
                  />
                </Box>
              )}
              {reviewing && trade && (
                <Box gap={12} testID="solana-swap-review">
                  <Text color="label" size="17pt" weight="bold">
                    Review swap
                  </Text>
                  <Text color="labelSecondary" size="15pt" weight="medium">
                    Spend: {formatUnits(trade.input, trade.inputAsset.decimals)} {trade.inputAsset.symbol} on {trade.inputAsset.network}
                  </Text>
                  <Text color="labelSecondary" size="15pt" weight="medium">
                    Receive: {formatUnits(trade.prepared.review.output.amount, output.decimals)} {output.symbol}
                  </Text>
                  <Text color="labelSecondary" size="15pt" weight="medium">
                    Minimum received: {formatUnits(trade.prepared.review.output.minimumAmount ?? 0n, output.decimals)} {output.symbol}
                  </Text>
                  <Text color="labelSecondary" size="13pt" weight="medium">
                    Recipient: {trade.account.address}
                  </Text>
                  <Box flexDirection="row" justifyContent="space-between" alignItems="center">
                    <Text color="labelTertiary" size="15pt" weight="semibold">
                      {i18n.t(i18n.l.gas.network_fee)}
                    </Text>
                    <Text color="label" size="15pt" weight="bold" tabularNumbers testID="solana-swap-network-fee">
                      {networkFee}
                    </Text>
                  </Box>
                  <Text color="labelSecondary" size="13pt" weight="medium">
                    {input?.chain === 'evm'
                      ? 'Gas and provider fees sponsored. This route may authorize Rainbow EVM delegation.'
                      : 'Provider fees are sponsored.'}
                  </Text>
                </Box>
              )}
              {reviewing && !locked && (
                <ButtonPressAnimation
                  onPress={() => {
                    invalidate();
                    setRevision(value => value + 1);
                  }}
                >
                  <Text align="center" color="blue" size="15pt" weight="semibold">
                    Edit amount
                  </Text>
                </ButtonPressAnimation>
              )}
            </Box>
          </>
        )}
      </ScrollView>
      {!picker && !reviewing && !locked && input && (
        <Box position="absolute" bottom={{ custom: BOTTOM_ACTION_BAR_HEIGHT + 16 }} width="full">
          <SolanaSwapAmountControls
            input={input}
            amount={amount}
            balance={inputBalance ?? 0n}
            fetching={preparing}
            onChange={changeAmount}
            onInteraction={onSliderInteraction}
          />
        </Box>
      )}
      {!picker && (
        <Box position="absolute" bottom={{ custom: Math.max(safeAreaInsetValues.bottom, 20) + 12 }} paddingHorizontal="20px" width="full">
          <Box flexDirection="row" alignItems="center" height={{ custom: 48 }}>
            {!reviewing && !executionId && (
              <Box flexDirection="row" alignItems="center" gap={12} paddingRight="12px" testID="solana-swap-gas">
                <GasButtonView
                  selectedGas={
                    isNetworkFeeSponsored ? (
                      <SelectedGasView sponsored buyTokenColor={buttonAsset.value.highContrastColor} />
                    ) : (
                      <Text color="label" size="15pt" weight="heavy">
                        {i18n.t(i18n.l.swap.gas.network_fee)}
                      </Text>
                    )
                  }
                  estimatedFee={
                    <GasFeeRow sponsored={isNetworkFeeSponsored}>
                      <Text
                        color={isNetworkFeeSponsored ? 'labelQuinary' : 'labelTertiary'}
                        size="15pt"
                        weight="bold"
                        tabularNumbers
                        style={{ letterSpacing: 0.3, textDecorationLine: isNetworkFeeSponsored ? 'line-through' : undefined }}
                      >
                        {/* shortcut: the SDK exposes provider totals, not pre-sponsorship network gas; show a placeholder until it does. */}
                        {isNetworkFeeSponsored ? '--' : networkFee}
                      </Text>
                    </GasFeeRow>
                  }
                />
                <Box height={{ custom: 32 }}>
                  <Separator color={{ custom: isDarkMode ? SEPARATOR_COLOR : LIGHT_SEPARATOR_COLOR }} direction="vertical" thickness={1} />
                </Box>
              </Box>
            )}
            <Box style={{ flex: 1 }}>
              <SwapActionButton
                asset={buttonAsset}
                icon={actionIcon}
                iconStyle={actionIconStyle}
                disabled={actionDisabled}
                holdProgress={reviewing && !executionId ? hold.holdProgress : undefined}
                longPressDuration={hold.gestureHandlerProps.longPressDuration}
                onPressStartWorklet={reviewing && !executionId ? hold.gestureHandlerProps.onPressStartWorklet : undefined}
                onLongPressWorklet={reviewing && !executionId ? hold.gestureHandlerProps.onLongPressWorklet : undefined}
                onLongPressEndWorklet={reviewing && !executionId ? hold.gestureHandlerProps.onLongPressEndWorklet : undefined}
                onLongPressJS={reviewing && !executionId ? hold.gestureHandlerProps.onLongPressJS : undefined}
                onPressJS={executionId ? () => Navigation.goBack() : reviewing ? undefined : startReview}
                testID={executionId ? 'solana-swap-done' : reviewing ? 'solana-swap-confirm' : 'solana-swap-review-button'}
                label={
                  executionId
                    ? terminal
                      ? i18n.t(i18n.l.button.done)
                      : i18n.t(i18n.l.swap.actions.swapping)
                    : reviewing
                      ? submitting
                        ? i18n.t(i18n.l.swap.actions.swapping)
                        : i18n.t(i18n.l.swap.actions.hold_to_swap)
                      : inputIsZero
                        ? i18n.t(i18n.l.swap.actions.enter_amount)
                        : insufficientFunds
                          ? i18n.t(i18n.l.swap.actions.insufficient_funds)
                          : preparing || expired
                            ? i18n.t(i18n.l.swap.actions.fetching_prices)
                            : i18n.t(i18n.l.swap.actions.review)
                }
                scaleTo={0.9}
              />
            </Box>
          </Box>
        </Box>
      )}
      <SwapNavbarView title={title} />
    </Box>
  );
}

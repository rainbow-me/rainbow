import { useCallback } from 'react';
import { Alert } from 'react-native';
import { SharedValue } from 'react-native-reanimated';
import { logger, RainbowError } from '@/logger';
import { Navigation } from '@/navigation';
import { ChainId } from '@/state/backendNetworks/types';
import { StoreActions } from '@/state/internal/utils/createStoreActions';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { sanitizeAmount } from '@/worklets/strings';
import {
  BalanceQueryStore,
  WithdrawalChainInfo,
  WithdrawalConfig,
  WithdrawalContextType,
  WithdrawalExecutorParams,
  WithdrawalQuoteStatus,
  WithdrawalStoreType,
  WithdrawalSwapQuote,
} from '../types';
import { executeRefreshSchedule } from '../utils/scheduleRefreshes';
import { getWithdrawalSwapRequirement, resolveTokenAddressForChain } from '../utils/withdrawalSwap';

// ============ Types ========================================================== //

type WithdrawalHandlerParams<T extends BalanceQueryStore> = {
  balance: SharedValue<string>;
  config: WithdrawalConfig<T>;
  context: WithdrawalContextType<T>;
  displayedAmount: SharedValue<string>;
  isAtMax: SharedValue<boolean>;
  withdrawalActions: StoreActions<WithdrawalStoreType>;
};

// ============ Handler Hook =================================================== //

export function useWithdrawalHandler<T extends BalanceQueryStore>({
  balance,
  config,
  context,
  displayedAmount,
  isAtMax,
  withdrawalActions,
}: WithdrawalHandlerParams<T>): () => Promise<void> {
  return useCallback(async () => {
    // 1. Compute and validate amount
    const rawAmount = isAtMax.value ? balance.value : displayedAmount.value;
    const amount = sanitizeAmount(rawAmount);

    if (!amount || amount === '0') return;

    const availableBalance = config.balanceStore.getState().getBalance();
    if (Number(amount) > Number(availableBalance)) return;

    // 2. Get recipient address
    const recipient = useWalletsStore.getState().accountAddress;
    if (!recipient) {
      Alert.alert('Error', 'No wallet connected');
      return;
    }

    // 3. Build executor params
    const params: WithdrawalExecutorParams = { amount, recipient };

    if (context.useQuoteStore) {
      const chainInfo = buildChainInfo(context);
      if (chainInfo) {
        params.chainInfo = chainInfo;
      }

      const route = config.route;
      if (!route) {
        logger.error(new RainbowError('[useWithdrawalHandler]: route context missing config', { id: config.id }));
        Alert.alert('Error', 'Routing configuration missing');
        return;
      }

      const targetChainId = context.useWithdrawalStore.getState().selectedChainId;
      const buyTokenAddress = resolveBuyTokenAddressFromContext(context, targetChainId);
      const requirement = getWithdrawalSwapRequirement({
        buyTokenAddress,
        route,
        targetChainId,
      });

      if (requirement.requiresQuote) {
        let quoteData = context.useQuoteStore.getState().getData();

        if (quoteData === WithdrawalQuoteStatus.InsufficientBalance) {
          Alert.alert('Error', 'Insufficient balance for withdrawal');
          return;
        }

        if (quoteData === null) {
          withdrawalActions.setIsSubmitting(true);
          quoteData = await context.useQuoteStore.getState().fetch();
        }

        if (!isValidWithdrawalSwapQuote(quoteData)) {
          withdrawalActions.setIsSubmitting(false);
          Alert.alert('Error', 'No valid quote available for withdrawal');
          return;
        }

        params.quote = quoteData;
      }
    }

    // 4. Execute with framework coordination
    withdrawalActions.setIsSubmitting(true);

    try {
      // Run prerequisite if configured
      if (config.prerequisite) await config.prerequisite();

      // Execute withdrawal
      const result = await config.executor(params);

      if (!result.success) {
        if (result.error !== 'handled') {
          Alert.alert('Error Withdrawing', result.error);
        }
        return;
      }

      Navigation.goBack();

      // Schedule refreshes (waits for confirmation if provided)
      const refreshConfig = config.refresh;
      if (refreshConfig) {
        if (result.waitForConfirmation) {
          result
            .waitForConfirmation()
            .then(() => executeRefreshSchedule(refreshConfig, config.id))
            .catch(error => {
              logger.warn(`[useWithdrawalHandler]: confirmation failed for ${config.id}`, { error });
            });
        } else {
          executeRefreshSchedule(refreshConfig, config.id);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error during withdrawal';
      logger.error(new RainbowError(`[useWithdrawalHandler]: ${config.id} failed`), { error });
      Alert.alert('Error Withdrawing', message);
    } finally {
      withdrawalActions.setIsSubmitting(false);
    }
  }, [balance, config, context, displayedAmount, isAtMax, withdrawalActions]);
}

// ============ Helper Functions =============================================== //

function buildChainInfo(context: WithdrawalContextType<BalanceQueryStore>): WithdrawalChainInfo | undefined {
  if (!context.useQuoteStore) return undefined;

  const tokenData = context.useTokenStore.getState().getData();
  const chainId = context.useWithdrawalStore.getState().selectedChainId;

  if (!chainId || !tokenData) return undefined;

  const tokenAddress = tokenData.networks[String(chainId)]?.address;
  if (!tokenAddress) return undefined;

  return { chainId, tokenAddress };
}

function resolveBuyTokenAddressFromContext(context: WithdrawalContextType<BalanceQueryStore>, chainId: ChainId | undefined): string | null {
  if (!context.useQuoteStore) return null;
  return resolveTokenAddressForChain(context.useTokenStore.getState().getData(), chainId);
}

function isValidWithdrawalSwapQuote(
  data: WithdrawalSwapQuote | WithdrawalQuoteStatus.InsufficientBalance | null | undefined
): data is WithdrawalSwapQuote {
  return data !== null && data !== undefined && typeof data === 'object' && 'to' in data && 'data' in data;
}

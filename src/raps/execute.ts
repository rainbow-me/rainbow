/* eslint-disable no-async-promise-executor */
/* eslint-disable no-promise-executor-return */
import { Signer } from '@ethersproject/abstract-signer';
import { ChainId } from '@/state/backendNetworks/types';
import { RainbowError, logger } from '@/logger';

import { claim, swap, unlock } from './actions';
import { crosschainSwap } from './actions/crosschainSwap';
import { claimBridge } from './actions/claimBridge';
import {
  ActionProps,
  Rap,
  RapAction,
  RapActionResponse,
  RapActionResult,
  RapActionTypes,
  RapSwapActionParameters,
  RapTypes,
} from './references';
import { createUnlockAndCrosschainSwapRap } from './unlockAndCrosschainSwap';
import { createClaimAndBridgeRap } from './claimAndBridge';
import { createUnlockAndSwapRap } from './unlockAndSwap';
import { LegacyTransactionGasParamAmounts, TransactionGasParamAmounts } from '@/entities';
import { Screens, TimeToSignOperation, performanceTracking } from '@/state/performance/performance';
import { swapsStore } from '@/state/swaps/swapsStore';
import { createClaimClaimableRap } from './claimClaimable';
import { claimClaimable } from './actions/claimClaimable';
import { IS_TEST } from '@/env';

const short = (v?: string | null) => {
  if (!v || typeof v !== 'string') return 'n/a';
  return v.length > 12 ? `${v.slice(0, 8)}…${v.slice(-6)}` : v;
};
const sameAddr = (a?: string, b?: string) => !!a && !!b && a.toLowerCase() === b.toLowerCase();
const gasSummary = (g?: any) => {
  if (!g) return 'n/a';
  const legacy = g?.gasPrice;
  const eip = g?.maxFeePerGas || g?.maxPriorityFeePerGas;
  if (eip) return `1559 mf=${g.maxFeePerGas ?? 'n/a'} mp=${g.maxPriorityFeePerGas ?? 'n/a'}`;
  if (legacy) return `legacy gp=${legacy}`;
  return 'n/a';
};
const log = (msg: string, extra?: Record<string, unknown>) => {
  try {
    if (extra) {
      console.log(`[RAP] ${msg} ${JSON.stringify(extra)}`);
    } else {
      console.log(`[RAP] ${msg}`);
    }
  } catch {
    console.log(`[RAP] ${msg}`);
  }
};

const PERF_TRACKING_EXEMPTIONS: RapTypes[] = ['claimBridge', 'claimClaimable'];

export function createSwapRapByType<T extends RapTypes>(
  type: T,
  swapParameters: RapSwapActionParameters<T>
): Promise<{ actions: RapAction<RapActionTypes>[] }> {
  log('createSwapRapByType:start', { type, chainId: swapParameters?.chainId });
  switch (type) {
    case 'claimBridge':
      return createClaimAndBridgeRap(swapParameters as RapSwapActionParameters<'claimBridge'>);
    case 'crosschainSwap':
      return createUnlockAndCrosschainSwapRap(swapParameters as RapSwapActionParameters<'crosschainSwap'>);
    case 'swap':
      return createUnlockAndSwapRap(swapParameters as RapSwapActionParameters<'swap'>);
    case 'claimClaimable':
      return createClaimClaimableRap(swapParameters as RapSwapActionParameters<'claimClaimable'>);
    default:
      return Promise.resolve({ actions: [] });
  }
}

function typeAction<T extends RapActionTypes>(type: T, props: ActionProps<T>) {
  switch (type) {
    case 'claim':
      return () => claim(props as ActionProps<'claim'>);
    case 'unlock':
      return () => unlock(props as ActionProps<'unlock'>);
    case 'swap':
      return () => swap(props as ActionProps<'swap'>);
    case 'claimBridge':
      return () => claimBridge(props as ActionProps<'claimBridge'>);
    case 'crosschainSwap':
      return () => crosschainSwap(props as ActionProps<'crosschainSwap'>);
    case 'claimClaimable':
      return () => claimClaimable(props as ActionProps<'claimClaimable'>);
    default:
      // eslint-disable-next-line react/display-name
      return () => null;
  }
}

export async function executeAction<T extends RapActionTypes>({
  action,
  wallet,
  rap,
  index,
  baseNonce,
  rapName,
  gasParams,
  gasFeeParamsBySpeed,
}: {
  action: RapAction<T>;
  wallet: Signer;
  rap: Rap;
  index: number;
  baseNonce?: number;
  rapName: string;
  gasParams: TransactionGasParamAmounts | LegacyTransactionGasParamAmounts;
  gasFeeParamsBySpeed: RapSwapActionParameters<Exclude<T, 'unlock' | 'claim'>>['gasFeeParamsBySpeed'];
}): Promise<RapActionResponse> {
  const { type, parameters } = action;

  if (type === 'unlock') {
    const p = parameters as any;
    log('executeAction:unlock:start', {
      rap: rapName,
      index,
      baseNonce,
      chainId: p?.chainId,
      token: short(p?.assetToUnlock?.address),
      spender: short(p?.contractAddress),
      amount: p?.amount,
      gas: gasSummary(gasParams),
    });
  } else if (type === 'swap') {
    const p = parameters as any;
    log('executeAction:swap:start', {
      rap: rapName,
      index,
      baseNonce,
      chainId: p?.chainId,
      requiresApprove: !!p?.requiresApprove,
      sellAmount: p?.sellAmount,
      quoteSellToken: short(p?.quote?.sellTokenAddress),
      gas: gasSummary(gasParams),
    });
  } else {
    log('executeAction:other:start', { rap: rapName, type, index, baseNonce });
  }

  try {
    const actionProps = {
      wallet,
      currentRap: rap,
      index,
      parameters,
      baseNonce,
      gasParams,
      gasFeeParamsBySpeed,
    };
    const { nonce, hash } = (await typeAction<T>(type, actionProps)()) as RapActionResult;

    log('executeAction:success', { type, index, hash: short(hash ?? null), returnedBaseNonce: nonce });

    return { baseNonce: nonce, errorMessage: null, hash };
  } catch (error) {
    const message = (error as Error)?.message ?? String(error);
    logger.error(new RainbowError(`[raps/execute]: ${rapName} - error execute action`), { message });
    log('executeAction:error', { type, index, msg: message });

    return { baseNonce: null, errorMessage: error?.toString() ?? null };
  }
}

function getRapFullName<T extends RapActionTypes>(actions: RapAction<T>[]) {
  const actionTypes = actions.map(action => action.type);
  return actionTypes.join(' + ');
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

function getNodeAckDelay(chainId: ChainId): number {
  // When testing, give it some time to let approvals through
  if (IS_TEST) return 5000;

  switch (chainId) {
    case ChainId.mainnet:
      return 0;
    case ChainId.base:
      return 2500;
    default:
      return 500;
  }
}

export const walletExecuteRap = async <T extends RapTypes>(
  wallet: Signer,
  type: T,
  parameters: RapSwapActionParameters<T>
): Promise<{ nonce: number | undefined; errorMessage: string | null }> => {
  const pAny = parameters as any;
  const uiSell = pAny?.assetToSell?.address as string | undefined;
  const quoteSell = pAny?.quote?.sellTokenAddress as string | undefined;
  const mismatch = !!(quoteSell && uiSell && !sameAddr(quoteSell, uiSell));

  log('walletExecuteRap:start', {
    type,
    chainId: parameters?.chainId,
    uiSell: short(uiSell),
    quoteSell: short(quoteSell),
    sellAddrMismatch: mismatch,
    allowanceNeeded: !!pAny?.quote?.allowanceNeeded,
  });

  // NOTE: We don't care to track claimBridge raps
  const rap = PERF_TRACKING_EXEMPTIONS.includes(type)
    ? await createSwapRapByType(type, parameters)
    : await performanceTracking.getState().executeFn({
        fn: createSwapRapByType,
        screen: Screens.SWAPS,
        operation: TimeToSignOperation.CreateRap,
        metadata: {
          degenMode: swapsStore.getState().degenMode,
        },
      })(type, parameters);

  const { actions } = rap;
  const rapName = getRapFullName(rap.actions);

  log('walletExecuteRap:actions', {
    count: actions.length,
    order: actions.map(a => a.type),
  });

  let nonce = parameters?.nonce;
  let errorMessage = null;

  if (actions.length) {
    const firstAction = actions[0];

    if (firstAction.type === 'unlock') {
      const p = firstAction.parameters as any;
      log('walletExecuteRap:firstAction:unlock', {
        token: short(p?.assetToUnlock?.address),
        spender: short(p?.contractAddress),
        chainId: p?.chainId,
        amount: p?.amount,
      });
    }

    const actionParams = {
      action: firstAction,
      wallet,
      rap,
      index: 0,
      baseNonce: nonce,
      rapName,
      gasParams: parameters?.gasParams,
      gasFeeParamsBySpeed: parameters?.gasFeeParamsBySpeed,
    };

    const { baseNonce, errorMessage: error, hash: firstHash } = await executeAction(actionParams);

    const shouldDelayForNodeAck = parameters.chainId !== ChainId.mainnet || IS_TEST;
    log('walletExecuteRap:postFirstAction', {
      firstType: firstAction.type,
      firstHash: short(firstHash ?? null),
      baseNonce,
      shouldDelayForNodeAck,
      nodeAckDelayMs: shouldDelayForNodeAck ? getNodeAckDelay(parameters.chainId) : 0,
    });

    if (typeof baseNonce === 'number') {
      let latestHash = firstHash;

      for (let index = 1; index < actions.length; index++) {
        if (latestHash && shouldDelayForNodeAck) {
          log('walletExecuteRap:nodeAckDelay', { index, ms: getNodeAckDelay(parameters.chainId) });
          await delay(getNodeAckDelay(parameters.chainId));
        }

        const action = actions[index];
        if (action.type === 'unlock') {
          const p = action.parameters as any;
          log('walletExecuteRap:nextAction:unlock', {
            index,
            token: short(p?.assetToUnlock?.address),
            spender: short(p?.contractAddress),
            chainId: p?.chainId,
            amount: p?.amount,
          });
        } else if (action.type === 'swap') {
          const p = action.parameters as any;
          log('walletExecuteRap:nextAction:swap', {
            index,
            requiresApprove: !!p?.requiresApprove,
            sellAmount: p?.sellAmount,
            quoteSellToken: short(p?.quote?.sellTokenAddress),
          });
        } else {
          log('walletExecuteRap:nextAction', { index, type: action.type });
        }

        const actionParams = {
          action,
          wallet,
          rap,
          index,
          baseNonce,
          rapName,
          gasParams: parameters?.gasParams,
          gasFeeParamsBySpeed: parameters?.gasFeeParamsBySpeed,
        };
        const { hash: nextHash, errorMessage: nextErr } = await executeAction(actionParams);

        if (!errorMessage && nextErr) {
          errorMessage = nextErr;
          log('walletExecuteRap:actionErrorCaptured', { index, type: action.type, msg: nextErr });
        }
        latestHash = nextHash;
      }

      nonce = baseNonce + actions.length - 1;
      log('walletExecuteRap:complete', { finalNonce: nonce, errorMessage });
    } else {
      errorMessage = error;
      log('walletExecuteRap:abortAfterFirst', { errorMessage: error });
    }
  } else {
    log('walletExecuteRap:noActions');
  }

  return { nonce, errorMessage };
};

/* eslint-disable no-await-in-loop */
/* eslint-disable no-async-promise-executor */
/* eslint-disable no-promise-executor-return */
import { Signer } from '@ethersproject/abstract-signer';

import { RainbowError, logger } from '@/logger';

import { ActionProps, RapResponse, Rap, RapAction, RapActionResponse, RapActionTypes, RapParameters } from './references';
import { createClaimTransactionClaimableRap } from './claimTransactionClaimableRap';
import { claimTransactionClaimable } from './actions/claimTransactionClaimableAction';
import { delay } from '@/utils/delay';
import { crosschainSwap } from './actions/crosschainSwapAction';
import { unlock } from './actions/unlockAction';

// get the rap by type
export function createRap(parameters: RapParameters): Promise<{ actions: RapAction<RapActionTypes>[] }> {
  switch (parameters.type) {
    case 'claimTransactionClaimableRap':
      return createClaimTransactionClaimableRap(parameters);
    default:
      return Promise.resolve({ actions: [] });
  }
}

// get the action executable by type
function getActionExecutableByType<T extends RapActionTypes>(type: T, props: ActionProps<T>) {
  switch (type) {
    case 'claimTransactionClaimableAction':
      return () => claimTransactionClaimable(props);
    case 'crosschainSwapAction':
      return () => crosschainSwap(props);
    case 'unlockAction':
      return () => unlock(props);
    default:
      throw new RainbowError(`[rapsV2/execute]: T - unknown action type ${type}`);
  }
}

// executes a single action in the rap
// if the action executes a tx on-chain, it will return the nonce it used
// if an error occurs, we return the error message
export async function executeAction<T extends RapActionTypes>({
  action,
  wallet,
  rap,
  nonceToUse,
  rapName,
}: {
  action: RapAction<T>;
  wallet: Signer;
  rap: Rap;
  nonceToUse: number | undefined;
  rapName: string;
}): Promise<RapActionResponse> {
  const { type, parameters, shouldExpedite } = action;
  try {
    const actionProps = {
      wallet,
      currentRap: rap,
      parameters,
      nonceToUse,
      shouldExpedite,
    };
    const { nonce, hash } = await getActionExecutableByType<T>(type, actionProps)();
    return { nonce, errorMessage: null, hash };
  } catch (error) {
    logger.error(new RainbowError(`[rapsV2/execute]: ${rapName} - error execute action`), {
      message: (error as Error)?.message,
    });
    return { nonce: null, errorMessage: String(error), hash: null };
  }
}

function getRapFullName<T extends RapActionTypes>(actions: RapAction<T>[]) {
  const actionTypes = actions.map(action => action.type);
  return actionTypes.join(' + ');
}

const waitForNodeAck = async (hash: string, provider: Signer['provider']): Promise<void> => {
  return new Promise(async resolve => {
    const tx = await provider?.getTransaction(hash);
    // This means the node is aware of the tx, we're good to go
    if ((tx && tx.blockNumber === null) || (tx && tx?.blockNumber && tx?.blockNumber > 0)) {
      resolve();
    } else {
      // Wait for 1 second and try again
      await delay(1000);
      return waitForNodeAck(hash, provider);
    }
  });
};

// goes through each action in the rap and executes it
// if an action executes a tx on-chain, increment the nonceToUse for the next tx
// if an action fails, it will return the error message
const executeRap = async (wallet: Signer, rap: Rap): Promise<RapResponse> => {
  const { actions } = rap;
  const rapName = getRapFullName(rap.actions);
  let nonceToUse: number | undefined;

  while (actions.length) {
    const action = actions.shift();

    if (!action) break;

    const { nonce, errorMessage, hash } = await executeAction({
      action,
      wallet,
      rap,
      nonceToUse,
      rapName,
    });

    if (errorMessage) return { errorMessage };

    if (typeof nonce === 'number') {
      actions.length >= 1 && hash && (await waitForNodeAck(hash, wallet.provider));
      nonceToUse = nonce + 1;
    }
  }

  return { errorMessage: null };
};

export async function walletExecuteRap(wallet: Signer, rapParameters: RapParameters): Promise<RapResponse> {
  const rap = await createRap(rapParameters);
  return executeRap(wallet, rap);
}

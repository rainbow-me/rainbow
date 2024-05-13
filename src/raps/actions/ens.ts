import { Signer } from '@ethersproject/abstract-signer';
import { captureException } from '@sentry/react-native';
import { IS_TESTING } from 'react-native-dotenv';
import { ENSActionParameters, ENSRap, ENSRapActionType, RapENSAction, RapENSActionParameters } from '@/raps/common';
import { analytics } from '@/analytics';
import { ENSRegistrationRecords, NewTransaction, TransactionGasParamAmounts } from '@/entities';
import { estimateENSTransactionGasLimit, formatRecordsForTransaction } from '@/handlers/ens';
import { toHex } from '@/handlers/web3';
import { NetworkTypes } from '@/helpers';
import { ENSRegistrationTransactionType, getENSExecutionDetails, REGISTRATION_MODES } from '@/helpers/ens';
import * as i18n from '@/languages';
import { saveCommitRegistrationParameters, updateTransactionRegistrationParameters } from '@/redux/ensRegistration';
import store from '@/redux/store';
import logger from '@/utils/logger';
import { parseGasParamAmounts } from '@/parsers';
import { addNewTransaction } from '@/state/pendingTransactions';
import { Network } from '@/networks/types';
import {
  createRegisterENSRap,
  createRenewENSRap,
  createCommitENSRap,
  createSetNameENSRap,
  createSetRecordsENSRap,
  createTransferENSRap,
} from '../registerENS';
import { Logger } from '@ethersproject/logger';

export interface ENSRapActionResponse {
  baseNonce?: number | null;
  errorMessage: string | null;
}

const executeCommit = async (
  name?: string,
  duration?: number,
  ownerAddress?: string,
  rentPrice?: string,
  salt?: string,
  gasLimit?: string | null,
  maxFeePerGas?: string,
  maxPriorityFeePerGas?: string,
  wallet?: Signer,
  nonce: number | null = null
) => {
  const { contract, methodArguments, value } = await getENSExecutionDetails({
    duration,
    name,
    ownerAddress,
    rentPrice,
    salt,
    type: ENSRegistrationTransactionType.COMMIT,
    wallet,
  });

  return (
    methodArguments &&
    contract?.commit(...methodArguments, {
      gasLimit: gasLimit ? toHex(gasLimit) : undefined,
      maxFeePerGas: maxFeePerGas ? toHex(maxFeePerGas) : undefined,
      maxPriorityFeePerGas: maxPriorityFeePerGas ? toHex(maxPriorityFeePerGas) : undefined,
      nonce: nonce ? toHex(nonce) : undefined,
      ...(value ? { value } : {}),
    })
  );
};

const executeRegisterWithConfig = async (
  name?: string,
  duration?: number,
  ownerAddress?: string,
  rentPrice?: string,
  salt?: string,
  gasLimit?: string | null,
  maxFeePerGas?: string,
  maxPriorityFeePerGas?: string,
  wallet?: Signer,
  nonce: number | null = null
) => {
  const { contract, methodArguments, value } = await getENSExecutionDetails({
    duration,
    name,
    ownerAddress,
    rentPrice,
    salt,
    type: ENSRegistrationTransactionType.REGISTER_WITH_CONFIG,
    wallet,
  });
  return (
    methodArguments &&
    contract?.registerWithConfig(...methodArguments, {
      gasLimit: gasLimit ? toHex(gasLimit) : undefined,
      maxFeePerGas: maxFeePerGas ? toHex(maxFeePerGas) : undefined,
      maxPriorityFeePerGas: maxPriorityFeePerGas ? toHex(maxPriorityFeePerGas) : undefined,
      nonce: nonce ? toHex(nonce) : undefined,
      ...(value ? { value } : {}),
    })
  );
};

const executeMulticall = async (
  name?: string,
  records?: ENSRegistrationRecords,
  gasLimit?: string | null,
  maxFeePerGas?: string,
  maxPriorityFeePerGas?: string,
  wallet?: Signer,
  nonce: number | null = null
) => {
  const { contract, methodArguments, value } = await getENSExecutionDetails({
    name,
    records,
    type: ENSRegistrationTransactionType.MULTICALL,
    wallet,
  });
  return (
    methodArguments &&
    contract?.multicall(...methodArguments, {
      gasLimit: gasLimit ? toHex(gasLimit) : undefined,
      maxFeePerGas: maxFeePerGas ? toHex(maxFeePerGas) : undefined,
      maxPriorityFeePerGas: maxPriorityFeePerGas ? toHex(maxPriorityFeePerGas) : undefined,
      nonce: nonce ? toHex(nonce) : undefined,
      ...(value ? { value } : {}),
    })
  );
};

const executeRenew = async (
  name?: string,
  duration?: number,
  ownerAddress?: string,
  rentPrice?: string,
  gasLimit?: string | null,
  maxFeePerGas?: string,
  maxPriorityFeePerGas?: string,
  wallet?: Signer,
  nonce: number | null = null
) => {
  const { contract, methodArguments, value } = await getENSExecutionDetails({
    duration,
    name,
    ownerAddress,
    rentPrice,
    type: ENSRegistrationTransactionType.RENEW,
    wallet,
  });

  return (
    methodArguments &&
    contract?.renew(...methodArguments, {
      gasLimit: gasLimit ? toHex(gasLimit) : undefined,
      maxFeePerGas: maxFeePerGas ? toHex(maxFeePerGas) : undefined,
      maxPriorityFeePerGas: maxPriorityFeePerGas ? toHex(maxPriorityFeePerGas) : undefined,
      nonce: nonce ? toHex(nonce) : undefined,
      ...(value ? { value } : {}),
    })
  );
};

const executeSetName = async (
  name?: string,
  ownerAddress?: string,
  gasLimit?: string | null,
  maxFeePerGas?: string,
  maxPriorityFeePerGas?: string,
  wallet?: Signer,
  nonce: number | null = null
) => {
  const { contract, methodArguments, value } = await getENSExecutionDetails({
    name,
    ownerAddress,
    type: ENSRegistrationTransactionType.SET_NAME,
    wallet,
  });

  return (
    methodArguments &&
    contract?.setName(...methodArguments, {
      gasLimit: gasLimit ? toHex(gasLimit) : undefined,
      maxFeePerGas: maxFeePerGas ? toHex(maxFeePerGas) : undefined,
      maxPriorityFeePerGas: maxPriorityFeePerGas ? toHex(maxPriorityFeePerGas) : undefined,
      nonce: nonce ? toHex(nonce) : undefined,
      ...(value ? { value } : {}),
    })
  );
};

const executeSetAddr = async (
  name?: string,
  records?: ENSRegistrationRecords,
  gasLimit?: string | null,
  maxFeePerGas?: string,
  maxPriorityFeePerGas?: string,
  wallet?: Signer,
  nonce: number | null = null
) => {
  const { contract, methodArguments, value } = await getENSExecutionDetails({
    name,
    records,
    type: ENSRegistrationTransactionType.SET_ADDR,
    wallet,
  });

  return (
    methodArguments &&
    contract?.setAddr(...methodArguments, {
      gasLimit: gasLimit ? toHex(gasLimit) : undefined,
      maxFeePerGas: maxFeePerGas ? toHex(maxFeePerGas) : undefined,
      maxPriorityFeePerGas: maxPriorityFeePerGas ? toHex(maxPriorityFeePerGas) : undefined,
      nonce: nonce ? toHex(nonce) : undefined,
      ...(value ? { value } : {}),
    })
  );
};

const executeSetContenthash = async (
  name?: string,
  records?: ENSRegistrationRecords,
  gasLimit?: string | null,
  maxFeePerGas?: string,
  maxPriorityFeePerGas?: string,
  wallet?: Signer,
  nonce: number | null = null
) => {
  const { contract, methodArguments, value } = await getENSExecutionDetails({
    name,
    records,
    type: ENSRegistrationTransactionType.SET_CONTENTHASH,
    wallet,
  });

  return (
    methodArguments &&
    contract?.setContenthash(...methodArguments, {
      gasLimit: gasLimit ? toHex(gasLimit) : undefined,
      maxFeePerGas: maxFeePerGas ? toHex(maxFeePerGas) : undefined,
      maxPriorityFeePerGas: maxPriorityFeePerGas ? toHex(maxPriorityFeePerGas) : undefined,
      nonce: nonce ? toHex(nonce) : undefined,
      ...(value ? { value } : {}),
    })
  );
};

const executeSetText = async (
  name?: string,
  records?: ENSRegistrationRecords,
  gasLimit?: string | null,
  maxFeePerGas?: string,
  maxPriorityFeePerGas?: string,
  wallet?: Signer,
  nonce: number | null = null
) => {
  const { contract, methodArguments, value } = await getENSExecutionDetails({
    name,
    records,
    type: ENSRegistrationTransactionType.SET_TEXT,
    wallet,
  });

  return (
    methodArguments &&
    contract?.setText(...methodArguments, {
      gasLimit: gasLimit ? toHex(gasLimit) : undefined,
      maxFeePerGas: maxFeePerGas ? toHex(maxFeePerGas) : undefined,
      maxPriorityFeePerGas: maxPriorityFeePerGas ? toHex(maxPriorityFeePerGas) : undefined,
      nonce: nonce ? toHex(nonce) : undefined,
      ...(value ? { value } : {}),
    })
  );
};

const executeReclaim = async (
  name?: string,
  toAddress?: string,
  records?: ENSRegistrationRecords,
  gasLimit?: string | null,
  maxFeePerGas?: string,
  maxPriorityFeePerGas?: string,
  wallet?: Signer,
  nonce: number | null = null
) => {
  const { contract, methodArguments, value } = await getENSExecutionDetails({
    name,
    records,
    toAddress,
    type: ENSRegistrationTransactionType.RECLAIM,
    wallet,
  });

  return (
    methodArguments &&
    contract?.reclaim(...methodArguments, {
      gasLimit: gasLimit ? toHex(gasLimit) : undefined,
      maxFeePerGas: maxFeePerGas ? toHex(maxFeePerGas) : undefined,
      maxPriorityFeePerGas: maxPriorityFeePerGas ? toHex(maxPriorityFeePerGas) : undefined,
      nonce: nonce ? toHex(nonce) : undefined,
      ...(value ? { value } : {}),
    })
  );
};

const ensAction = async (
  wallet: Signer,
  actionName: string,
  index: number,
  parameters: RapENSActionParameters,
  type: ENSRegistrationTransactionType,
  baseNonce?: number
): Promise<number | undefined> => {
  logger.log(`[${actionName}] base nonce`, baseNonce, 'index:', index);
  const { dispatch } = store;
  const { accountAddress: ownerAddress } = store.getState().settings;

  const { name, duration, rentPrice, records, salt, toAddress, mode } = parameters;

  logger.log(`[${actionName}] rap for`, name);

  let gasLimit;
  const ensRegistrationRecords = formatRecordsForTransaction(records);
  try {
    logger.sentry(
      `[${actionName}] estimate gas`,
      {
        ...parameters,
      },
      type
    );

    // when registering the ENS if we try to estimate gas for setting records
    // (MULTICALL || SET_TEXT) it's going to fail if we put the account address
    // since the account doesn't have the ENS yet
    const notUseOwnerAddress =
      IS_TESTING !== 'true' &&
      mode === REGISTRATION_MODES.CREATE &&
      (type === ENSRegistrationTransactionType.MULTICALL || type === ENSRegistrationTransactionType.SET_TEXT);

    gasLimit = await estimateENSTransactionGasLimit({
      duration,
      name,
      ownerAddress: notUseOwnerAddress ? undefined : ownerAddress,
      records: ensRegistrationRecords,
      rentPrice,
      salt,
      toAddress,
      type,
    });
  } catch (e) {
    logger.sentry(`[${actionName}] Error estimating gas`);
    captureException(e);
    throw e;
  }
  let tx;
  let maxFeePerGas;
  let maxPriorityFeePerGas;
  try {
    const gasParams = parseGasParamAmounts(parameters.selectedGasFee) as TransactionGasParamAmounts;
    maxFeePerGas = gasParams.maxFeePerGas;
    maxPriorityFeePerGas = gasParams.maxPriorityFeePerGas;

    logger.sentry(`[${actionName}] about to ${type}`, {
      ...parameters,
    });
    const nonce = baseNonce ? baseNonce + index : null;

    switch (type) {
      case ENSRegistrationTransactionType.COMMIT:
        tx = await executeCommit(
          name,
          duration,
          ownerAddress,
          rentPrice,
          salt,
          gasLimit,
          maxFeePerGas,
          maxPriorityFeePerGas,
          wallet,
          nonce
        );
        dispatch(
          saveCommitRegistrationParameters({
            commitTransactionHash: tx?.hash,
            duration,
            name,
            ownerAddress,
            records,
            rentPrice,
            salt,
          })
        );
        analytics.track('Initiated ENS registration', {
          category: 'profiles',
        });
        break;
      case ENSRegistrationTransactionType.MULTICALL:
        tx = await executeMulticall(name, ensRegistrationRecords, gasLimit, maxFeePerGas, maxPriorityFeePerGas, wallet, nonce);
        analytics.track('Edited ENS records', {
          category: 'profiles',
        });
        break;
      case ENSRegistrationTransactionType.REGISTER_WITH_CONFIG:
        tx = await executeRegisterWithConfig(
          name,
          duration,
          ownerAddress,
          rentPrice,
          salt,
          gasLimit,
          maxFeePerGas,
          maxPriorityFeePerGas,
          wallet,
          nonce
        );
        dispatch(
          updateTransactionRegistrationParameters({
            registerTransactionHash: tx?.hash,
          })
        );
        analytics.track('Completed ENS registration', {
          category: 'profiles',
        });
        break;
      case ENSRegistrationTransactionType.RENEW:
        tx = await executeRenew(name, duration, ownerAddress, rentPrice, gasLimit, maxFeePerGas, maxPriorityFeePerGas, wallet, nonce);
        analytics.track('Extended ENS', {
          category: 'profiles',
        });
        break;
      case ENSRegistrationTransactionType.SET_TEXT:
        tx = await executeSetText(name, ensRegistrationRecords, gasLimit, maxFeePerGas, maxPriorityFeePerGas, wallet, nonce);
        analytics.track('Edited ENS records', {
          category: 'profiles',
        });
        break;
      case ENSRegistrationTransactionType.SET_CONTENTHASH:
        tx = await executeSetContenthash(name, ensRegistrationRecords, gasLimit, maxFeePerGas, maxPriorityFeePerGas, wallet, nonce);
        analytics.track('Edited ENS records', {
          category: 'profiles',
        });
        break;
      case ENSRegistrationTransactionType.SET_ADDR:
        tx = await executeSetAddr(name, ensRegistrationRecords, gasLimit, maxFeePerGas, maxPriorityFeePerGas, wallet, nonce);
        analytics.track('Edited ENS records', {
          category: 'profiles',
        });
        break;
      case ENSRegistrationTransactionType.RECLAIM:
        tx = await executeReclaim(name, toAddress, ensRegistrationRecords, gasLimit, maxFeePerGas, maxPriorityFeePerGas, wallet, nonce);
        analytics.track('Transferred ENS control', {
          category: 'profiles',
        });
        break;
      case ENSRegistrationTransactionType.SET_NAME:
        tx = await executeSetName(name, ownerAddress, gasLimit, maxFeePerGas, maxPriorityFeePerGas, wallet, nonce);
        analytics.track('Set ENS to primary ', {
          category: 'profiles',
        });
    }
  } catch (e) {
    logger.sentry(`[${actionName}] Error executing`);
    captureException(e);
    throw e;
  }

  logger.log(`[${actionName}] response`, tx);

  const newTransaction: NewTransaction = {
    data: tx.data,
    ensCommitRegistrationName: type === ENSRegistrationTransactionType.COMMIT ? name : undefined,
    ensRegistration: true,
    from: ownerAddress,
    hash: tx?.hash,
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce: tx?.nonce,
    type: 'contract_interaction',
    contract: {
      name: 'ENS',
      iconUrl: 'https://rainbowme-res.cloudinary.com/image/upload/v1668565116/dapps/ens.domains.png',
    },
    to: tx?.to,
    value: toHex(tx.value),
    network: NetworkTypes.mainnet,
    status: 'pending',
  };
  logger.log(`[${actionName}] adding new txn`, newTransaction);

  addNewTransaction({
    address: ownerAddress,
    transaction: newTransaction,
    network: Network.mainnet,
  });
  return tx?.nonce;
};

const commitENS = async (
  wallet: Signer,
  currentRap: ENSRap,
  index: number,
  parameters: RapENSActionParameters,
  baseNonce?: number
): Promise<number | undefined> => {
  return ensAction(wallet, ENSRapActionType.commitENS, index, parameters, ENSRegistrationTransactionType.COMMIT, baseNonce);
};

const multicallENS = async (
  wallet: Signer,
  currentRap: ENSRap,
  index: number,
  parameters: RapENSActionParameters,
  baseNonce?: number
): Promise<number | undefined> => {
  return ensAction(wallet, ENSRapActionType.multicallENS, index, parameters, ENSRegistrationTransactionType.MULTICALL, baseNonce);
};

const registerWithConfig = async (
  wallet: Signer,
  currentRap: ENSRap,
  index: number,
  parameters: RapENSActionParameters,
  baseNonce?: number
): Promise<number | undefined> => {
  return ensAction(
    wallet,
    ENSRapActionType.registerWithConfigENS,
    index,
    parameters,
    ENSRegistrationTransactionType.REGISTER_WITH_CONFIG,
    baseNonce
  );
};

const renewENS = async (
  wallet: Signer,
  currentRap: ENSRap,
  index: number,
  parameters: RapENSActionParameters,
  baseNonce?: number
): Promise<number | undefined> => {
  return ensAction(wallet, ENSRapActionType.renewENS, index, parameters, ENSRegistrationTransactionType.RENEW, baseNonce);
};

const setNameENS = async (
  wallet: Signer,
  currentRap: ENSRap,
  index: number,
  parameters: RapENSActionParameters,
  baseNonce?: number
): Promise<number | undefined> => {
  return ensAction(wallet, ENSRapActionType.setNameENS, index, parameters, ENSRegistrationTransactionType.SET_NAME, baseNonce);
};

const setAddrENS = async (
  wallet: Signer,
  currentRap: ENSRap,
  index: number,
  parameters: RapENSActionParameters,
  baseNonce?: number
): Promise<number | undefined> => {
  return ensAction(wallet, ENSRapActionType.setAddrENS, index, parameters, ENSRegistrationTransactionType.SET_ADDR, baseNonce);
};

const reclaimENS = async (
  wallet: Signer,
  currentRap: ENSRap,
  index: number,
  parameters: RapENSActionParameters,
  baseNonce?: number
): Promise<number | undefined> => {
  return ensAction(wallet, ENSRapActionType.reclaimENS, index, parameters, ENSRegistrationTransactionType.RECLAIM, baseNonce);
};

const setTextENS = async (
  wallet: Signer,
  currentRap: ENSRap,
  index: number,
  parameters: RapENSActionParameters,
  baseNonce?: number
): Promise<number | undefined> => {
  return ensAction(wallet, ENSRapActionType.setTextENS, index, parameters, ENSRegistrationTransactionType.SET_TEXT, baseNonce);
};

const setContenthashENS = async (
  wallet: Signer,
  currentRap: ENSRap,
  index: number,
  parameters: RapENSActionParameters,
  baseNonce?: number
): Promise<number | undefined> => {
  return ensAction(
    wallet,
    ENSRapActionType.setContenthashENS,
    index,
    parameters,
    ENSRegistrationTransactionType.SET_CONTENTHASH,
    baseNonce
  );
};

const createENSRapByType = (type: string, ensRegistrationParameters: ENSActionParameters) => {
  switch (type) {
    case ENSRapActionType.registerENS:
      return createRegisterENSRap(ensRegistrationParameters);
    case ENSRapActionType.renewENS:
      return createRenewENSRap(ensRegistrationParameters);
    case ENSRapActionType.setNameENS:
      return createSetNameENSRap(ensRegistrationParameters);
    case ENSRapActionType.setRecordsENS:
      return createSetRecordsENSRap(ensRegistrationParameters);
    case ENSRapActionType.transferENS:
      return createTransferENSRap(ensRegistrationParameters);
    case ENSRapActionType.commitENS:
    default:
      return createCommitENSRap(ensRegistrationParameters);
  }
};

const getRapFullName = (actions: RapENSAction[]) => {
  const actionTypes = actions.map(action => action.type);
  return actionTypes.join(' + ');
};

const findENSActionByType = (type: ENSRapActionType) => {
  switch (type) {
    case ENSRapActionType.commitENS:
      return commitENS;
    case ENSRapActionType.registerWithConfigENS:
      return registerWithConfig;
    case ENSRapActionType.multicallENS:
      return multicallENS;
    case ENSRapActionType.setAddrENS:
      return setAddrENS;
    case ENSRapActionType.setContenthashENS:
      return setContenthashENS;
    case ENSRapActionType.setTextENS:
      return setTextENS;
    case ENSRapActionType.setNameENS:
      return setNameENS;
    case ENSRapActionType.reclaimENS:
      return reclaimENS;
    case ENSRapActionType.renewENS:
      return renewENS;
    default:
      return () => Promise.resolve(undefined);
  }
};

interface EthersError extends Error {
  code?: string | null;
}

const parseError = (error: EthersError): string => {
  const errorCode = error?.code;
  switch (errorCode) {
    case Logger.errors.UNPREDICTABLE_GAS_LIMIT:
      return i18n.t(i18n.l.wallet.transaction.errors.unpredictable_gas);
    case Logger.errors.INSUFFICIENT_FUNDS:
      return i18n.t(i18n.l.wallet.transaction.errors.insufficient_funds);
    default:
      return i18n.t(i18n.l.wallet.transaction.errors.generic);
  }
};

const executeAction = async (
  action: RapENSAction,
  wallet: Signer,
  rap: ENSRap,
  index: number,
  rapName: string,
  baseNonce?: number
): Promise<ENSRapActionResponse> => {
  logger.log('[1 INNER] index', index);
  const { type, parameters } = action;
  let nonce;
  try {
    logger.log('[2 INNER] executing type', type);
    const actionPromise = findENSActionByType(type);
    nonce = await actionPromise(wallet, rap, index, parameters as RapENSActionParameters, baseNonce);
    return { baseNonce: nonce, errorMessage: null };
  } catch (error: any) {
    logger.debug('Rap blew up', error);
    logger.sentry('[3 INNER] error running action, code:', error?.code);
    captureException(error);
    analytics.track('Rap failed', {
      category: 'raps',
      failed_action: type,
      label: rapName,
    });
    // If the first action failed, return an error message
    if (index === 0) {
      const errorMessage = parseError(error);
      logger.log('[4 INNER] displaying error message', errorMessage);
      return { baseNonce: null, errorMessage };
    }
    return { baseNonce: null, errorMessage: null };
  }
};

export const executeENSRap = async (
  wallet: Signer,
  type: ENSRapActionType,
  parameters: ENSActionParameters,
  callback: (success?: boolean, errorMessage?: string | null) => void
) => {
  const rap = await createENSRapByType(type, parameters as ENSActionParameters);
  const { actions } = rap;
  const rapName = getRapFullName(actions);

  analytics.track('Rap started', {
    category: 'raps',
    label: rapName,
  });

  let nonce = parameters?.nonce;

  logger.log('[common - executing rap]: actions', actions);
  if (actions.length) {
    const firstAction = actions[0];
    const { baseNonce, errorMessage } = await executeAction(firstAction, wallet, rap, 0, rapName, nonce);

    if (typeof baseNonce === 'number') {
      for (let index = 1; index < actions.length; index++) {
        const action = actions[index];
        await executeAction(action, wallet, rap, index, rapName, baseNonce);
      }
      nonce = baseNonce + actions.length - 1;
      callback(true);
    } else {
      // Callback with failure state
      callback(false, errorMessage);
    }
  }

  analytics.track('Rap completed', {
    category: 'raps',
    label: rapName,
  });
  logger.log('[common - executing rap] finished execute rap function');

  return { nonce };
};

export default {
  commitENS,
  multicallENS,
  reclaimENS,
  registerWithConfig,
  renewENS,
  setAddrENS,
  setContenthashENS,
  setNameENS,
  setTextENS,
};

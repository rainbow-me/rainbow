import { Wallet } from '@ethersproject/wallet';
import analytics from '@segment/analytics-react-native';
import { captureException } from '@sentry/react-native';
import {
  // @ts-ignore
  IS_TESTING,
} from 'react-native-dotenv';
import { Rap, RapActionTypes, RapENSActionParameters } from '../common';
import { ENSRegistrationRecords } from '@rainbow-me/entities';
import {
  estimateENSTransactionGasLimit,
  formatRecordsForTransaction,
} from '@rainbow-me/handlers/ens';
import { toHex } from '@rainbow-me/handlers/web3';
import { NetworkTypes } from '@rainbow-me/helpers';
import {
  ENSRegistrationTransactionType,
  getENSExecutionDetails,
} from '@rainbow-me/helpers/ens';
import { dataAddNewTransaction } from '@rainbow-me/redux/data';
import {
  saveCommitRegistrationParameters,
  updateTransactionRegistrationParameters,
} from '@rainbow-me/redux/ensRegistration';
import store from '@rainbow-me/redux/store';
import { ethereumUtils } from '@rainbow-me/utils';
import logger from 'logger';
const executeCommit = async (
  name?: string,
  duration?: number,
  ownerAddress?: string,
  rentPrice?: string,
  salt?: string,
  gasLimit?: string | null,
  maxFeePerGas?: string,
  maxPriorityFeePerGas?: string,
  wallet?: Wallet,
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
      maxPriorityFeePerGas: maxPriorityFeePerGas
        ? toHex(maxPriorityFeePerGas)
        : undefined,
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
  wallet?: Wallet,
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
      maxPriorityFeePerGas: maxPriorityFeePerGas
        ? toHex(maxPriorityFeePerGas)
        : undefined,
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
  wallet?: Wallet,
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
      maxPriorityFeePerGas: maxPriorityFeePerGas
        ? toHex(maxPriorityFeePerGas)
        : undefined,
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
  wallet?: Wallet,
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
      maxPriorityFeePerGas: maxPriorityFeePerGas
        ? toHex(maxPriorityFeePerGas)
        : undefined,
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
  wallet?: Wallet,
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
      maxPriorityFeePerGas: maxPriorityFeePerGas
        ? toHex(maxPriorityFeePerGas)
        : undefined,
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
  wallet?: Wallet,
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
      maxPriorityFeePerGas: maxPriorityFeePerGas
        ? toHex(maxPriorityFeePerGas)
        : undefined,
      nonce: nonce ? toHex(nonce) : undefined,
      ...(value ? { value } : {}),
    })
  );
};

const ensAction = async (
  wallet: Wallet,
  actionName: string,
  index: number,
  parameters: RapENSActionParameters,
  type: ENSRegistrationTransactionType,
  baseNonce?: number
): Promise<number | undefined> => {
  logger.log(`[${actionName}] base nonce`, baseNonce, 'index:', index);
  const { dispatch } = store;
  const { accountAddress: ownerAddress } = store.getState().settings;
  const { selectedGasFee } = store.getState().gas;
  const { name, duration, rentPrice, records, salt } = parameters;

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

    const setRecordsType =
      IS_TESTING !== 'true' &&
      (type === ENSRegistrationTransactionType.MULTICALL ||
        type === ENSRegistrationTransactionType.SET_TEXT);

    gasLimit = await estimateENSTransactionGasLimit({
      duration,
      name,
      ownerAddress: setRecordsType ? undefined : ownerAddress,
      records: ensRegistrationRecords,
      rentPrice,
      salt,
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
    maxFeePerGas = selectedGasFee?.gasFeeParams?.maxFeePerGas?.amount;
    maxPriorityFeePerGas =
      selectedGasFee?.gasFeeParams?.maxPriorityFeePerGas?.amount;

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
          // @ts-ignore
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
        tx = await executeMulticall(
          name,
          ensRegistrationRecords,
          gasLimit,
          maxFeePerGas,
          maxPriorityFeePerGas,
          wallet,
          nonce
        );
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
          // @ts-ignore
          updateTransactionRegistrationParameters({
            registerTransactionHash: tx?.hash,
          })
        );
        analytics.track('Completed ENS registration', {
          category: 'profiles',
        });
        break;
      case ENSRegistrationTransactionType.RENEW:
        tx = await executeRenew(
          name,
          duration,
          ownerAddress,
          rentPrice,
          gasLimit,
          maxFeePerGas,
          maxPriorityFeePerGas,
          wallet,
          nonce
        );
        analytics.track('Extended ENS', {
          category: 'profiles',
        });
        break;
      case ENSRegistrationTransactionType.SET_TEXT:
        tx = await executeSetText(
          name,
          ensRegistrationRecords,
          gasLimit,
          maxFeePerGas,
          maxPriorityFeePerGas,
          wallet,
          nonce
        );
        analytics.track('Edited ENS records', {
          category: 'profiles',
        });
        break;
      case ENSRegistrationTransactionType.SET_NAME:
        tx = await executeSetName(
          name,
          ownerAddress,
          gasLimit,
          maxFeePerGas,
          maxPriorityFeePerGas,
          wallet,
          nonce
        );
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

  const nativeAsset = await ethereumUtils.getNetworkNativeAsset(
    NetworkTypes.mainnet
  );
  const newTransaction = {
    amount: 0,
    asset: nativeAsset,
    data: tx.data,
    from: ownerAddress,
    gasLimit,
    hash: tx?.hash,
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce: tx?.nonce,
    to: tx?.to,
    value: toHex(tx.value),
  };
  logger.log(`[${actionName}] adding new txn`, newTransaction);
  // @ts-expect-error Since src/redux/data.js is not typed yet, `accountAddress`
  // being a string conflicts with the inferred type of "null" for the second
  // parameter.
  await dispatch(dataAddNewTransaction(newTransaction, ownerAddress));
  return tx?.nonce;
};

const commitENS = async (
  wallet: Wallet,
  currentRap: Rap,
  index: number,
  parameters: RapENSActionParameters,
  baseNonce?: number
): Promise<number | undefined> => {
  return ensAction(
    wallet,
    RapActionTypes.commitENS,
    index,
    parameters,
    ENSRegistrationTransactionType.COMMIT,
    baseNonce
  );
};

const multicallENS = async (
  wallet: Wallet,
  currentRap: Rap,
  index: number,
  parameters: RapENSActionParameters,
  baseNonce?: number
): Promise<number | undefined> => {
  return ensAction(
    wallet,
    RapActionTypes.multicallENS,
    index,
    parameters,
    ENSRegistrationTransactionType.MULTICALL,
    baseNonce
  );
};

const registerWithConfig = async (
  wallet: Wallet,
  currentRap: Rap,
  index: number,
  parameters: RapENSActionParameters,
  baseNonce?: number
): Promise<number | undefined> => {
  return ensAction(
    wallet,
    RapActionTypes.registerWithConfigENS,
    index,
    parameters,
    ENSRegistrationTransactionType.REGISTER_WITH_CONFIG,
    baseNonce
  );
};

const renewENS = async (
  wallet: Wallet,
  currentRap: Rap,
  index: number,
  parameters: RapENSActionParameters,
  baseNonce?: number
): Promise<number | undefined> => {
  return ensAction(
    wallet,
    RapActionTypes.renewENS,
    index,
    parameters,
    ENSRegistrationTransactionType.RENEW,
    baseNonce
  );
};

const setNameENS = async (
  wallet: Wallet,
  currentRap: Rap,
  index: number,
  parameters: RapENSActionParameters,
  baseNonce?: number
): Promise<number | undefined> => {
  return ensAction(
    wallet,
    RapActionTypes.setNameENS,
    index,
    parameters,
    ENSRegistrationTransactionType.SET_NAME,
    baseNonce
  );
};

const setTextENS = async (
  wallet: Wallet,
  currentRap: Rap,
  index: number,
  parameters: RapENSActionParameters,
  baseNonce?: number
): Promise<number | undefined> => {
  return ensAction(
    wallet,
    RapActionTypes.setTextENS,
    index,
    parameters,
    ENSRegistrationTransactionType.SET_TEXT,
    baseNonce
  );
};

export default {
  commitENS,
  multicallENS,
  registerWithConfig,
  renewENS,
  setNameENS,
  setTextENS,
};

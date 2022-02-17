import { Wallet } from '@ethersproject/wallet';
import { captureException } from '@sentry/react-native';
import { Rap, RapActionParameters } from '../common';
import { estimateENSTransactionGasLimit } from '@rainbow-me/handlers/ens';
import { toHex } from '@rainbow-me/handlers/web3';
import {
  ENSRegistrationRecords,
  ENSRegistrationTransactionType,
  getENSExecutionDetails,
} from '@rainbow-me/helpers/ens';
import { dataAddNewTransaction } from '@rainbow-me/redux/data';
import store from '@rainbow-me/redux/store';
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

const executeSetText = async (
  name?: string,
  recordKey?: string,
  recordValue?: string,
  gasLimit?: string | null,
  maxFeePerGas?: string,
  maxPriorityFeePerGas?: string,
  wallet?: Wallet,
  nonce: number | null = null
) => {
  const { contract, methodArguments, value } = await getENSExecutionDetails({
    name,
    records: {
      coinAddress: null,
      contentHash: null,
      ensAssociatedAddress: null,
      text: [
        {
          key: recordKey || '',
          value: recordValue || '',
        },
      ],
    },
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
  parameters: RapActionParameters,
  type: ENSRegistrationTransactionType,
  baseNonce?: number
): Promise<number | undefined> => {
  logger.log(`[${actionName}] base nonce`, baseNonce, 'index:', index);
  const { dispatch } = store;
  const { accountAddress: ownerAddress } = store.getState().settings;
  const { selectedGasFee } = store.getState().gas;
  const {
    name,
    duration,
    rentPrice,
    records,
    recordKey,
    recordValue,
    salt,
  } = parameters;

  logger.log(`[${actionName}] rap for`, name);

  let gasLimit;
  try {
    logger.sentry(
      `[${actionName}] estimate gas`,
      {
        ...parameters,
      },
      type
    );
    gasLimit = await estimateENSTransactionGasLimit({
      duration,
      name,
      ownerAddress,
      records,
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
    let maxFeePerGas = selectedGasFee?.gasFeeParams?.maxFeePerGas?.amount;
    let maxPriorityFeePerGas =
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
        break;
      case ENSRegistrationTransactionType.SET_TEXT:
        tx = await executeSetText(
          name,
          recordKey,
          recordValue,
          gasLimit,
          maxFeePerGas,
          maxPriorityFeePerGas,
          wallet,
          nonce
        );
        break;
      case ENSRegistrationTransactionType.MULTICALL:
        tx = await executeMulticall(
          name,
          records,
          gasLimit,
          maxFeePerGas,
          maxPriorityFeePerGas,
          wallet,
          nonce
        );
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
    }
  } catch (e) {
    logger.sentry(`[${actionName}] Error executing`);
    captureException(e);
    throw e;
  }

  logger.log(`[${actionName}] response`, tx);

  const newTransaction = {
    amount: 0,
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
  await dispatch(dataAddNewTransaction(newTransaction, accountAddress));
  return tx?.nonce;
};

const commitENS = async (
  wallet: Wallet,
  currentRap: Rap,
  index: number,
  parameters: RapActionParameters,
  baseNonce?: number
): Promise<number | undefined> => {
  const actionName = 'commitENS';
  return ensAction(
    wallet,
    actionName,
    index,
    parameters,
    ENSRegistrationTransactionType.COMMIT,
    baseNonce
  );
};

const registerENS = async (
  wallet: Wallet,
  currentRap: Rap,
  index: number,
  parameters: RapActionParameters,
  baseNonce?: number
): Promise<number | undefined> => {
  const actionName = 'registerENS';
  return ensAction(
    wallet,
    actionName,
    index,
    parameters,
    ENSRegistrationTransactionType.REGISTER_WITH_CONFIG,
    baseNonce
  );
};

const multicallENS = async (
  wallet: Wallet,
  currentRap: Rap,
  index: number,
  parameters: RapActionParameters,
  baseNonce?: number
): Promise<number | undefined> => {
  const actionName = 'multicallENS';
  return ensAction(
    wallet,
    actionName,
    index,
    parameters,
    ENSRegistrationTransactionType.MULTICALL,
    baseNonce
  );
};

const setTextENS = async (
  wallet: Wallet,
  currentRap: Rap,
  index: number,
  parameters: RapActionParameters,
  baseNonce?: number
): Promise<number | undefined> => {
  const actionName = 'setTextENS';
  return ensAction(
    wallet,
    actionName,
    index,
    parameters,
    ENSRegistrationTransactionType.SET_TEXT,
    baseNonce
  );
};

const setNameENS = async (
  wallet: Wallet,
  currentRap: Rap,
  index: number,
  parameters: RapActionParameters,
  baseNonce?: number
): Promise<number | undefined> => {
  const actionName = 'setNameENS';
  return ensAction(
    wallet,
    actionName,
    index,
    parameters,
    ENSRegistrationTransactionType.SET_NAME,
    baseNonce
  );
};

export default {
  commitENS,
  multicallENS,
  registerENS,
  setNameENS,
  setTextENS,
};

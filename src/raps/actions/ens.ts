import { Signer } from '@ethersproject/abstract-signer';
import { captureException } from '@sentry/react-native';
import {
  // @ts-ignore
  IS_TESTING,
} from 'react-native-dotenv';
import { Rap, RapActionTypes, RapENSActionParameters } from '../common';
import { analytics } from '@/analytics';
import { ENSRegistrationRecords, TransactionGasParamAmounts } from '@/entities';
import {
  estimateENSTransactionGasLimit,
  formatRecordsForTransaction,
} from '@/handlers/ens';
import { toHex } from '@/handlers/web3';
import { NetworkTypes } from '@/helpers';
import {
  ENSRegistrationTransactionType,
  getENSExecutionDetails,
  REGISTRATION_MODES,
} from '@/helpers/ens';
import { dataAddNewTransaction } from '@/redux/data';
import {
  saveCommitRegistrationParameters,
  updateTransactionRegistrationParameters,
} from '@/redux/ensRegistration';
import store from '@/redux/store';
import { ethereumUtils } from '@/utils';
import logger from '@/utils/logger';
import { parseGasParamAmounts } from '@/parsers';

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
      maxPriorityFeePerGas: maxPriorityFeePerGas
        ? toHex(maxPriorityFeePerGas)
        : undefined,
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
      maxPriorityFeePerGas: maxPriorityFeePerGas
        ? toHex(maxPriorityFeePerGas)
        : undefined,
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
      maxPriorityFeePerGas: maxPriorityFeePerGas
        ? toHex(maxPriorityFeePerGas)
        : undefined,
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
      maxPriorityFeePerGas: maxPriorityFeePerGas
        ? toHex(maxPriorityFeePerGas)
        : undefined,
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
  const { selectedGasFee } = store.getState().gas;

  const {
    name,
    duration,
    rentPrice,
    records,
    salt,
    toAddress,
    mode,
  } = parameters;

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
      (type === ENSRegistrationTransactionType.MULTICALL ||
        type === ENSRegistrationTransactionType.SET_TEXT);

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
    const gasParams = parseGasParamAmounts(
      selectedGasFee
    ) as TransactionGasParamAmounts;
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
      case ENSRegistrationTransactionType.SET_CONTENTHASH:
        tx = await executeSetContenthash(
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
      case ENSRegistrationTransactionType.SET_ADDR:
        tx = await executeSetAddr(
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
      case ENSRegistrationTransactionType.RECLAIM:
        tx = await executeReclaim(
          name,
          toAddress,
          ensRegistrationRecords,
          gasLimit,
          maxFeePerGas,
          maxPriorityFeePerGas,
          wallet,
          nonce
        );
        analytics.track('Transferred ENS control', {
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
    ensCommitRegistrationName:
      type === ENSRegistrationTransactionType.COMMIT ? name : undefined,
    ensRegistration: true,
    from: ownerAddress,
    gasLimit,
    hash: tx?.hash,
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce: tx?.nonce,
    to: tx?.to,
    value: toHex(tx.value),
    network: NetworkTypes.mainnet,
  };
  logger.log(`[${actionName}] adding new txn`, newTransaction);
  // @ts-expect-error Since src/redux/data.js is not typed yet, `accountAddress`
  // being a string conflicts with the inferred type of "null" for the second
  // parameter.
  await dispatch(dataAddNewTransaction(newTransaction, ownerAddress));
  return tx?.nonce;
};

const commitENS = async (
  wallet: Signer,
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
  wallet: Signer,
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
  wallet: Signer,
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
  wallet: Signer,
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
  wallet: Signer,
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

const setAddrENS = async (
  wallet: Signer,
  currentRap: Rap,
  index: number,
  parameters: RapENSActionParameters,
  baseNonce?: number
): Promise<number | undefined> => {
  return ensAction(
    wallet,
    RapActionTypes.setAddrENS,
    index,
    parameters,
    ENSRegistrationTransactionType.SET_ADDR,
    baseNonce
  );
};

const reclaimENS = async (
  wallet: Signer,
  currentRap: Rap,
  index: number,
  parameters: RapENSActionParameters,
  baseNonce?: number
): Promise<number | undefined> => {
  return ensAction(
    wallet,
    RapActionTypes.reclaimENS,
    index,
    parameters,
    ENSRegistrationTransactionType.RECLAIM,
    baseNonce
  );
};

const setTextENS = async (
  wallet: Signer,
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

const setContenthashENS = async (
  wallet: Signer,
  currentRap: Rap,
  index: number,
  parameters: RapENSActionParameters,
  baseNonce?: number
): Promise<number | undefined> => {
  return ensAction(
    wallet,
    RapActionTypes.setContenthashENS,
    index,
    parameters,
    ENSRegistrationTransactionType.SET_CONTENTHASH,
    baseNonce
  );
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

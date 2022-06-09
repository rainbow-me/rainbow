import { AddressZero } from '@ethersproject/constants';
import { concat, isEmpty } from 'lodash';
import {
  createNewENSAction,
  createNewRap,
  ENSActionParameters,
  RapActionTypes,
  RapENSAction,
} from './common';
import { Records } from '@rainbow-me/entities';
import {
  formatRecordsForTransaction,
  getRapActionTypeForTxType,
  getTransactionTypeForRecords,
  recordsForTransactionAreValid,
} from '@rainbow-me/handlers/ens';
import { ENS_RECORDS } from '@rainbow-me/helpers/ens';

export const createSetRecordsENSRap = async (
  ensActionParameters: ENSActionParameters
) => {
  let actions: RapENSAction[] = [];

  const ensRegistrationRecords = formatRecordsForTransaction(
    ensActionParameters.records
  );
  const validRecords = recordsForTransactionAreValid(ensRegistrationRecords);
  if (validRecords) {
    const txType = getTransactionTypeForRecords(ensRegistrationRecords);
    if (txType) {
      const rapActionType = getRapActionTypeForTxType(txType);
      if (rapActionType) {
        const recordsAction = createNewENSAction(
          rapActionType,
          ensActionParameters
        );
        actions = concat(actions, recordsAction);
      }
    }
  }

  // create the overall rap
  const newRap = createNewRap(actions);
  return newRap;
};

export const createRegisterENSRap = async (
  ensActionParameters: ENSActionParameters
) => {
  let actions: RapENSAction[] = [];

  const register = createNewENSAction(
    RapActionTypes.registerWithConfigENS,
    ensActionParameters
  );
  actions = concat(actions, register);

  const ensRegistrationRecords = formatRecordsForTransaction(
    ensActionParameters.records
  );
  const validRecords = recordsForTransactionAreValid(ensRegistrationRecords);
  if (validRecords) {
    const txType = getTransactionTypeForRecords(ensRegistrationRecords);
    if (txType) {
      const rapActionType = getRapActionTypeForTxType(txType);
      if (rapActionType) {
        const recordsAction = createNewENSAction(
          rapActionType,
          ensActionParameters
        );
        actions = concat(actions, recordsAction);
      }
    }
  }

  if (ensActionParameters.setReverseRecord) {
    const setName = createNewENSAction(
      RapActionTypes.setNameENS,
      ensActionParameters
    );
    actions = concat(actions, setName);
  }

  // create the overall rap
  const newRap = createNewRap(actions);
  return newRap;
};

export const createRenewENSRap = async (
  ENSActionParameters: ENSActionParameters
) => {
  let actions: RapENSAction[] = [];
  // // commit rap
  const commit = createNewENSAction(
    RapActionTypes.renewENS,
    ENSActionParameters
  );
  actions = concat(actions, commit);

  // create the overall rap
  const newRap = createNewRap(actions);
  return newRap;
};

export const createSetNameENSRap = async (
  ENSActionParameters: ENSActionParameters
) => {
  let actions: RapENSAction[] = [];
  // // commit rap
  const commit = createNewENSAction(
    RapActionTypes.setNameENS,
    ENSActionParameters
  );
  actions = concat(actions, commit);

  // create the overall rap
  const newRap = createNewRap(actions);
  return newRap;
};

export const createTransferENSRap = async (
  ensActionParameters: ENSActionParameters
) => {
  let actions: RapENSAction[] = [];

  const {
    clearRecords,
    records,
    setAddress,
    transferControl,
    toAddress,
  } = ensActionParameters;

  if (clearRecords) {
    const emptyRecords = Object.keys(records || {}).reduce(
      (records, recordKey) => ({
        ...records,
        // Use zero address for ETH record as an empty string throws an error
        [recordKey]: recordKey === ENS_RECORDS.ETH ? AddressZero : '',
      }),
      {}
    );

    let newRecords: Records = emptyRecords;
    if (setAddress && toAddress) {
      newRecords = {
        ...newRecords,
        ETH: toAddress,
      };
    }

    const ensRegistrationRecords = formatRecordsForTransaction(newRecords);
    const validRecords =
      !isEmpty(emptyRecords) &&
      recordsForTransactionAreValid(ensRegistrationRecords);
    if (validRecords) {
      const txType = getTransactionTypeForRecords(ensRegistrationRecords);
      if (txType) {
        const rapActionType = getRapActionTypeForTxType(txType);
        if (rapActionType) {
          const recordsAction = createNewENSAction(rapActionType, {
            ...ensActionParameters,
            records: newRecords,
          });
          actions = concat(actions, recordsAction);
        }
      }
    }
  } else if (setAddress) {
    const setName = createNewENSAction(RapActionTypes.setAddrENS, {
      ...ensActionParameters,
      records: { ETH: toAddress },
    });
    actions = concat(actions, setName);
  }
  if (transferControl && toAddress) {
    const transferControl = createNewENSAction(RapActionTypes.setOwnerENS, {
      ...ensActionParameters,
      ownerAddress: toAddress,
    });
    actions = concat(actions, transferControl);
  }

  // create the overall rap
  const newRap = createNewRap(actions);
  return newRap;
};

export const createCommitENSRap = async (
  ENSActionParameters: ENSActionParameters
) => {
  let actions: RapENSAction[] = [];
  // // commit rap
  const commit = createNewENSAction(
    RapActionTypes.commitENS,
    ENSActionParameters
  );
  actions = concat(actions, commit);

  // create the overall rap
  const newRap = createNewRap(actions);
  return newRap;
};

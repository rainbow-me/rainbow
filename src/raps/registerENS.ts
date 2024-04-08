import { AddressZero } from '@ethersproject/constants';
import { isEmpty } from 'lodash';
import { createNewENSAction, createNewENSRap, ENSActionParameters, RapENSAction, ENSRapActionType } from './common';
import { Records } from '@/entities';
import {
  formatRecordsForTransaction,
  getRapActionTypeForTxType,
  getTransactionTypeForRecords,
  recordsForTransactionAreValid,
} from '@/handlers/ens';
import { ENS_RECORDS } from '@/helpers/ens';

export const createSetRecordsENSRap = async (ensActionParameters: ENSActionParameters) => {
  let actions: RapENSAction[] = [];

  const ensRegistrationRecords = formatRecordsForTransaction(ensActionParameters.records);
  const validRecords = recordsForTransactionAreValid(ensRegistrationRecords);
  if (validRecords) {
    const txType = getTransactionTypeForRecords(ensRegistrationRecords);
    if (txType) {
      const rapActionType = getRapActionTypeForTxType(txType);
      if (rapActionType) {
        const recordsAction = createNewENSAction(rapActionType, ensActionParameters);
        actions = actions.concat(recordsAction);
      }
    }
  }

  if (ensActionParameters.setReverseRecord) {
    const setName = createNewENSAction(ENSRapActionType.setNameENS, ensActionParameters);
    actions = actions.concat(setName);
  }

  // create the overall rap
  const newRap = createNewENSRap(actions);
  return newRap;
};

export const createRegisterENSRap = async (ensActionParameters: ENSActionParameters) => {
  let actions: RapENSAction[] = [];

  const register = createNewENSAction(ENSRapActionType.registerWithConfigENS, ensActionParameters);
  actions = actions.concat(register);

  const ensRegistrationRecords = formatRecordsForTransaction(ensActionParameters.records);
  const validRecords = recordsForTransactionAreValid(ensRegistrationRecords);
  if (validRecords) {
    const txType = getTransactionTypeForRecords(ensRegistrationRecords);
    if (txType) {
      const rapActionType = getRapActionTypeForTxType(txType);
      if (rapActionType) {
        const recordsAction = createNewENSAction(rapActionType, ensActionParameters);
        actions = actions.concat(recordsAction);
      }
    }
  }

  if (ensActionParameters.setReverseRecord) {
    const setName = createNewENSAction(ENSRapActionType.setNameENS, ensActionParameters);
    actions = actions.concat(setName);
  }

  // create the overall rap
  const newRap = createNewENSRap(actions);
  return newRap;
};

export const createRenewENSRap = async (ENSActionParameters: ENSActionParameters) => {
  let actions: RapENSAction[] = [];
  // // commit rap
  const commit = createNewENSAction(ENSRapActionType.renewENS, ENSActionParameters);
  actions = actions.concat(commit);

  // create the overall rap
  const newRap = createNewENSRap(actions);
  return newRap;
};

export const createSetNameENSRap = async (ENSActionParameters: ENSActionParameters) => {
  let actions: RapENSAction[] = [];
  // // commit rap
  const commit = createNewENSAction(ENSRapActionType.setNameENS, ENSActionParameters);
  actions = actions.concat(commit);

  // create the overall rap
  const newRap = createNewENSRap(actions);
  return newRap;
};

export const createTransferENSRap = async (ensActionParameters: ENSActionParameters) => {
  let actions: RapENSAction[] = [];

  const { clearRecords, records, setAddress, transferControl, toAddress } = ensActionParameters;

  if (clearRecords) {
    const emptyRecords = Object.keys(records ?? {}).reduce(
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
    const validRecords = !isEmpty(emptyRecords) && recordsForTransactionAreValid(ensRegistrationRecords);
    if (validRecords) {
      const txType = getTransactionTypeForRecords(ensRegistrationRecords);
      if (txType) {
        const rapActionType = getRapActionTypeForTxType(txType);
        if (rapActionType) {
          const recordsAction = createNewENSAction(rapActionType, {
            ...ensActionParameters,
            records: newRecords,
          });
          actions = actions.concat(recordsAction);
        }
      }
    }
  } else if (setAddress) {
    const setName = createNewENSAction(ENSRapActionType.setAddrENS, {
      ...ensActionParameters,
      records: { ETH: toAddress },
    });
    actions = actions.concat(setName);
  }
  if (transferControl && toAddress) {
    const transferControl = createNewENSAction(ENSRapActionType.reclaimENS, {
      ...ensActionParameters,
      toAddress,
    });
    actions = actions.concat(transferControl);
  }

  // create the overall rap
  const newRap = createNewENSRap(actions);
  return newRap;
};

export const createCommitENSRap = async (ENSActionParameters: ENSActionParameters) => {
  let actions: RapENSAction[] = [];
  // // commit rap
  const commit = createNewENSAction(ENSRapActionType.commitENS, ENSActionParameters);
  actions = actions.concat(commit);

  // create the overall rap
  const newRap = createNewENSRap(actions);
  return newRap;
};

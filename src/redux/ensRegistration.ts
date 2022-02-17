import { omit } from 'lodash';
import { AnyAction } from 'redux';

import { AppDispatch, AppGetState } from './store';
import {
  ENSRegistrationState,
  EthereumAddress,
  Records,
  RegistrationParameters,
} from '@rainbow-me/entities';

const ENS_REGISTRATION_UPDATE_DURATION =
  'ensRegistration/ENS_REGISTRATION_UPDATE_DURATION';
const ENS_REGISTRATION_UPDATE_RECORDS =
  'ensRegistration/ENS_REGISTRATION_UPDATE_RECORDS';
const ENS_REGISTRATION_UPDATE_RECORD_BY_KEY =
  'ensRegistration/ENS_REGISTRATION_UPDATE_RECORD_BY_KEY';
const ENS_REGISTRATION_REMOVE_RECORD_BY_KEY =
  'ensRegistration/ENS_REGISTRATION_REMOVE_RECORD_BY_KEY';
const ENS_SET_CURRENT_REGISTRATION_NAME =
  'ensRegistration/ENS_SET_CURRENT_REGISTRATION_NAME';
const ENS_CONTINUE_REGISTRATION = 'ensRegistration/ENS_CONTINUE_REGISTRATION';
const ENS_START_REGISTRATION = 'ensRegistration/ENS_START_REGISTRATION';
const ENS_SAVE_COMMIT_REGISTRATION_PARAMETERS =
  'ensRegistration/ENS_SAVE_COMMIT_REGISTRATION_PARAMETERS';

// -- Actions ---------------------------------------- //
export const startRegistration = (
  accountAddress: EthereumAddress,
  name: string
) => async (dispatch: AppDispatch, getState: AppGetState) => {
  const {
    ensRegistration: { registrations },
  } = getState();

  const lcAccountAddress = accountAddress.toLowerCase();
  const accountRegistrations = registrations?.[lcAccountAddress] || {};
  const registration = accountRegistrations[name] || {};

  const updatedEnsRegistrationManager = {
    currentRegistrationName: name,
    registrations: {
      ...registrations,
      [lcAccountAddress]: {
        ...accountRegistrations,
        [name]: { ...registration, name },
      },
    },
  };
  dispatch({
    payload: updatedEnsRegistrationManager,
    type: ENS_START_REGISTRATION,
  });
};

export const continueRegistration = (name: string) => async (
  dispatch: AppDispatch
) => {
  const updatedEnsRegistrationManager = {
    currentRegistrationName: name,
  };
  dispatch({
    payload: updatedEnsRegistrationManager,
    type: ENS_CONTINUE_REGISTRATION,
  });
};

export const updateRegistrationDuration = (
  accountAddress: EthereumAddress,
  duration: number
) => async (dispatch: AppDispatch, getState: AppGetState) => {
  const {
    ensRegistration: { registrations, currentRegistrationName },
  } = getState();
  const lcAccountAddress = accountAddress.toLowerCase();

  const accountRegistrations = registrations?.[lcAccountAddress] || {};
  const registration = accountRegistrations[currentRegistrationName] || {};

  const updatedEnsRegistrationManager = {
    registrations: {
      ...registrations,
      [lcAccountAddress]: {
        ...accountRegistrations,
        [currentRegistrationName]: { ...registration, duration },
      },
    },
  };
  dispatch({
    payload: updatedEnsRegistrationManager,
    type: ENS_REGISTRATION_UPDATE_DURATION,
  });
};

export const updateRecords = (
  accountAddress: EthereumAddress,
  records: Records
) => async (dispatch: AppDispatch, getState: AppGetState) => {
  const {
    ensRegistration: { registrations, currentRegistrationName },
  } = getState();
  const lcAccountAddress = accountAddress.toLowerCase();
  const accountRegistrations = registrations?.[lcAccountAddress] || {};
  const registration = accountRegistrations[currentRegistrationName] || {};

  const updatedEnsRegistrationManagerForAccount = {
    registrations: {
      ...registrations,
      [lcAccountAddress]: {
        ...accountRegistrations,
        [currentRegistrationName]: { ...registration, records },
      },
    },
  };
  dispatch({
    payload: updatedEnsRegistrationManagerForAccount,
    type: ENS_REGISTRATION_UPDATE_RECORDS,
  });
};

export const updateRecordByKey = (
  accountAddress: EthereumAddress,
  key: string,
  value: string
) => async (dispatch: AppDispatch, getState: AppGetState) => {
  const {
    ensRegistration: { registrations, currentRegistrationName },
  } = getState();
  const lcAccountAddress = accountAddress.toLowerCase();

  const accountRegistrations = registrations?.[lcAccountAddress] || {};
  const registration = accountRegistrations[currentRegistrationName] || {};
  const registrationRecords = registration?.records || {};

  const updatedEnsRegistrationManagerForAccount = {
    registrations: {
      ...registrations,
      [lcAccountAddress]: {
        ...accountRegistrations,
        [currentRegistrationName]: {
          ...registration,
          records: { ...registrationRecords, [key]: value },
        },
      },
    },
  };
  dispatch({
    payload: updatedEnsRegistrationManagerForAccount,
    type: ENS_REGISTRATION_UPDATE_RECORDS,
  });
};

export const removeRecordByKey = (
  accountAddress: EthereumAddress,
  key: string
) => async (dispatch: AppDispatch, getState: AppGetState) => {
  const {
    ensRegistration: { registrations, currentRegistrationName },
  } = getState();

  const lcAccountAddress = accountAddress.toLowerCase();
  const accountRegistrations = registrations?.[lcAccountAddress] || {};
  const registration = accountRegistrations[currentRegistrationName] || {};
  const registrationRecords = registration?.records || {};

  const newRecords = omit(registrationRecords, key) as Records;

  const updatedEnsRegistrationManagerForAccount = {
    registrations: {
      ...registrations,
      [lcAccountAddress]: {
        ...accountRegistrations,
        [currentRegistrationName]: {
          ...registration,
          records: newRecords,
        },
      },
    },
  };

  dispatch({
    payload: updatedEnsRegistrationManagerForAccount,
    type: ENS_REGISTRATION_REMOVE_RECORD_BY_KEY,
  });
};

export const saveCommitRegistrationParameters = (
  accountAddress: EthereumAddress,
  registrationParameters: RegistrationParameters
) => async (dispatch: AppDispatch, getState: AppGetState) => {
  const {
    ensRegistration: { registrations, currentRegistrationName },
  } = getState();

  const lcAccountAddress = accountAddress.toLowerCase();
  const accountRegistrations = registrations?.[lcAccountAddress] || {};
  const registration = accountRegistrations[currentRegistrationName] || {};
  const updatedEnsRegistrationManagerForAccount = {
    registrations: {
      ...registrations,
      [lcAccountAddress]: {
        ...accountRegistrations,
        [currentRegistrationName]: {
          ...registration,
          ...registrationParameters,
        },
      },
    },
  };

  dispatch({
    payload: updatedEnsRegistrationManagerForAccount,
    type: ENS_SAVE_COMMIT_REGISTRATION_PARAMETERS,
  });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE: ENSRegistrationState = {
  currentRegistrationName: '',
  registrations: {},
};

export default (
  state = INITIAL_STATE,
  action: AnyAction
): ENSRegistrationState => {
  switch (action.type) {
    case ENS_START_REGISTRATION:
      return {
        ...state,
        ...action.payload,
      };
    case ENS_SET_CURRENT_REGISTRATION_NAME:
      return {
        ...state,
        ...action.payload,
      };
    case ENS_REGISTRATION_UPDATE_DURATION:
      return {
        ...state,
        ...action.payload,
      };
    case ENS_REGISTRATION_UPDATE_RECORDS:
      return {
        ...state,
        ...action.payload,
      };
    case ENS_REGISTRATION_UPDATE_RECORD_BY_KEY:
      return {
        ...state,
        ...action.payload,
      };
    case ENS_REGISTRATION_REMOVE_RECORD_BY_KEY:
      return {
        ...state,
        ...action.payload,
      };
    case ENS_SAVE_COMMIT_REGISTRATION_PARAMETERS:
      return {
        ...state,
        ...action.payload,
      };
    default:
      return state;
  }
};

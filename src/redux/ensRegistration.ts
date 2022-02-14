import { omit } from 'lodash';
import { AnyAction } from 'redux';
import { AppDispatch, AppGetState } from './store';
import {
  ENSRegistrationState,
  EthereumAddress,
  Records,
} from '@rainbow-me/entities';

const ENS_REGISTRATION_UPDATE_NAME =
  'ensRegistration/ENS_REGISTRATION_UPDATE_NAME';
const ENS_REGISTRATION_UPDATE_DURATION =
  'ensRegistration/ENS_REGISTRATION_UPDATE_DURATION';
const ENS_REGISTRATION_UPDATE_RECORDS =
  'ensRegistration/ENS_REGISTRATION_UPDATE_RECORDS';
const ENS_REGISTRATION_UPDATE_RECORD_BY_KEY =
  'ensRegistration/ENS_REGISTRATION_UPDATE_RECORD_BY_KEY';
const ENS_REGISTRATION_REMOVE_RECORD_BY_KEY =
  'ensRegistration/ENS_REGISTRATION_REMOVE_RECORD_BY_KEY';

// -- Actions ---------------------------------------- //
export const startRegistration = (
  accountAddress: EthereumAddress,
  name: string
) => async (dispatch: AppDispatch, getState: AppGetState) => {
  const { ensRegistration: registrationsData } = getState();

  const lcAccountAddress = accountAddress.toLowerCase();
  const accountRegistrations = registrationsData?.[accountAddress] || {};

  const updatedEnsRegistrationManagerForAccount = {
    [lcAccountAddress]: {
      ...accountRegistrations,
      [name]: { name },
    },
  };
  dispatch({
    payload: updatedEnsRegistrationManagerForAccount,
    type: ENS_REGISTRATION_UPDATE_NAME,
  });
};

export const updateRegistrationDuration = (
  accountAddress: EthereumAddress,
  name: string,
  duration: number
) => async (dispatch: AppDispatch, getState: AppGetState) => {
  const { ensRegistration: registrationsData } = getState();

  const lcAccountAddress = accountAddress.toLowerCase();
  const accountRegistrations = registrationsData?.[accountAddress] || {};
  const registration = accountRegistrations[name] || {};

  const updatedEnsRegistrationManagerForAccount = {
    [lcAccountAddress]: {
      ...accountRegistrations,
      [name]: { ...registration, duration },
    },
  };
  dispatch({
    payload: updatedEnsRegistrationManagerForAccount,
    type: ENS_REGISTRATION_UPDATE_DURATION,
  });
};

export const updateRecords = (
  accountAddress: EthereumAddress,
  name: string,
  records: Records
) => async (dispatch: AppDispatch, getState: AppGetState) => {
  const { ensRegistration: registrationsData } = getState();

  const lcAccountAddress = accountAddress.toLowerCase();
  const accountRegistrations = registrationsData?.[accountAddress] || {};
  const registration = accountRegistrations[name] || {};

  const updatedEnsRegistrationManagerForAccount = {
    [lcAccountAddress]: {
      ...accountRegistrations,
      [name]: { ...registration, records },
    },
  };
  dispatch({
    payload: updatedEnsRegistrationManagerForAccount,
    type: ENS_REGISTRATION_UPDATE_RECORDS,
  });
};

export const updateRecordByKey = (
  accountAddress: EthereumAddress,
  name: string,
  key: string,
  value: string
) => async (dispatch: AppDispatch, getState: AppGetState) => {
  const { ensRegistration: registrationsData } = getState();

  const lcAccountAddress = accountAddress.toLowerCase();
  const accountRegistrations = registrationsData?.[accountAddress] || {};
  const registration = accountRegistrations[name] || {};
  const registrationRecords = registration?.records || {};

  const updatedEnsRegistrationManagerForAccount = {
    [lcAccountAddress]: {
      ...accountRegistrations,
      [name]: {
        ...registration,
        records: { ...registrationRecords, [key]: value },
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
  name: string,
  key: string
) => async (dispatch: AppDispatch, getState: AppGetState) => {
  const { ensRegistration: registrationsData } = getState();

  const lcAccountAddress = accountAddress.toLowerCase();
  const accountRegistrations = registrationsData?.[accountAddress] || {};
  const registration = accountRegistrations[name] || {};
  const registrationRecords = registration?.records || {};

  const newRecords = omit(registrationRecords, key) as Records;

  const updatedEnsRegistrationManagerForAccount = {
    [lcAccountAddress]: {
      ...accountRegistrations,
      [name]: {
        ...registration,
        records: newRecords,
      },
    },
  };

  dispatch({
    payload: updatedEnsRegistrationManagerForAccount,
    type: ENS_REGISTRATION_REMOVE_RECORD_BY_KEY,
  });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE: ENSRegistrationState = {};

export default (
  state = INITIAL_STATE,
  action: AnyAction
): ENSRegistrationState => {
  switch (action.type) {
    case ENS_REGISTRATION_UPDATE_NAME:
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
    default:
      return state;
  }
};

import { AnyAction } from 'redux';
import { AppDispatch } from './store';
import { ENS_RECORDS } from '@rainbow-me/helpers/ens';

const ENS_REGISTRATION_UPDATE_NAME =
  'ensRegistration/ENS_REGISTRATION_UPDATE_NAME';
const ENS_REGISTRATION_UPDATE_DURATION =
  'ensRegistration/ENS_REGISTRATION_UPDATE_DURATION';
const ENS_REGISTRATION_UPDATE_RECORDS =
  'ensRegistration/ENS_REGISTRATION_UPDATE_RECORDS';
const ENS_REGISTRATION_UPDATE_RECORD_BY_KEY =
  'ensRegistration/ENS_REGISTRATION_UPDATE_RECORD_BY_KEY';

type Records = Record<ENS_RECORDS, string>;

interface ENSRegistrationState {
  name: string;
  duration: number;
  records: Records;
}

// -- Actions ---------------------------------------- //
export const ensRegistrationUpdateName = (name: string) => async (
  dispatch: AppDispatch
) =>
  dispatch({
    payload: name,
    type: ENS_REGISTRATION_UPDATE_NAME,
  });

export const ensRegistrationUpdateDuration = (duration: number) => async (
  dispatch: AppDispatch
) =>
  dispatch({
    payload: duration,
    type: ENS_REGISTRATION_UPDATE_DURATION,
  });

export const ensRegistrationUpdateRecords = (records: Records) => async (
  dispatch: AppDispatch
) =>
  dispatch({
    payload: records,
    type: ENS_REGISTRATION_UPDATE_RECORDS,
  });

export const ensRegistrationUpdateRecordByKey = (
  key: string,
  value: string
) => async (dispatch: AppDispatch) =>
  dispatch({
    payload: { key, value },
    type: ENS_REGISTRATION_UPDATE_RECORD_BY_KEY,
  });

// -- Reducer ----------------------------------------- //
const INITIAL_STATE: ENSRegistrationState = {
  duration: 0,
  name: '',
  records: {} as Records,
};

export default (state = INITIAL_STATE, action: AnyAction) => {
  switch (action.type) {
    case ENS_REGISTRATION_UPDATE_NAME:
      return {
        ...state,
        name: action.payload,
      };
    case ENS_REGISTRATION_UPDATE_DURATION:
      return {
        ...state,
        duration: action.payload,
      };
    case ENS_REGISTRATION_UPDATE_RECORDS:
      return {
        ...state,
        records: action.payload,
      };
    case ENS_REGISTRATION_UPDATE_RECORD_BY_KEY: {
      const { key, value } = action.payload;
      return {
        ...state,
        records: {
          ...state.records,
          [key]: value,
        },
      };
    }
    default:
      return state;
  }
};

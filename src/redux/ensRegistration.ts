import { AnyAction } from 'redux';
import { AppDispatch } from './store';

export const ENS_REGISTRATION_UPDATE_NAME =
  'ensRegistration/ENS_REGISTRATION_UPDATE_NAME';
export const ENS_REGISTRATION_DUMMY_UPDATE_RECORDS =
  'ensRegistration/ENS_REGISTRATION_DUMMY_UPDATE_RECORDS';

// -- Actions ---------------------------------------- //

interface Records {
  [key: string]: string;
}

interface ChartsState {
  name: string;
  records: Records;
}

export const ensRegistrationUpdateName = (name: string) => async (
  dispatch: AppDispatch
) =>
  dispatch({
    payload: name,
    type: ENS_REGISTRATION_UPDATE_NAME,
  });

export const ensRegistrationUpdateRecords = (records: Records) => async (
  dispatch: AppDispatch
) =>
  dispatch({
    payload: records,
    type: ENS_REGISTRATION_DUMMY_UPDATE_RECORDS,
  });

// -- Reducer ----------------------------------------- //
const INITIAL_STATE: ChartsState = {
  name: '',
  records: {} as Records,
};

export default (state = INITIAL_STATE, action: AnyAction) => {
  switch (action.type) {
    case ENS_REGISTRATION_DUMMY_UPDATE_RECORDS:
      return {
        ...state,
        records: action.payload,
      };
    case ENS_REGISTRATION_UPDATE_NAME:
      return {
        ...state,
        name: action.payload,
      };
    default:
      return state;
  }
};

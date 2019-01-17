import { getLastTrackingDate, updateLastTrackingDate } from '../model/localstorage';

// -- Constants --------------------------------------- //
const TRACKING_UPDATE_DATE = 'tracking/TRACKING_UPDATE_DATE';

export const trackingDateInit = () => (dispatch, getState) => {
  getLastTrackingDate().then(lastTrackingDate => {
    dispatch({ payload: lastTrackingDate, type: TRACKING_UPDATE_DATE });
  });
};

export const updateTrackingDate = () => (dispatch, getState) => {
  updateLastTrackingDate().then(() => {
    dispatch({ payload: Date.now(), type: TRACKING_UPDATE_DATE });
  });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  trackingDate: null,
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
  case TRACKING_UPDATE_DATE:
    return { ...state, trackingDate: action.payload };
  default:
    return state;
  }
};

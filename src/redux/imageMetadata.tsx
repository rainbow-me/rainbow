import produce from 'immer';
import {
  getImageMetadata,
  saveImageMetadata,
} from '../handlers/localstorage/globalSettings';

// // -- Constants --------------------------------------- //
const CLEAR = 'imageMetadata/CLEAR';
const LOAD = 'imageMetadata/LOAD';
const MERGE = 'imageMetadata/MERGE';

export const clearImageMetadataCache = () => dispatch =>
  dispatch({ type: CLEAR });

export const imageMetadataCacheLoadState = () => async dispatch => {
  const metadataCache = await getImageMetadata();
  dispatch({
    payload: metadataCache,
    type: LOAD,
  });
};

export const updateImageMetadataCache = ({ id, metadata }) => (
  dispatch,
  getState
) => {
  const { imageMetadata } = getState().imageMetadata;
  dispatch({ id, metadata, type: MERGE });
  saveImageMetadata({
    ...imageMetadata,
    [id]: metadata,
  });
};

// // -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  imageMetadata: {},
};

export default (state = INITIAL_STATE, action) =>
  produce(state, draft => {
    if (action.type === LOAD) {
      draft.imageMetadata = action.payload;
    } else if (action.type === MERGE) {
      draft.imageMetadata[action.id] = action.metadata;
    } else if (action.type === CLEAR) {
      return INITIAL_STATE;
    }
  });

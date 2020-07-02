import produce from 'immer';
import {
  getImageMetadata,
  saveImageMetadata,
} from '../handlers/localstorage/globalSettings';

// // -- Constants --------------------------------------- //
const LOAD = 'imageMetadata/LOAD';
const MERGE = 'imageMetadata/MERGE';

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
    switch (action.type) {
      case LOAD:
        draft.imageMetadata = action.payload;
        break;
      case MERGE:
        draft.imageMetadata[action.id] = action.metadata;
        break;
      default:
        break;
    }
  });

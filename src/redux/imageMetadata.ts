import produce from 'immer';
import {
  getImageMetadata,
  saveImageMetadata,
} from '../handlers/localstorage/globalSettings';

// // -- Constants --------------------------------------- //
const CLEAR = 'imageMetadata/CLEAR';
const LOAD = 'imageMetadata/LOAD';
const MERGE = 'imageMetadata/MERGE';

export const clearImageMetadataCache = () => (dispatch: any) =>
  dispatch({ type: CLEAR });

export const imageMetadataCacheLoadState = () => async (dispatch: any) => {
  const metadataCache = await getImageMetadata();
  dispatch({
    payload: metadataCache,
    type: LOAD,
  });
};

export const updateImageMetadataCache = ({ id, metadata }: any) => (
  dispatch: any,
  getState: any
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

export default (state = INITIAL_STATE, action: any) =>
  produce(state, draft => {
    if (action.type === LOAD) {
      draft.imageMetadata = action.payload;
    } else if (action.type === MERGE) {
      // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      draft.imageMetadata[action?.id] = action.metadata;
    } else if (action.type === CLEAR) {
      return INITIAL_STATE;
    }
  });

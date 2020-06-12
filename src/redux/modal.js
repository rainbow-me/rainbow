// -- Constants --------------------------------------- //
const SET_MODAL_VISIBLE = 'modal/SET_MODAL_VISIBLE';

export const setModalVisible = visible => dispatch => {
  dispatch({ type: SET_MODAL_VISIBLE, visible });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  visible: true,
};

export default (state = INITIAL_STATE, action) => {
  if (action.type === SET_MODAL_VISIBLE && action.visible !== state.visible) {
    return {
      ...state,
      visible: action.visible,
    };
  }
  return state;
};

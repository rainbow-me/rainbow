import produce from 'immer';

// -- Constants --------------------------------------- //
const SET_OPEN_INVESTMENT_CARDS = 'openInvestmentCards/SET_OPEN_INVESTMENT_CARDS';
const PUSH_OPEN_INVESTMENT_CARD = 'openInvestmentCards/PUSH_OPEN_INVESTMENT_CARD';

export const setOpenInvestmentCards = payload => dispatch => dispatch({
  payload,
  type: SET_OPEN_INVESTMENT_CARDS,
});

export const pushOpenInvestmentCard = payload => dispatch => dispatch({
  payload,
  type: PUSH_OPEN_INVESTMENT_CARD,
});

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  openInvestmentCards: {},
};

export default (state = INITIAL_STATE, action) => (
  produce(state, draft => {
    if (action.type === SET_OPEN_INVESTMENT_CARDS) {
      draft.openInvestmentCards[action.payload.index] = action.payload.state;
    } else if (action.type === PUSH_OPEN_INVESTMENT_CARD) {
      draft.openInvestmentCards = state.openInvestmentCards.concat(false);
    }
  })
);

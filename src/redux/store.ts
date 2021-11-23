import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';
import reducers from './reducers';

const store = createStore(reducers, applyMiddleware(thunk));

export default store;

export type AppState = ReturnType<typeof store.getState>;
export type AppGetState = typeof store.getState;
export type AppDispatch = typeof store.dispatch;

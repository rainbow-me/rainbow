import { AnyAction, applyMiddleware, createStore } from 'redux';
import thunk, { ThunkMiddleware } from 'redux-thunk';
import reducers from './reducers';

const store = createStore(
  reducers,
  applyMiddleware(
    thunk as ThunkMiddleware<ReturnType<typeof reducers>, AnyAction, undefined>
  )
);

export default store;

export type AppState = ReturnType<typeof store.getState>;
export type AppGetState = typeof store.getState;
export type AppDispatch = typeof store.dispatch;

import thunk from 'redux-thunk';
import { applyMiddleware, createStore } from 'redux';

import reducers from './reducers';

export default createStore(
  reducers,
  applyMiddleware(thunk),
);

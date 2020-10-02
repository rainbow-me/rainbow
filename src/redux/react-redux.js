import isEqual from 'react-fast-compare';
import {
  connect,
  useSelector as oldUseSelector,
  Provider,
  useDispatch,
} from 'react-redux';

function useSelector(sel, eq = isEqual) {
  return oldUseSelector(sel, eq);
}

export { connect, Provider, useDispatch, useSelector };

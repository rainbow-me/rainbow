import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, AppState } from '../redux/store';

// https://react-redux.js.org/using-react-redux/usage-with-typescript#define-typed-hooks

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<AppState> = useSelector;

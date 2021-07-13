import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setOpenFamilyTabs } from '../redux/openStateSettings';
import {
  addShowcaseToken as rawAddShowcaseToken,
  removeShowcaseToken as rawRemoveShowcaseToken,
} from '../redux/showcaseTokens';
import useWebData from './useWebData';

export default function useShowcaseTokens() {
  const dispatch = useDispatch();
  const { updateWebShowcase } = useWebData();
  const showcaseTokens = useSelector(
    state => state.showcaseTokens.showcaseTokens
  );

  const addShowcaseToken = useCallback(
    async asset => {
      dispatch(rawAddShowcaseToken(asset));
      dispatch(setOpenFamilyTabs({ index: 'Showcase', state: true }));
      updateWebShowcase([...showcaseTokens, asset]);
    },
    [updateWebShowcase, dispatch, showcaseTokens]
  );

  const removeShowcaseToken = useCallback(
    async asset => {
      dispatch(rawRemoveShowcaseToken(asset));
      updateWebShowcase(showcaseTokens.filter(id => id !== asset));
    },
    [dispatch, showcaseTokens, updateWebShowcase]
  );

  return {
    addShowcaseToken,
    removeShowcaseToken,
    showcaseTokens,
  };
}

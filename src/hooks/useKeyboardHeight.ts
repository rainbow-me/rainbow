import { useCallback, useEffect } from 'react';
import { Keyboard } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/keyboardTy... Remove this comment to see the full error message
import KeyboardTypes from '@rainbow-me/helpers/keyboardTypes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/keyboardHeig... Remove this comment to see the full error message
import { setKeyboardHeight } from '@rainbow-me/redux/keyboardHeight';

const keyboardHeightsSelector = (state: any) =>
  state.keyboardHeight.keyboardHeight;

export default function useKeyboardHeight(options = {}) {
  // keyboards can different heights depending on whether
  // things like "autofill" or "autocomplete" are enabled on the target input.
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'keyboardType' does not exist on type '{}... Remove this comment to see the full error message
  const { keyboardType = KeyboardTypes.default } = options;

  const dispatch = useDispatch();

  const cachedKeyboardHeights = useSelector(keyboardHeightsSelector);
  const heightForKeyboardType = cachedKeyboardHeights?.[keyboardType];

  const handleKeyboardDidShow = useCallback(
    event => {
      const newHeight = Math.floor(event.endCoordinates.height);

      if (!heightForKeyboardType || newHeight !== heightForKeyboardType) {
        dispatch(
          setKeyboardHeight({
            height: newHeight,
            keyboardType,
          })
        );
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'scheduleLayoutAnimation' does not exist ... Remove this comment to see the full error message
        Keyboard.scheduleLayoutAnimation(event);
      }
    },
    [dispatch, heightForKeyboardType, keyboardType]
  );

  useEffect(() => {
    Keyboard.addListener('keyboardDidShow', handleKeyboardDidShow);
    return () => {
      Keyboard.removeListener('keyboardDidShow', handleKeyboardDidShow);
    };
  }, [handleKeyboardDidShow]);

  return heightForKeyboardType || cachedKeyboardHeights.default || 0;
}

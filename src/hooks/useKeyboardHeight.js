import { useCallback, useEffect, useRef } from 'react';
import { Keyboard } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import KeyboardTypes from '@rainbow-me/helpers/keyboardTypes';
import { setKeyboardHeight } from '@rainbow-me/redux/keyboardHeight';

const keyboardHeightsSelector = state => state.keyboardHeight.keyboardHeight;

export default function useKeyboardHeight(options = {}) {
  // keyboards can different heights depending on whether
  // things like "autofill" or "autocomplete" are enabled on the target input.
  const { keyboardType = KeyboardTypes.default } = options;
  const keyboardListener = useRef();

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
        Keyboard.scheduleLayoutAnimation(event);
      }
    },
    [dispatch, heightForKeyboardType, keyboardType]
  );

  useEffect(() => {
    keyboardListener.current = Keyboard.addListener(
      'keyboardDidShow',
      handleKeyboardDidShow
    );
    return () => {
      keyboardListener?.current.remove();
    };
  }, [handleKeyboardDidShow]);

  return heightForKeyboardType || cachedKeyboardHeights.default || 0;
}

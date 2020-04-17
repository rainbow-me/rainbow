import { useCallback, useEffect, useState } from 'react';
import { Keyboard } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { setKeyboardHeight as storeKeyboardHeight } from '../handlers/localstorage/globalSettings';
import { setKeyboardHeight } from '../redux/keyboardHeight';
import useDimensions from './useDimensions';

function getDefaultKeyboardHeight(screenHeight) {
  let keyboardHeight = 0;
  switch (screenHeight) {
    case 568:
      keyboardHeight = 216;
      break;
    case 667:
      keyboardHeight = 216;
      break;
    case 736:
      keyboardHeight = 226;
      break;
    case 812:
      keyboardHeight = 291;
      break;
    case 896:
      keyboardHeight = 301;
      break;
    default:
      keyboardHeight = Math.floor(screenHeight * 0.333);
  }
  return keyboardHeight;
}

export default function useKeyboardHeight() {
  const dispatch = useDispatch();
  const { height: screenHeight } = useDimensions();
  const [didMeasure, setDidMeasure] = useState(false);
  const cachedKeyboardHeight = useSelector(
    ({ keyboardHeight: { keyboardHeight } }) => keyboardHeight
  );

  const updateKeyboardHeight = useCallback(
    newHeight => {
      storeKeyboardHeight(newHeight);
      dispatch(setKeyboardHeight(newHeight));
    },
    [dispatch]
  );

  const handleKeyboardWillShow = useCallback(
    ({ endCoordinates: { height } }) => {
      if (height !== cachedKeyboardHeight) {
        updateKeyboardHeight(Math.floor(height));
      }
      setDidMeasure(true);
    },
    [cachedKeyboardHeight, updateKeyboardHeight]
  );

  useEffect(() => {
    let listener = undefined;

    if (!didMeasure) {
      listener = Keyboard.addListener(
        'keyboardWillShow',
        handleKeyboardWillShow
      );
    }

    return () => {
      if (listener) {
        Keyboard.removeListener('keyboardWillShow', handleKeyboardWillShow);
      }
    };
  }, [didMeasure, handleKeyboardWillShow]);

  return {
    keyboardHeight:
      cachedKeyboardHeight || getDefaultKeyboardHeight(screenHeight),
    updateKeyboardHeight,
  };
}

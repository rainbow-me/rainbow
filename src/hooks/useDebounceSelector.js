import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

const useDebounceSelector = (selector, time = 200) => {
  const result = useRef();
  const refTimeout = useRef();

  if (refTimeout.current) {
    clearTimeout(refTimeout.current);
  }

  const selectorData = useSelector(selector);
  const [data, setState] = useState(selectorData);

  useEffect(
    () => () => refTimeout.current && clearTimeout(refTimeout.current),
    []
  );

  if (time === 0) {
    return selectorData;
  }

  refTimeout.current = setTimeout(() => {
    if (result.current !== selectorData) {
      setState(selectorData);
    }
  }, time);

  return data;
};

export default useDebounceSelector;

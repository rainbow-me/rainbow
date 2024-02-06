import React, { useEffect, useState } from 'react';
import { usePrevious, useTimeout } from '../../hooks';
import Toast from './Toast';

export default function ToggleStateToast({ isAdded, addCopy, removeCopy }) {
  const [isVisible, setIsVisible] = useState(false);
  const wasAdded = usePrevious(isAdded);
  const [startTimeout, stopTimeout] = useTimeout();

  useEffect(() => {
    if (isAdded !== wasAdded && wasAdded !== undefined) {
      stopTimeout();
      setIsVisible(true);
      startTimeout(() => setIsVisible(false), 3000);
    }
  }, [isVisible, wasAdded, startTimeout, stopTimeout, isAdded]);

  return <Toast isVisible={isVisible} text={`􀁣 ${isAdded ? addCopy : removeCopy}`} />;
}

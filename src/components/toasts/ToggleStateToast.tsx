import React, { useEffect, useState } from 'react';
import { usePrevious, useTimeout } from '../../hooks';
// @ts-expect-error ts-migrate(6142) FIXME: Module './Toast' was resolved to '/Users/nickbytes... Remove this comment to see the full error message
import Toast from './Toast';

export default function ToggleStateToast({
  isAdded,
  addCopy,
  removeCopy,
}: any) {
  const [isVisible, setIsVisible] = useState(false);
  const wasAdded = usePrevious(isAdded);
  const [startTimeout, stopTimeout] = useTimeout();

  useEffect(() => {
    if (isAdded !== wasAdded && wasAdded !== undefined) {
      // @ts-expect-error ts-migrate(2349) FIXME: This expression is not callable.
      stopTimeout();
      setIsVisible(true);
      // @ts-expect-error ts-migrate(2349) FIXME: This expression is not callable.
      startTimeout(() => setIsVisible(false), 3000);
    }
  }, [isVisible, wasAdded, startTimeout, stopTimeout, isAdded]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Toast isVisible={isVisible} text={`􀁣 ${isAdded ? addCopy : removeCopy}`} />
  );
}

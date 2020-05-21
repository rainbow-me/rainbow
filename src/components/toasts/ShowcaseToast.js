import React, { useEffect, useState } from 'react';
import { usePrevious, useTimeout } from '../../hooks';
import Toast from './Toast';

export default function ShowcaseToast({ isShowcaseAsset }) {
  const [isVisible, setIsVisible] = useState(false);
  const prevIsShowcaseAsset = usePrevious(isShowcaseAsset);
  const [startTimeout, stopTimeout] = useTimeout();

  useEffect(() => {
    if (
      isShowcaseAsset !== prevIsShowcaseAsset &&
      prevIsShowcaseAsset !== undefined
    ) {
      stopTimeout();
      setIsVisible(true);
      startTimeout(() => setIsVisible(false), 3000);
    }
  }, [
    isShowcaseAsset,
    isVisible,
    prevIsShowcaseAsset,
    startTimeout,
    stopTimeout,
  ]);

  return (
    <Toast
      isVisible={isVisible}
      text={`􀁣 ${isShowcaseAsset ? 'Added to' : 'Removed from'} showcase`}
    />
  );
}

import React, { useEffect } from 'react';
import { useTimeout } from '../../hooks';
import Toast from './Toast';
import { atom, useRecoilState } from 'recoil';

export const refreshMetadataToastAtom = atom({
  default: false,
  key: 'refreshMetadataToastAtom',
});

export default function RefreshMetadataToast() {
  const [startTimeout, stopTimeout] = useTimeout();
  const [isToastActive, setToastActive] = useRecoilState(
    refreshMetadataToastAtom
  );

  console.log(isToastActive, 'HELP');
  // useEffect(() => {
  //   if (isToastActive) {
  //     stopTimeout();
  //     startTimeout(() => setToastActive(false), 3000);
  //   }
  // }, [isToastActive, setToastActive, startTimeout, stopTimeout]);

  return <Toast isVisible={true} text={`􀁣TEST`} />;
}

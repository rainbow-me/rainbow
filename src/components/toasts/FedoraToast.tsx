import React, { forwardRef, useImperativeHandle, useState } from 'react';
import Toast from './Toast';

// eslint-disable-next-line react/display-name
const FedoraToast = forwardRef((_, ref) => {
  const [visible, setVisible] = useState(false);
  useImperativeHandle(ref, () => ({
    show: () => setVisible(true),
  }));
  // @ts-ignore
  return <Toast isVisible={visible} text="Custom bundle" />;
});

export default FedoraToast;

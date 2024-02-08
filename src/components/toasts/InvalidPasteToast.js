import lang from 'i18n-js';
import React from 'react';
import Toast from './Toast';
import { useInvalidPaste } from '@/hooks';

export default function InvalidPasteToast(props) {
  const { isInvalidPaste } = useInvalidPaste();

  return <Toast isVisible={isInvalidPaste} text={`􀉾 ${lang.t('toasts.invalid_paste')}`} {...props} />;
}

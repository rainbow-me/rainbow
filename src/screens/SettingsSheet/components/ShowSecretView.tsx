import React, { useEffect } from 'react';
import { Centered } from '../../../components/layout';
import { ModalHeaderHeight } from '../../../components/modal';
import SecretDisplaySection from '../../../components/secret-display/SecretDisplaySection';
import { analytics } from '@/analytics';

export default function ShowSecretView() {
  useEffect(() => {
    analytics.track('Show Secret View', {
      category: 'settings backup',
    });
  }, []);

  return (
    <Centered flex={1} paddingBottom={ModalHeaderHeight}>
      {/* @ts-ignore */}
      <SecretDisplaySection />
    </Centered>
  );
}

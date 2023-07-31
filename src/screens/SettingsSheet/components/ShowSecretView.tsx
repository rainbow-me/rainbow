import React, { useEffect } from 'react';
import { Centered } from '@/components/layout';
import { ModalHeaderHeight } from '@/components/modal';
import { analytics } from '@/analytics';
import { SecretDisplaySection } from '@/components/secret-display/SecretDisplaySection';

export default function ShowSecretView() {
  useEffect(() => {
    analytics.track('Show Secret View', {
      category: 'settings backup',
    });
  }, []);

  return (
    <Centered flex={1} paddingBottom={ModalHeaderHeight}>
      <SecretDisplaySection />
    </Centered>
  );
}

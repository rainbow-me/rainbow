import analytics from '@segment/analytics-react-native';
import React, { useEffect } from 'react';
import { Centered } from '../../layout';
import { ModalHeaderHeight } from '../../modal';
import SecretDisplaySection from '../../secret-display/SecretDisplaySection';

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

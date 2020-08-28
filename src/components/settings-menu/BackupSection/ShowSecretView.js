import analytics from '@segment/analytics-react-native';
import React, { useEffect } from 'react';
import { Centered } from '../../layout';
import SecretDisplaySection from '../../secret-display/SecretDisplaySection';

const ShowSecretView = () => {
  useEffect(() => {
    analytics.track('Show Secret View', {
      category: 'settings backup',
    });
  }, []);

  return (
    <Centered paddingBottom={15} paddingTop={90}>
      <SecretDisplaySection />
    </Centered>
  );
};
export default ShowSecretView;

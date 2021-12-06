import analytics from '@segment/analytics-react-native';
import React, { useEffect } from 'react';
import { Centered } from '../../layout';
import { ModalHeaderHeight } from '../../modal';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../secret-display/SecretDisplaySection'... Remove this comment to see the full error message
import SecretDisplaySection from '../../secret-display/SecretDisplaySection';

export default function ShowSecretView() {
  useEffect(() => {
    analytics.track('Show Secret View', {
      category: 'settings backup',
    });
  }, []);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Centered flex={1} paddingBottom={ModalHeaderHeight}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <SecretDisplaySection />
    </Centered>
  );
}

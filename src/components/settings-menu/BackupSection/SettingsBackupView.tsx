import { useRoute } from '@react-navigation/core';
import React from 'react';
// @ts-expect-error ts-migrate(6142) FIXME: Module './AlreadyBackedUpView' was resolved to '/U... Remove this comment to see the full error message
import AlreadyBackedUpView from './AlreadyBackedUpView';
// @ts-expect-error ts-migrate(6142) FIXME: Module './NeedsBackupView' was resolved to '/Users... Remove this comment to see the full error message
import NeedsBackupView from './NeedsBackupView';

export default function SettingsBackupView() {
  const { params } = useRoute();
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'type' does not exist on type 'object'.
  if (params?.type === 'AlreadyBackedUpView') {
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    return <AlreadyBackedUpView />;
  } else {
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    return <NeedsBackupView />;
  }
}

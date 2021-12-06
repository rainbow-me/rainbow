import { useRoute } from '@react-navigation/native';
import React from 'react';
import isNativeStackAvailable from '../../../helpers/isNativeStackAvailable';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../TouchableBackdrop' was resolved to '... Remove this comment to see the full error message
import TouchableBackdrop from '../../TouchableBackdrop';
import { AssetPanel, FloatingPanels } from '../../floating-panels';
import { KeyboardFixedOpenLayout } from '../../layout';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useDimensions } from '@rainbow-me/hooks';

export default function ProfileModal({ onPressBackdrop, ...props }: any) {
  const { width: deviceWidth } = useDimensions();
  const { params } = useRoute();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <KeyboardFixedOpenLayout
      additionalPadding={
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'additionalPadding' does not exist on typ... Remove this comment to see the full error message
        params?.additionalPadding && isNativeStackAvailable ? 80 : 0
      }
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <TouchableBackdrop onPress={onPressBackdrop} />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <FloatingPanels maxWidth={deviceWidth - 110}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <AssetPanel {...props} />
      </FloatingPanels>
    </KeyboardFixedOpenLayout>
  );
}

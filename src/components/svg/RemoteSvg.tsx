import React from 'react';
// @ts-expect-error ts-migrate(6142) FIXME: Module './SvgImage' was resolved to '/Users/nickby... Remove this comment to see the full error message
import SvgImage from './SvgImage';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useSafeImageUri } from '@rainbow-me/hooks';

const RemoteSvg = (props: any) => {
  const safeUri = useSafeImageUri(props.uri, true);
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  return <SvgImage {...props} source={{ uri: safeUri }} />;
};

export default RemoteSvg;

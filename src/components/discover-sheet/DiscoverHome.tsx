import React from 'react';
// @ts-expect-error ts-migrate(6142) FIXME: Module './BottomSpacer' was resolved to '/Users/ni... Remove this comment to see the full error message
import BottomSpacer from './BottomSpacer';
// @ts-expect-error ts-migrate(6142) FIXME: Module './ListsSection' was resolved to '/Users/ni... Remove this comment to see the full error message
import Lists from './ListsSection';
// @ts-expect-error ts-migrate(6142) FIXME: Module './PulseIndexSection' was resolved to '/Use... Remove this comment to see the full error message
import PulseIndex from './PulseIndexSection';
// import Strategies from './StrategiesSection';
// @ts-expect-error ts-migrate(6142) FIXME: Module './TopMoversSection' was resolved to '/User... Remove this comment to see the full error message
import TopMoversSection from './TopMoversSection';
// @ts-expect-error ts-migrate(6142) FIXME: Module './UniswapPoolsSection' was resolved to '/U... Remove this comment to see the full error message
import UniswapPools from './UniswapPoolsSection';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useAccountSettings } from '@rainbow-me/hooks';

export default function DiscoverHome() {
  const { accountAddress } = useAccountSettings();
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <React.Fragment>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <TopMoversSection />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <PulseIndex />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Lists />
      {/* <Strategies /> */}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      {accountAddress ? <UniswapPools /> : null}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <BottomSpacer />
    </React.Fragment>
  );
}

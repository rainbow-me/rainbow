import { map } from 'lodash';
import React, { Fragment } from 'react';
import { OpacityToggler } from '../animations';
// @ts-expect-error ts-migrate(6142) FIXME: Module './SavingsListHeader' was resolved to '/Use... Remove this comment to see the full error message
import SavingsListHeader from './SavingsListHeader';
// @ts-expect-error ts-migrate(6142) FIXME: Module './SavingsListRow' was resolved to '/Users/... Remove this comment to see the full error message
import SavingsListRow from './SavingsListRow';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useFrameDelayedValue, useOpenSavings } from '@rainbow-me/hooks';

const renderSavingsListRow = (item: any) =>
  item?.underlying ? (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <SavingsListRow key={item?.underlying.symbol} {...item} />
  ) : null;

export default function SavingsListWrapper({ assets, totalValue = '0' }: any) {
  const { isSavingsOpen, toggleOpenSavings } = useOpenSavings();
  // wait until refresh of RLV
  const delayedIsSavingsOpen =
    useFrameDelayedValue(isSavingsOpen) && isSavingsOpen;
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Fragment>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <SavingsListHeader
        isOpen={isSavingsOpen}
        onPress={toggleOpenSavings}
        savingsSumValue={totalValue}
        showSumValue
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <OpacityToggler
        isVisible={!delayedIsSavingsOpen}
        pointerEvents={isSavingsOpen ? 'auto' : 'none'}
      >
        {map(assets, renderSavingsListRow)}
      </OpacityToggler>
    </Fragment>
  );
}

import React from 'react';
import { magicMemo } from '../../utils';
import { DividerSize } from '../Divider';
import { ListHeader, ListHeaderHeight } from '../list';
import { H1 } from '../text';

export const AssetListHeaderHeight = ListHeaderHeight + DividerSize;

const AssetListHeader = ({
  contextMenuOptions,
  isCoinListEdited,
  isSticky,
  title,
  totalValue,
  ...props
}) => (
  <ListHeader
    contextMenuOptions={contextMenuOptions}
    isCoinListEdited={isCoinListEdited}
    isSticky={isSticky}
    title={title}
    totalValue={totalValue}
    {...props}
  >
    {totalValue ? (
      <H1 align="right" letterSpacing="roundedTight" weight="semibold">
        {totalValue}
      </H1>
    ) : null}
  </ListHeader>
);

export default magicMemo(AssetListHeader, [
  'contextMenuOptions',
  'isCoinListEdited',
  'title',
  'totalValue',
]);

import React from 'react';
import styled from 'styled-components';
import { magicMemo } from '../../utils';
import { ListHeader } from '../list';
import { Text } from '../text';

const ActivityListHeaderTitle = styled(Text).attrs({
  size: 'larger',
  weight: 'bold',
})``;

const ActivityListHeader = (props: any) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <ListHeader
    {...props}
    isSticky
    showDivider={false}
    titleRenderer={ActivityListHeaderTitle}
  />
);

// @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 2.
export default magicMemo(ActivityListHeader, 'title');

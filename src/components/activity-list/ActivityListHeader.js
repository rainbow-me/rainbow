import styled from '@terrysahaidak/style-thing';
import React from 'react';
import { magicMemo } from '../../utils';
import { ListHeader } from '../list';
import { Text } from '../text';

const ActivityListHeaderTitle = styled(Text).attrs({
  size: 'larger',
  weight: 'bold',
})({});

const ActivityListHeader = props => (
  <ListHeader
    {...props}
    isSticky
    showDivider={false}
    titleRenderer={ActivityListHeaderTitle}
  />
);

export default magicMemo(ActivityListHeader, 'title');

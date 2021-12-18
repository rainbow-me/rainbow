import React from 'react';
import { magicMemo } from '../../utils';
import { ListHeader } from '../list';
import { Text } from '../text';
import styled from 'styled-components';

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
